import { format, formatDistance, formatRelative, isToday, isYesterday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Formate une date au format français
 *
 * @param date - Date à formater
 * @param formatStr - Format de la date (défaut: "d MMMM yyyy")
 * @returns Chaîne formatée (ex: "28 décembre 2025")
 */
export function formatDate(
  date: Date,
  formatStr: string = "d MMMM yyyy"
): string {
  return format(date, formatStr, { locale: fr });
}

/**
 * Formate une date de manière relative (aujourd'hui, hier, demain, etc.)
 *
 * @param date - Date à formater
 * @returns Chaîne formatée (ex: "Aujourd'hui", "Hier", "28 décembre")
 */
export function formatRelativeDate(date: Date): string {
  if (isToday(date)) {
    return "Aujourd'hui";
  }
  if (isYesterday(date)) {
    return "Hier";
  }
  if (isTomorrow(date)) {
    return "Demain";
  }
  return formatDate(date, "d MMMM");
}

/**
 * Formate une distance temporelle (il y a X jours, dans X jours)
 *
 * @param date - Date de référence
 * @param baseDate - Date de base (défaut: maintenant)
 * @returns Chaîne formatée (ex: "il y a 3 jours", "dans 2 semaines")
 */
export function formatDistanceToNow(
  date: Date,
  baseDate: Date = new Date()
): string {
  return formatDistance(date, baseDate, {
    addSuffix: true,
    locale: fr,
  });
}

/**
 * Retourne la date du début de la journée (00:00:00)
 *
 * @param date - Date de référence (défaut: maintenant)
 * @returns Date au début de la journée
 */
export function startOfDay(date: Date = new Date()): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Retourne la date de la fin de la journée (23:59:59)
 *
 * @param date - Date de référence (défaut: maintenant)
 * @returns Date à la fin de la journée
 */
export function endOfDay(date: Date = new Date()): Date {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

/**
 * Convertit une date en chaîne ISO au format YYYY-MM-DD
 *
 * @param date - Date à convertir
 * @returns Chaîne au format YYYY-MM-DD
 */
export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Convertit une chaîne YYYY-MM-DD en Date
 *
 * @param isoDate - Chaîne au format YYYY-MM-DD
 * @returns Date
 */
export function fromISODate(isoDate: string): Date {
  return new Date(isoDate);
}
