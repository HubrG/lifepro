"use client";

import { useState } from "react";
import { useProfile } from "@/lib/queries/use-profile";
import { useWeightEntries } from "@/lib/queries/use-weight-entries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { Loader2, PieChartIcon, BarChart3, Gauge, TrendingDown } from "lucide-react";
import { CALORIES_PER_KG_FAT } from "@/lib/constants/nutrition";

const COLORS = {
  target: "#22c55e", // Vert pour poids cible
  excess: "#ef4444", // Rouge pour l'excédent à brûler
  current: "#3b82f6", // Bleu pour poids actuel
  background: "#e5e7eb", // Gris pour le fond
};

type ChartView = "pie" | "bar" | "gauge" | "progress";

function formatCalories(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}k`;
  }
  return value.toFixed(0);
}

export function CaloricWeightChart() {
  const [view, setView] = useState<ChartView>("pie");
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: entries, isLoading: entriesLoading } = useWeightEntries(1);

  const isLoading = profileLoading || entriesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance Calorique - Poids</CardTitle>
          <CardDescription>Représentation calorique de votre poids</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!profile || !profile.targetWeight) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance Calorique - Poids</CardTitle>
          <CardDescription>Représentation calorique de votre poids</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Profil incomplet</p>
            <p className="text-xs text-muted-foreground">
              Veuillez définir votre poids cible dans votre profil
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Utiliser le poids le plus récent ou le poids du profil
  const currentWeight = entries?.[0]?.weight || profile.currentWeight || 0;
  const targetWeight = profile.targetWeight || 0;
  const initialWeight = profile.currentWeight || currentWeight;

  // Si le poids actuel est inférieur ou égal au poids cible
  if (currentWeight <= targetWeight) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance Calorique - Poids</CardTitle>
          <CardDescription>Représentation calorique de votre poids</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 mb-2">Objectif atteint !</p>
            <p className="text-sm text-muted-foreground">
              Vous avez atteint ou dépassé votre poids cible de {targetWeight} kg
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculs
  const excessWeight = currentWeight - targetWeight;
  const targetCalories = targetWeight * CALORIES_PER_KG_FAT;
  const excessCalories = excessWeight * CALORIES_PER_KG_FAT;
  const currentCalories = currentWeight * CALORIES_PER_KG_FAT;
  const initialCalories = initialWeight * CALORIES_PER_KG_FAT;

  // Progression (poids perdu depuis le début)
  const weightLost = initialWeight - currentWeight;
  const totalToLose = initialWeight - targetWeight;
  const progressPercent = totalToLose > 0 ? Math.min(100, (weightLost / totalToLose) * 100) : 0;

  // Données pour les différents graphiques
  const pieData = [
    { name: `Poids cible (${targetWeight} kg)`, value: targetCalories, color: COLORS.target },
    { name: `À brûler (${excessWeight.toFixed(1)} kg)`, value: excessCalories, color: COLORS.excess },
  ];

  const barData = [
    {
      name: "Calories",
      cible: targetCalories,
      exces: excessCalories,
    },
  ];

  const gaugeData = [
    {
      name: "Progression",
      value: progressPercent,
      fill: progressPercent >= 75 ? COLORS.target : progressPercent >= 50 ? "#eab308" : COLORS.excess,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Balance Calorique - Poids</CardTitle>
            <CardDescription>
              {formatCalories(excessCalories)} kcal à brûler pour atteindre {targetWeight} kg
            </CardDescription>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as ChartView)}>
            <TabsList className="grid grid-cols-4 h-9">
              <TabsTrigger value="pie" className="px-2">
                <PieChartIcon className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="bar" className="px-2">
                <BarChart3 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="gauge" className="px-2">
                <Gauge className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="progress" className="px-2">
                <TrendingDown className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistiques résumées */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Poids Actuel</p>
            <p className="text-2xl font-bold">{currentWeight.toFixed(1)} kg</p>
            <p className="text-xs text-muted-foreground">{formatCalories(currentCalories)} kcal</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Poids Cible</p>
            <p className="text-2xl font-bold text-green-600">{targetWeight.toFixed(1)} kg</p>
            <p className="text-xs text-muted-foreground">{formatCalories(targetCalories)} kcal</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">À Perdre</p>
            <p className="text-2xl font-bold text-red-600">{excessWeight.toFixed(1)} kg</p>
            <p className="text-xs text-muted-foreground">{formatCalories(excessCalories)} kcal</p>
          </div>
        </div>

        {/* Graphiques selon la vue */}
        {view === "pie" && (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${formatCalories(value)} kcal`, ""]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}

        {view === "bar" && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(value) => formatCalories(value)}
                domain={[0, currentCalories]}
              />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${formatCalories(value)} kcal`,
                  name === "cible" ? "Poids cible" : "Excès à brûler",
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend
                formatter={(value) => (value === "cible" ? "Poids cible" : "Excès à brûler")}
              />
              <Bar dataKey="cible" stackId="a" fill={COLORS.target} radius={[4, 0, 0, 4]} />
              <Bar dataKey="exces" stackId="a" fill={COLORS.excess} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {view === "gauge" && (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart
                cx="50%"
                cy="100%"
                innerRadius="60%"
                outerRadius="100%"
                startAngle={180}
                endAngle={0}
                data={gaugeData}
              >
                <RadialBar
                  background={{ fill: COLORS.background }}
                  dataKey="value"
                  cornerRadius={10}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="text-center -mt-16">
              <p className="text-4xl font-bold">{progressPercent.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">de progression</p>
              <p className="text-xs text-muted-foreground mt-1">
                {weightLost > 0 ? `${weightLost.toFixed(1)} kg perdus` : "Début du parcours"}
                {totalToLose > 0 && ` sur ${totalToLose.toFixed(1)} kg`}
              </p>
            </div>
          </div>
        )}

        {view === "progress" && (
          <div className="space-y-6">
            {/* Barre de progression principale */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Poids initial</span>
                <span className="font-medium">Objectif</span>
              </div>
              <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                {/* Fond (total à perdre) */}
                <div className="absolute inset-0 bg-red-200 dark:bg-red-950" />
                {/* Progression (poids perdu) */}
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
                {/* Marqueur position actuelle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-blue-600 shadow-lg"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{initialWeight.toFixed(1)} kg</span>
                <span className="font-medium text-foreground">
                  {currentWeight.toFixed(1)} kg (actuel)
                </span>
                <span>{targetWeight.toFixed(1)} kg</span>
              </div>
            </div>

            {/* Détail des calories */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  Calories déjà brûlées
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCalories(weightLost * CALORIES_PER_KG_FAT)} kcal
                </p>
                <p className="text-xs text-green-600/70">{weightLost.toFixed(1)} kg perdus</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  Calories restantes
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCalories(excessCalories)} kcal
                </p>
                <p className="text-xs text-red-600/70">{excessWeight.toFixed(1)} kg à perdre</p>
              </div>
            </div>

            {/* Estimation temps */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Estimations à différents déficits :</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-background rounded">
                  <p className="font-bold">{Math.ceil(excessCalories / 300)} jours</p>
                  <p className="text-muted-foreground">-300 kcal/j</p>
                </div>
                <div className="text-center p-2 bg-background rounded border-2 border-primary">
                  <p className="font-bold">{Math.ceil(excessCalories / 500)} jours</p>
                  <p className="text-muted-foreground">-500 kcal/j</p>
                </div>
                <div className="text-center p-2 bg-background rounded">
                  <p className="font-bold">{Math.ceil(excessCalories / 750)} jours</p>
                  <p className="text-muted-foreground">-750 kcal/j</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Légende explicative (sauf pour progress qui a sa propre légende) */}
        {view !== "progress" && (
          <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
            <p className="font-semibold mb-2">Comment lire ce graphique :</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.target }} />
                <span>
                  <strong>Vert</strong> : Calories représentant votre poids cible
                </span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.excess }} />
                <span>
                  <strong>Rouge</strong> : Calories excédentaires à brûler
                </span>
              </li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Base : 1 kg de graisse ≈ {CALORIES_PER_KG_FAT.toLocaleString()} kcal
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
