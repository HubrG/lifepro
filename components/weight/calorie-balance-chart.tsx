"use client";

import { useDailySummaries } from "@/lib/queries/use-daily-summary";
import { useProfile } from "@/lib/queries/use-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceLine } from "recharts";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { CALORIES_PER_KG_FAT } from "@/lib/constants/nutrition";

interface CalorieBalanceChartProps {
  days?: number;
}

export function CalorieBalanceChart({ days = 7 }: CalorieBalanceChartProps) {
  const { data: summaries, isLoading } = useDailySummaries(days);
  const { data: profile } = useProfile();

  // Calculer le déficit quotidien nécessaire pour atteindre l'objectif
  let dailyDeficitNeeded = 0;
  if (profile && profile.currentWeight && profile.targetWeight && profile.targetDate) {
    const weightToLose = profile.currentWeight - profile.targetWeight;
    const daysRemaining = Math.max(1, differenceInDays(new Date(profile.targetDate), new Date()));
    const totalCaloriesNeeded = weightToLose * CALORIES_PER_KG_FAT;
    dailyDeficitNeeded = Math.round(totalCaloriesNeeded / daysRemaining);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance calorique</CardTitle>
          <CardDescription>Évolution sur les {days} derniers jours</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!summaries || summaries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance calorique</CardTitle>
          <CardDescription>Évolution sur les {days} derniers jours</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-sm text-muted-foreground">
            Aucune donnée disponible. Commencez à suivre votre alimentation !
          </p>
        </CardContent>
      </Card>
    );
  }

  // Vérifier si le profil est complet (TDEE > 0)
  const hasValidProfile = summaries.some(s => s.tdee > 0);
  const hasNoCalorieData = summaries.every(s => s.caloriesConsumed === 0);

  // Formater les données pour le graphique
  const chartData = summaries.map((summary) => ({
    date: format(new Date(summary.date), "dd MMM", { locale: fr }),
    fullDate: format(new Date(summary.date), "EEEE dd MMMM", { locale: fr }),
    consumed: Math.round(summary.caloriesConsumed),
    burned: Math.round(summary.totalCaloriesBurned),
    balance: Math.round(summary.calorieBalance),
    tdee: Math.round(summary.tdee),
  }));

  // Calculer les statistiques avec validation
  const avgConsumed = Math.round(
    chartData.reduce((sum, day) => sum + (day.consumed || 0), 0) / chartData.length
  ) || 0;
  const avgBurned = Math.round(
    chartData.reduce((sum, day) => sum + (day.burned || 0), 0) / chartData.length
  ) || 0;
  const avgBalance = Math.round(
    chartData.reduce((sum, day) => sum + (day.balance || 0), 0) / chartData.length
  ) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance calorique quotidienne</CardTitle>
        <CardDescription>
          Évolution sur les {days} derniers jours • Moyenne : {avgBalance > 0 ? "+" : ""}{avgBalance} kcal/jour
          {dailyDeficitNeeded > 0 && ` • Déficit nécessaire : -${dailyDeficitNeeded} kcal/jour`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Avertissement si profil incomplet */}
        {!hasValidProfile && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ Profil incomplet
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Complétez votre profil (âge, taille, poids, sexe, niveau d'activité) pour voir les calories brûlées et la balance calorique.
            </p>
          </div>
        )}

        {/* Statistiques résumées */}
        <div className={`grid gap-4 mb-6 ${dailyDeficitNeeded > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Consommées (moy)</p>
            <p className="text-2xl font-bold text-green-600">{avgConsumed}</p>
            <p className="text-xs text-muted-foreground">kcal/jour</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Brûlées (moy)</p>
            <p className="text-2xl font-bold text-red-600">{avgBurned}</p>
            <p className="text-xs text-muted-foreground">kcal/jour</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Balance (moy)</p>
            <p className={`text-2xl font-bold ${avgBalance > 0 ? "text-orange-600" : "text-blue-600"}`}>
              {avgBalance > 0 ? "+" : ""}{avgBalance}
            </p>
            <p className="text-xs text-muted-foreground">kcal/jour</p>
          </div>
          {dailyDeficitNeeded > 0 && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Déficit nécessaire</p>
              <p className="text-2xl font-bold text-purple-600">-{dailyDeficitNeeded}</p>
              <p className="text-xs text-muted-foreground">kcal/jour</p>
              {avgBalance !== 0 && (
                <p className={`text-xs mt-1 font-medium ${
                  avgBalance <= -dailyDeficitNeeded * 0.9
                    ? "text-green-600"
                    : avgBalance <= -dailyDeficitNeeded * 0.7
                    ? "text-orange-600"
                    : "text-red-600"
                }`}>
                  {avgBalance <= -dailyDeficitNeeded * 0.9
                    ? "✓ Objectif atteint"
                    : avgBalance <= -dailyDeficitNeeded * 0.7
                    ? "⚠ Presque bon"
                    : "✗ Insuffisant"}
                </p>
              )}
            </div>
          )}
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
              style={{ fontSize: "12px" }}
              label={{ value: "Calories (kcal)", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;

                const data = payload[0].payload;
                return (
                  <div className="bg-background border rounded-lg shadow-lg p-3">
                    <p className="font-semibold mb-2">{data.fullDate}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>Consommées : {data.consumed} kcal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span>Brûlées : {data.burned} kcal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>TDEE : {data.tdee} kcal</span>
                      </div>
                      <div className="pt-2 mt-2 border-t">
                        <span className={`font-semibold ${data.balance > 0 ? "text-orange-600" : "text-blue-600"}`}>
                          Balance : {data.balance > 0 ? "+" : ""}{data.balance} kcal
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend />
            {/* Ligne de référence pour le déficit quotidien nécessaire */}
            {dailyDeficitNeeded > 0 && (
              <ReferenceLine
                y={-dailyDeficitNeeded}
                stroke="#9333ea"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{
                  value: `Objectif: -${dailyDeficitNeeded} kcal`,
                  position: "right",
                  fill: "#9333ea",
                  fontSize: 12,
                }}
              />
            )}
            <Bar
              dataKey="consumed"
              name="Consommées"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="burned"
              name="Brûlées"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="balance"
              name="Balance"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Légende explicative */}
        <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
          <p className="font-semibold mb-2">Comprendre la balance calorique :</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• <strong className="text-green-600">Vert</strong> : Calories consommées (alimentation)</li>
            <li>• <strong className="text-red-600">Rouge</strong> : Calories brûlées (TDEE + activités)</li>
            <li>• <strong className="text-blue-600">Ligne bleue</strong> : Balance nette (consommé - brûlé)</li>
            {dailyDeficitNeeded > 0 && (
              <li>• <strong className="text-purple-600">Ligne pointillée violette</strong> : Déficit quotidien nécessaire pour atteindre votre objectif (-{dailyDeficitNeeded} kcal/jour)</li>
            )}
            <li>• Balance négative = déficit calorique = perte de poids ✅</li>
            <li>• Balance positive = surplus calorique = prise de poids ⚠️</li>
            {dailyDeficitNeeded > 0 && (
              <li>• <strong>Objectif</strong> : Maintenir la balance en-dessous de la ligne violette pour perdre du poids au rythme prévu</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
