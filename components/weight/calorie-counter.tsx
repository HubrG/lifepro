"use client";

import { Flame } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCalorieCounter } from "@/hooks/use-calorie-counter";
import { formatCalories } from "@/lib/utils/format";

export function CalorieCounter() {
  const { caloriesBurned, bmr } = useCalorieCounter();

  if (bmr === 0) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const percentageOfDay = (caloriesBurned / bmr) * 100;

  return (
    <Card className="relative overflow-hidden">
      {/* Animation de fond */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 transition-all duration-1000"
        style={{
          width: `${Math.min(percentageOfDay, 100)}%`,
        }}
      />

      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          Calories Brûlées au Repos
        </CardTitle>
        <CardDescription>
          Depuis minuit • BMR: {formatCalories(bmr)}/jour
        </CardDescription>
      </CardHeader>

      <CardContent className="relative">
        <div className="space-y-4">
          {/* Compteur principal */}
          <div className="text-center">
            <div className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {Math.floor(caloriesBurned).toLocaleString("fr-FR")}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              kcal brûlées aujourd'hui
            </div>
          </div>

          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progression du jour</span>
              <span>{percentageOfDay.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000"
                style={{ width: `${Math.min(percentageOfDay, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats supplémentaires */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Par heure</div>
              <div className="text-sm font-semibold">
                {Math.floor(bmr / 24)} kcal
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Par minute</div>
              <div className="text-sm font-semibold">
                {((bmr / 24 / 60)).toFixed(1)} kcal
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Par seconde</div>
              <div className="text-sm font-semibold">
                {((bmr / 24 / 60 / 60)).toFixed(2)} kcal
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
