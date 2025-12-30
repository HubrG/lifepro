import type { Habit, HabitLog, HabitFrequencyType } from "@prisma/client";

// Re-export pour faciliter les imports
export type { Habit, HabitLog, HabitFrequencyType };

// Habitude avec ses logs
export type HabitWithLogs = Habit & {
  logs: HabitLog[];
};

// Statistiques d'une habitude
export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // 0-100
  totalCompleted: number;
  totalExpected: number;
  lastCompletedDate: Date | null;
}

// Statut d'un jour pour une habitude
export interface DayStatus {
  date: Date;
  dateStr: string; // Format ISO YYYY-MM-DD
  completed: boolean;
  isExpected: boolean; // Basé sur la fréquence de l'habitude
  isToday: boolean;
  isFuture: boolean;
}

// Période d'affichage
export type HabitPeriod = "week" | "month";

// Données pour le heatmap
export interface HeatmapDay {
  date: string; // Format YYYY-MM-DD
  count: number; // Nombre d'habitudes complétées ce jour
  total: number; // Nombre total d'habitudes attendues
  intensity: 0 | 1 | 2 | 3 | 4; // Niveau d'intensité (0=vide, 4=max)
}

// Données pour le graphique de streak
export interface StreakDataPoint {
  date: string;
  streak: number;
  habitId: string;
  habitName: string;
}

// Données pour le graphique de complétion
export interface CompletionDataPoint {
  habitId: string;
  habitName: string;
  color: string;
  completionRate: number;
  completed: number;
  expected: number;
}
