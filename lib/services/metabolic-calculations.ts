import { ActivityLevel, Sex } from "@prisma/client";
import { ACTIVITY_LEVEL_FACTORS } from "../constants/activity-levels";
import { CALORIES_PER_KG_FAT } from "../constants/nutrition";
import { differenceInDays } from "date-fns";

/**
 * Calcule le BMR (Basal Metabolic Rate) - Métabolisme de base
 * Utilise la formule de Mifflin-St Jeor (plus précise que Harris-Benedict)
 *
 * @param age - Âge en années
 * @param weight - Poids en kg
 * @param height - Taille en cm
 * @param sex - Sexe (MALE ou FEMALE)
 * @returns BMR en kcal/jour
 */
export function calculateBMR(
  age: number,
  weight: number,
  height: number,
  sex: Sex
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === "MALE" ? base + 5 : base - 161;
}

/**
 * Calcule le TDEE (Total Daily Energy Expenditure) - Dépense énergétique totale
 *
 * @param bmr - BMR en kcal/jour
 * @param activityLevel - Niveau d'activité
 * @returns TDEE en kcal/jour
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const factor = ACTIVITY_LEVEL_FACTORS[activityLevel];
  return Math.round(bmr * factor);
}

/**
 * Calcule le déficit calorique quotidien nécessaire pour atteindre l'objectif
 *
 * @param currentWeight - Poids actuel en kg
 * @param targetWeight - Poids cible en kg
 * @param targetDate - Date cible
 * @returns Déficit calorique quotidien en kcal
 */
export function calculateDailyDeficit(
  currentWeight: number,
  targetWeight: number,
  targetDate: Date
): number {
  const weightToLose = currentWeight - targetWeight;
  const daysRemaining = differenceInDays(targetDate, new Date());

  if (daysRemaining <= 0) {
    return 0;
  }

  const totalCaloriesDeficit = weightToLose * CALORIES_PER_KG_FAT;
  return Math.round(totalCaloriesDeficit / daysRemaining);
}

/**
 * Estime la date de fin en fonction du déficit calorique actuel
 *
 * @param currentWeight - Poids actuel en kg
 * @param targetWeight - Poids cible en kg
 * @param dailyDeficit - Déficit calorique quotidien en kcal
 * @returns Date estimée de fin
 */
export function estimateCompletionDate(
  currentWeight: number,
  targetWeight: number,
  dailyDeficit: number
): Date {
  if (dailyDeficit <= 0) {
    // Si pas de déficit, on ne peut pas estimer
    return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // +1 an par défaut
  }

  const weightToLose = currentWeight - targetWeight;
  const totalCaloriesDeficit = weightToLose * CALORIES_PER_KG_FAT;
  const daysNeeded = Math.ceil(totalCaloriesDeficit / dailyDeficit);

  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + daysNeeded);

  return completionDate;
}

/**
 * Calcule le nombre de calories cibles quotidiennes
 *
 * @param tdee - TDEE en kcal/jour
 * @param dailyDeficit - Déficit calorique souhaité en kcal
 * @returns Calories cibles quotidiennes
 */
export function calculateDailyCalorieTarget(
  tdee: number,
  dailyDeficit: number
): number {
  return Math.max(1200, tdee - dailyDeficit); // Minimum 1200 kcal/jour pour la santé
}
