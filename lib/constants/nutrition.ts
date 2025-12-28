/**
 * Constantes nutritionnelles
 */

// Calories par gramme de macronutriment
export const CALORIES_PER_GRAM = {
  PROTEIN: 4,
  CARBS: 4,
  FAT: 9,
  FIBER: 2, // Les fibres apportent moins de calories
} as const;

// 1 kg de graisse corporelle = environ 7700 kcal
export const CALORIES_PER_KG_FAT = 7700;

// Perte de poids recommandée par semaine (kg)
export const RECOMMENDED_WEEKLY_LOSS = {
  MIN: 0.25, // 250g/semaine (très lent)
  NORMAL: 0.5, // 500g/semaine (recommandé)
  MAX: 1.0, // 1kg/semaine (rapide, sous supervision)
} as const;

// Déficit calorique quotidien correspondant (kcal)
export const DAILY_DEFICIT = {
  MIN: (RECOMMENDED_WEEKLY_LOSS.MIN * CALORIES_PER_KG_FAT) / 7, // ~275 kcal/jour
  NORMAL: (RECOMMENDED_WEEKLY_LOSS.NORMAL * CALORIES_PER_KG_FAT) / 7, // ~550 kcal/jour
  MAX: (RECOMMENDED_WEEKLY_LOSS.MAX * CALORIES_PER_KG_FAT) / 7, // ~1100 kcal/jour
} as const;
