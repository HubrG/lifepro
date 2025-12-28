"use server";

import prisma from "@/lib/db";
import { activitySchema, type ActivityInput } from "@/lib/validations/activity-schema";
import { calculateActivityCalories, calculateCaloriesFromSteps } from "@/lib/services/activity-calories";
import { revalidatePath } from "next/cache";

/**
 * Ajoute une nouvelle activité physique avec calcul automatique des calories
 */
export async function addActivity(data: ActivityInput) {
  try {
    // Validation des données
    const validatedData = activitySchema.parse(data);

    // Récupérer le profil utilisateur
    const profile = await prisma.userProfile.findFirst();

    if (!profile) {
      throw new Error("Profil utilisateur introuvable. Veuillez créer votre profil d'abord.");
    }

    // Utiliser le dernier poids entré ou le poids du profil en fallback
    const latestWeight = await prisma.weightEntry.findFirst({
      where: { userId: profile.id },
      orderBy: { date: "desc" },
      select: { weight: true },
    });

    const currentWeight = latestWeight?.weight || profile.currentWeight;

    // Calculer les calories brûlées selon le mode
    let caloriesBurned: number;

    if (validatedData.manualCalories) {
      // Mode 3: Calories manuelles
      caloriesBurned = validatedData.manualCalories;
    } else if (validatedData.steps) {
      // Mode 2: Nombre de pas
      caloriesBurned = calculateCaloriesFromSteps(
        validatedData.steps,
        currentWeight
      );
    } else if (validatedData.type && validatedData.intensity && validatedData.duration) {
      // Mode 1: MET-based
      caloriesBurned = calculateActivityCalories(
        validatedData.type,
        validatedData.intensity,
        validatedData.duration,
        currentWeight
      );
    } else {
      throw new Error("Données insuffisantes pour calculer les calories");
    }

    // Créer l'activité
    const activity = await prisma.activity.create({
      data: {
        type: validatedData.type || "DAILY_ACTIVITY",
        name: validatedData.name || "Activité",
        intensity: validatedData.intensity || null,
        duration: validatedData.duration || null,
        steps: validatedData.steps || null,
        manualCalories: validatedData.manualCalories || null,
        caloriesBurned,
        date: validatedData.date,
        notes: validatedData.notes,
        userId: profile.id,
      },
    });

    revalidatePath("/weight/activities");
    revalidatePath("/weight");

    return { success: true, data: activity };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Une erreur est survenue lors de l'ajout de l'activité" };
  }
}

/**
 * Récupère les activités, optionnellement filtrées par date et limitées
 */
export async function getActivities(options?: {
  date?: Date;
  limit?: number;
  days?: number;
}) {
  try {
    const profile = await prisma.userProfile.findFirst();

    if (!profile) {
      return { success: true, data: [] };
    }

    const { date, limit, days } = options || {};

    let where = { userId: profile.id };

    if (date) {
      // Filtrer par jour spécifique
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where = {
        ...where,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      } as any;
    } else if (days) {
      // Filtrer par nombre de jours
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      where = {
        ...where,
        date: {
          gte: startDate,
        },
      } as any;
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
    });

    return { success: true, data: activities };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Une erreur est survenue lors de la récupération des activités" };
  }
}

/**
 * Supprime une activité
 */
export async function deleteActivity(id: string) {
  try {
    await prisma.activity.delete({
      where: { id },
    });

    revalidatePath("/weight/activities");
    revalidatePath("/weight");

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Une erreur est survenue lors de la suppression de l'activité" };
  }
}

/**
 * Récupère les statistiques d'activités pour une période donnée
 */
export async function getActivityStats(days: number = 7) {
  try {
    const profile = await prisma.userProfile.findFirst();

    if (!profile) {
      return {
        success: true,
        data: {
          totalActivities: 0,
          totalCaloriesBurned: 0,
          totalDurationMinutes: 0,
          averageCaloriesPerActivity: 0,
          activitiesByType: {},
        },
      };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const activities = await prisma.activity.findMany({
      where: {
        userId: profile.id,
        date: { gte: startDate },
      },
    });

    const totalActivities = activities.length;
    const totalCaloriesBurned = activities.reduce((sum, a) => sum + a.caloriesBurned, 0);
    const totalDurationMinutes = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
    const averageCaloriesPerActivity = totalActivities > 0 ? totalCaloriesBurned / totalActivities : 0;

    const activitiesByType = activities.reduce(
      (acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      success: true,
      data: {
        totalActivities,
        totalCaloriesBurned,
        totalDurationMinutes,
        averageCaloriesPerActivity,
        activitiesByType,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Une erreur est survenue lors du calcul des statistiques" };
  }
}
