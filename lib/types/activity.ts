import type { Activity } from "@prisma/client";

/**
 * Type pour une activité avec les calories calculées
 */
export type ActivityWithCalories = Activity & {
  caloriesBurned: number;
};

/**
 * Type pour les statistiques d'activités
 */
export interface ActivityStats {
  totalActivities: number;
  totalCaloriesBurned: number;
  totalDurationMinutes: number;
  averageCaloriesPerActivity: number;
  activitiesByType: Record<string, number>;
}
