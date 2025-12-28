"use server";

import { aggregateDailyData, aggregatePeriodData } from "@/lib/services/daily-aggregation";
import { subDays, startOfDay } from "date-fns";

/**
 * Récupère le résumé quotidien pour une date donnée
 */
export async function getDailySummary(date: Date = new Date()) {
  try {
    const summary = await aggregateDailyData(date);
    return { success: true, data: summary };
  } catch (error) {
    console.error("Error getting daily summary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la récupération du résumé quotidien",
    };
  }
}

/**
 * Récupère les résumés quotidiens pour une période (par défaut : 7 derniers jours)
 */
export async function getDailySummaries(days: number = 7) {
  try {
    const endDate = startOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, days - 1));

    const summaries = await aggregatePeriodData(startDate, endDate);

    return { success: true, data: summaries };
  } catch (error) {
    console.error("Error getting daily summaries:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la récupération des résumés quotidiens",
    };
  }
}
