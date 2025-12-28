"use client";

import { useMemo } from "react";
import { differenceInDays } from "date-fns";
import { useProfile } from "@/lib/queries/use-profile";
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyDeficit,
  estimateCompletionDate,
  calculateDailyCalorieTarget,
} from "@/lib/services/metabolic-calculations";
import { CALORIES_PER_KG_FAT } from "@/lib/constants/nutrition";
import type { MetabolicData } from "@/lib/types/calculations";

/**
 * Hook qui calcule toutes les données métaboliques basées sur le profil
 */
export function useMetabolicData(): MetabolicData | null {
  const { data: profile } = useProfile();

  return useMemo(() => {
    if (!profile) return null;

    // Calcul BMR (métabolisme de base)
    const bmr = calculateBMR(
      profile.age,
      profile.currentWeight,
      profile.height,
      profile.sex
    );

    // Calcul TDEE (dépense énergétique totale)
    const tdee = calculateTDEE(bmr, profile.activityLevel);

    // Calcul du déficit quotidien nécessaire
    const dailyDeficit = calculateDailyDeficit(
      profile.currentWeight,
      profile.targetWeight,
      profile.targetDate
    );

    // Déficit hebdomadaire
    const weeklyDeficit = dailyDeficit * 7;

    // Estimation de la date de fin
    const estimatedCompletionDate = estimateCompletionDate(
      profile.currentWeight,
      profile.targetWeight,
      dailyDeficit
    );

    // Jours restants
    const daysRemaining = Math.max(
      0,
      differenceInDays(profile.targetDate, new Date())
    );

    // Perte hebdomadaire en kg
    const weeklyGoalKg = (weeklyDeficit / CALORIES_PER_KG_FAT);

    // Calories cibles quotidiennes
    const dailyCalorieTarget = calculateDailyCalorieTarget(tdee, dailyDeficit);

    return {
      bmr,
      tdee,
      dailyDeficit,
      weeklyDeficit,
      estimatedCompletionDate,
      daysRemaining,
      weeklyGoalKg,
      dailyCalorieTarget,
    };
  }, [profile]);
}
