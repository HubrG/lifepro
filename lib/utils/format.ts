/**
 * Formate un nombre de calories avec séparateur de milliers
 *
 * @param calories - Nombre de calories
 * @returns Chaîne formatée (ex: "1 234 kcal")
 */
export function formatCalories(calories: number): string {
  return `${Math.round(calories).toLocaleString("fr-FR")} kcal`;
}

/**
 * Formate un poids en kg
 *
 * @param weight - Poids en kg
 * @param decimals - Nombre de décimales (défaut: 1)
 * @returns Chaîne formatée (ex: "75.5 kg")
 */
export function formatWeight(weight: number, decimals: number = 1): string {
  return `${weight.toFixed(decimals)} kg`;
}

/**
 * Formate une durée en minutes
 *
 * @param minutes - Durée en minutes
 * @returns Chaîne formatée (ex: "1h 30min" ou "45min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Formate un pourcentage
 *
 * @param value - Valeur du pourcentage (0-100)
 * @param decimals - Nombre de décimales (défaut: 0)
 * @returns Chaîne formatée (ex: "75%")
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formate une quantité de nutriment
 *
 * @param grams - Quantité en grammes
 * @param decimals - Nombre de décimales (défaut: 1)
 * @returns Chaîne formatée (ex: "12.5g")
 */
export function formatGrams(grams: number, decimals: number = 1): string {
  return `${grams.toFixed(decimals)}g`;
}
