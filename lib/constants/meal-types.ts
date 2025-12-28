import { MealType } from "@prisma/client";

/**
 * Labels français pour les types de repas
 */
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  [MealType.BREAKFAST]: "Petit-déjeuner",
  [MealType.MORNING_SNACK]: "Collation matinale",
  [MealType.LUNCH]: "Déjeuner",
  [MealType.AFTERNOON_SNACK]: "Collation après-midi",
  [MealType.DINNER]: "Dîner",
  [MealType.EVENING_SNACK]: "Collation soirée",
};

/**
 * Icônes emoji pour les types de repas
 */
export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  [MealType.BREAKFAST]: "🌅",
  [MealType.MORNING_SNACK]: "🥐",
  [MealType.LUNCH]: "🍽️",
  [MealType.AFTERNOON_SNACK]: "🍎",
  [MealType.DINNER]: "🌙",
  [MealType.EVENING_SNACK]: "🍪",
};

/**
 * Ordre d'affichage des repas dans la journée
 */
export const MEAL_TYPE_ORDER: MealType[] = [
  MealType.BREAKFAST,
  MealType.MORNING_SNACK,
  MealType.LUNCH,
  MealType.AFTERNOON_SNACK,
  MealType.DINNER,
  MealType.EVENING_SNACK,
];
