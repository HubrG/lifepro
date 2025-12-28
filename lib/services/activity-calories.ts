import { ActivityType, Intensity } from "@prisma/client";
import { MET_VALUES } from "../constants/met-values";

/**
 * Calcule les calories brûlées lors d'une activité physique
 * Formule: MET × poids (kg) × durée (heures)
 *
 * @param type - Type d'activité
 * @param intensity - Intensité de l'activité
 * @param durationMinutes - Durée en minutes
 * @param weightKg - Poids de la personne en kg
 * @returns Calories brûlées
 */
export function calculateActivityCalories(
  type: ActivityType,
  intensity: Intensity,
  durationMinutes: number,
  weightKg: number
): number {
  const met = MET_VALUES[type][intensity];
  const hours = durationMinutes / 60;
  const calories = met * weightKg * hours;

  return Math.round(calories);
}

/**
 * Calcule les calories brûlées au repos pour une durée donnée
 * Basé sur le BMR
 *
 * @param bmr - BMR en kcal/jour
 * @param durationMinutes - Durée en minutes
 * @returns Calories brûlées au repos
 */
export function calculateRestingCalories(
  bmr: number,
  durationMinutes: number
): number {
  const caloriesPerMinute = bmr / (24 * 60);
  return Math.round(caloriesPerMinute * durationMinutes);
}

/**
 * Calcule les calories brûlées pour un nombre de pas
 * Formule: 0.04 kcal × (poids/70) par pas
 * Basée sur des recherches scientifiques
 *
 * @param steps - Nombre de pas
 * @param weightKg - Poids de la personne en kg
 * @returns Calories brûlées (arrondi à l'entier)
 */
export function calculateCaloriesFromSteps(
  steps: number,
  weightKg: number
): number {
  const caloriesPerStep = 0.04 * (weightKg / 70);
  const calories = caloriesPerStep * steps;

  return Math.round(calories);
}
