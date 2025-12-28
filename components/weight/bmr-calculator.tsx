"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMetabolicData } from "@/hooks/use-metabolic-data";
import { formatCalories, formatWeight, formatPercentage } from "@/lib/utils/format";
import { formatDate, formatDistanceToNow } from "@/lib/utils/date";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Calendar, Target, TrendingDown } from "lucide-react";

export function BMRCalculator() {
  const metabolicData = useMetabolicData();

  if (!metabolicData) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const {
    bmr,
    tdee,
    dailyDeficit,
    weeklyGoalKg,
    estimatedCompletionDate,
    daysRemaining,
    dailyCalorieTarget,
  } = metabolicData;

  const isOnTrack = dailyDeficit > 0 && dailyDeficit <= 1100; // Max recommandé

  return (
    <div className="space-y-6">
      {/* Cards principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BMR</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCalories(bmr)}</div>
            <p className="text-xs text-muted-foreground">
              Métabolisme de base au repos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TDEE</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCalories(tdee)}</div>
            <p className="text-xs text-muted-foreground">
              Dépense énergétique totale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Déficit quotidien</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCalories(dailyDeficit)}</div>
            <p className="text-xs text-muted-foreground">
              Restriction nécessaire
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jours restants</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysRemaining}</div>
            <p className="text-xs text-muted-foreground">
              Jusqu'à l'objectif
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Card détaillée */}
      <Card>
        <CardHeader>
          <CardTitle>Détails de votre plan</CardTitle>
          <CardDescription>
            Calculs basés sur la formule de Mifflin-St Jeor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Calories cibles quotidiennes
              </div>
              <div className="text-2xl font-bold">
                {formatCalories(dailyCalorieTarget)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pour atteindre votre objectif
              </p>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Perte hebdomadaire estimée
              </div>
              <div className="text-2xl font-bold">
                {formatWeight(weeklyGoalKg)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Basé sur votre déficit actuel
              </p>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Date estimée de fin
              </div>
              <div className="text-xl font-bold">
                {formatDate(estimatedCompletionDate)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(estimatedCompletionDate)}
              </p>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Statut
              </div>
              <div className={`text-xl font-bold ${isOnTrack ? "text-green-600" : "text-orange-600"}`}>
                {isOnTrack ? "Sur la bonne voie ✓" : "Ajuster le déficit"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isOnTrack
                  ? "Déficit sain et atteignable"
                  : "Le déficit est trop élevé, ajustez la date cible"}
              </p>
            </div>
          </div>

          {dailyDeficit > 1100 && (
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950 p-4">
              <p className="text-sm text-orange-900 dark:text-orange-100">
                ⚠️ <strong>Attention:</strong> Un déficit supérieur à 1100 kcal/jour peut être difficile à maintenir et potentiellement néfaste pour la santé. Envisagez d'allonger votre date cible.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
