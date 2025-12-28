"use client";

import { useWeightEntries } from "@/lib/queries/use-weight-entries";
import { useProfile } from "@/lib/queries/use-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface BMIChartProps {
  limit?: number;
}

// Catégories IMC avec couleurs
const BMI_ZONES = [
  { min: 0, max: 18.5, label: "Insuffisance pondérale", color: "#3b82f6" },
  { min: 18.5, max: 25, label: "Poids normal", color: "#22c55e" },
  { min: 25, max: 30, label: "Surpoids", color: "#f59e0b" },
  { min: 30, max: 35, label: "Obésité modérée", color: "#ef4444" },
  { min: 35, max: 50, label: "Obésité sévère", color: "#991b1b" },
];

export function BMIChart({ limit = 30 }: BMIChartProps) {
  const { data: entries, isLoading: entriesLoading } = useWeightEntries(limit);
  const { data: profile, isLoading: profileLoading } = useProfile();

  const isLoading = entriesLoading || profileLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Évolution IMC</CardTitle>
          <CardDescription>Indice de Masse Corporelle au fil du temps</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!profile || !profile.height) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Évolution IMC</CardTitle>
          <CardDescription>Indice de Masse Corporelle au fil du temps</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Profil incomplet
            </p>
            <p className="text-xs text-muted-foreground">
              Veuillez compléter votre profil (notamment votre taille) pour voir votre IMC
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Évolution IMC</CardTitle>
          <CardDescription>Indice de Masse Corporelle au fil du temps</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-sm text-muted-foreground">
            Aucune donnée de poids disponible. Commencez à suivre votre poids !
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculer l'IMC pour chaque entrée
  const heightInMeters = profile.height / 100;
  const chartData = entries
    .map((entry) => {
      const bmi = entry.weight / (heightInMeters * heightInMeters);
      return {
        date: format(new Date(entry.date), "dd MMM", { locale: fr }),
        fullDate: format(new Date(entry.date), "EEEE dd MMMM yyyy", { locale: fr }),
        bmi: Math.round(bmi * 10) / 10, // Arrondi à 1 décimale
        weight: entry.weight,
      };
    })
    .reverse(); // Du plus ancien au plus récent

  // Calculer IMC actuel et cible
  const currentBMI = profile.currentWeight / (heightInMeters * heightInMeters);
  const targetBMI = profile.targetWeight / (heightInMeters * heightInMeters);

  // Déterminer la zone IMC actuelle
  const getCurrentZone = (bmi: number) => {
    return BMI_ZONES.find(zone => bmi >= zone.min && bmi < zone.max);
  };

  const currentZone = getCurrentZone(currentBMI);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution IMC</CardTitle>
        <CardDescription>
          Indice de Masse Corporelle • Actuel : {Math.round(currentBMI * 10) / 10} ({currentZone?.label})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Statistiques résumées */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">IMC Actuel</p>
            <p className="text-2xl font-bold" style={{ color: currentZone?.color }}>
              {Math.round(currentBMI * 10) / 10}
            </p>
            <p className="text-xs text-muted-foreground">{currentZone?.label}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">IMC Objectif</p>
            <p className="text-2xl font-bold text-green-600">
              {Math.round(targetBMI * 10) / 10}
            </p>
            <p className="text-xs text-muted-foreground">
              {getCurrentZone(targetBMI)?.label}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">À perdre</p>
            <p className="text-2xl font-bold text-blue-600">
              {Math.round((currentBMI - targetBMI) * 10) / 10}
            </p>
            <p className="text-xs text-muted-foreground">points IMC</p>
          </div>
        </div>

        {/* Graphique */}
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              domain={[15, 35]}
              style={{ fontSize: "12px" }}
              label={{ value: "IMC", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;

                const data = payload[0].payload;
                const zone = getCurrentZone(data.bmi);

                return (
                  <div className="bg-background border rounded-lg shadow-lg p-3">
                    <p className="font-semibold mb-2">{data.fullDate}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone?.color }} />
                        <span>IMC : {data.bmi}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Poids : {data.weight} kg</span>
                      </div>
                      <div className="pt-2 mt-2 border-t">
                        <span className="text-xs" style={{ color: zone?.color }}>
                          {zone?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend />

            {/* Zones de référence */}
            <ReferenceLine y={18.5} stroke="#3b82f6" strokeDasharray="3 3" label="Insuffisance" />
            <ReferenceLine y={25} stroke="#22c55e" strokeDasharray="3 3" label="Normal" />
            <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="3 3" label="Obésité" />

            {/* Ligne IMC cible */}
            <ReferenceLine
              y={Math.round(targetBMI * 10) / 10}
              stroke="#16a34a"
              strokeWidth={2}
              label="Objectif"
            />

            {/* Courbe IMC */}
            <Line
              type="monotone"
              dataKey="bmi"
              name="IMC"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ r: 5, fill: "#8b5cf6" }}
              activeDot={{ r: 7 }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Légende explicative */}
        <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
          <p className="font-semibold mb-2">Catégories IMC (OMS) :</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {BMI_ZONES.map((zone) => (
              <div key={zone.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                <span>
                  <strong>{zone.min} - {zone.max}</strong> : {zone.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-2">
            IMC = Poids (kg) / Taille² (m²)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
