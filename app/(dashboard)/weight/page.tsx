"use client";

import { differenceInDays, addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { useProfile } from "@/lib/queries/use-profile";
import { useWeightEntries } from "@/lib/queries/use-weight-entries";
import { WeightEntryForm } from "@/components/weight/weight-entry-form";
import { WeightChart } from "@/components/weight/weight-chart";
import { WeightEntriesList } from "@/components/weight/weight-entries-list";
import { CalorieCounter } from "@/components/weight/calorie-counter";
import { CalorieBalanceChart } from "@/components/weight/calorie-balance-chart";
import { BMIChart } from "@/components/weight/bmi-chart";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function WeightPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: entries, isLoading: entriesLoading } = useWeightEntries(1);
  const { data: allEntries } = useWeightEntries(365); // Toutes les entrées pour calculer le taux

  const isLoading = profileLoading || entriesLoading;

  // Calculs des stats
  const currentWeight = entries?.[0]?.weight || profile?.currentWeight || 0;
  const targetWeight = profile?.targetWeight || 0;
  const initialWeight = profile?.currentWeight || currentWeight;
  const weightLost = initialWeight - currentWeight;
  const totalToLose = initialWeight - targetWeight;
  const progress = totalToLose > 0 ? (weightLost / totalToLose) * 100 : 0;
  const daysRemaining = profile?.targetDate
    ? Math.max(0, differenceInDays(new Date(profile.targetDate), new Date()))
    : 0;

  // Calcul de la date de fin estimée basée sur la progression réelle
  let estimatedEndDate: Date | null = null;
  let estimatedDaysRemaining = 0;

  if (allEntries && allEntries.length >= 2 && targetWeight > 0) {
    // Trier par date croissante
    const sortedEntries = [...allEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];

    const weightLostSoFar = firstEntry.weight - lastEntry.weight;
    const daysElapsed = differenceInDays(new Date(lastEntry.date), new Date(firstEntry.date));

    if (daysElapsed > 0 && weightLostSoFar > 0) {
      // Taux de perte moyen par jour
      const lossRatePerDay = weightLostSoFar / daysElapsed;

      // Poids restant à perdre
      const weightRemaining = currentWeight - targetWeight;

      if (weightRemaining > 0 && lossRatePerDay > 0) {
        // Estimation des jours restants
        estimatedDaysRemaining = Math.ceil(weightRemaining / lossRatePerDay);
        estimatedEndDate = addDays(new Date(), estimatedDaysRemaining);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suivi de Poids</h2>
          <p className="text-muted-foreground">
            Suivez votre progression et vos objectifs
          </p>
        </div>
        <WeightEntryForm />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Poids Actuel
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <div className="text-2xl font-bold">
              {currentWeight.toFixed(1)} kg
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Objectif
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <div className="text-2xl font-bold">
              {targetWeight.toFixed(1)} kg
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Progression
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <div className="text-2xl font-bold">
              {progress.toFixed(0)}%
            </div>
          )}
          {!isLoading && weightLost !== 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {weightLost > 0 ? "-" : "+"}{Math.abs(weightLost).toFixed(1)} kg
            </p>
          )}
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Jours Restants
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <div className="text-2xl font-bold">{daysRemaining}</div>
          )}
          {profile?.targetDate && !isLoading && (
            <p className="text-xs text-muted-foreground mt-1">
              Objectif: {format(new Date(profile.targetDate), "d MMM yyyy", { locale: fr })}
            </p>
          )}
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Date Estimée
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : estimatedEndDate ? (
            <>
              <div className="text-2xl font-bold">{estimatedDaysRemaining}j</div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(estimatedEndDate, "d MMM yyyy", { locale: fr })}
              </p>
              {profile?.targetDate && (
                <p className={`text-xs mt-1 font-medium ${
                  estimatedDaysRemaining <= daysRemaining
                    ? "text-green-600 dark:text-green-400"
                    : "text-orange-600 dark:text-orange-400"
                }`}>
                  {estimatedDaysRemaining <= daysRemaining
                    ? `✓ En avance de ${daysRemaining - estimatedDaysRemaining}j`
                    : `⚠ Retard de ${estimatedDaysRemaining - daysRemaining}j`}
                </p>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Ajoutez plus de pesées
            </div>
          )}
        </Card>
      </div>

      {/* Calorie Counter */}
      <CalorieCounter />

      {/* Weight Chart */}
      <WeightChart />

      {/* BMI Chart */}
      <BMIChart limit={30} />

      {/* Calorie Balance Chart */}
      <CalorieBalanceChart days={7} />

      {/* Entries List */}
      <WeightEntriesList />
    </div>
  );
}
