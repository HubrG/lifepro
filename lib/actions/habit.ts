"use server";

import prisma from "@/lib/db";
import {
  createHabitSchema,
  updateHabitSchema,
  toggleHabitLogSchema,
  type CreateHabitInput,
  type UpdateHabitInput,
  type ToggleHabitLogInput,
} from "@/lib/validations/habit";
import { revalidatePath } from "next/cache";
import type { HabitWithLogs, HabitStats } from "@/lib/types/habit";

// ============= HABIT ACTIONS =============

/**
 * Créer une nouvelle habitude
 */
export async function createHabit(data: CreateHabitInput) {
  try {
    const validatedData = createHabitSchema.parse(data);

    const profile = await prisma.userProfile.findFirst();
    if (!profile) {
      throw new Error("Profil utilisateur introuvable");
    }

    const habit = await prisma.habit.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        color: validatedData.color || null,
        icon: validatedData.icon || null,
        habitType: validatedData.habitType,
        frequencyType: validatedData.frequencyType,
        frequencyValue: validatedData.frequencyValue ?? null,
        frequencyDays: validatedData.frequencyDays ?? null,
        userId: profile.id,
      },
    });

    revalidatePath("/habits");
    return { success: true, data: habit };
  } catch (error) {
    console.error("Error creating habit:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la création de l'habitude" };
  }
}

/**
 * Récupérer toutes les habitudes actives de l'utilisateur
 */
export async function getHabits(): Promise<{
  success: boolean;
  data?: HabitWithLogs[];
  error?: string;
}> {
  try {
    const profile = await prisma.userProfile.findFirst();
    if (!profile) {
      return { success: true, data: [] };
    }

    // Récupérer les habitudes avec les logs des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const habits = await prisma.habit.findMany({
      where: { userId: profile.id, isArchived: false },
      include: {
        logs: {
          where: {
            date: { gte: thirtyDaysAgo },
          },
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, data: habits };
  } catch (error) {
    console.error("Error fetching habits:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la récupération des habitudes" };
  }
}

/**
 * Récupérer une habitude avec ses logs sur une période
 */
export async function getHabit(
  habitId: string,
  startDate?: string,
  endDate?: string
) {
  try {
    const profile = await prisma.userProfile.findFirst();
    if (!profile) {
      throw new Error("Profil utilisateur introuvable");
    }

    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId: profile.id },
      include: {
        logs: {
          where: {
            date: { gte: start, lte: end },
          },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!habit) {
      throw new Error("Habitude introuvable");
    }

    return { success: true, data: habit };
  } catch (error) {
    console.error("Error fetching habit:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la récupération de l'habitude" };
  }
}

/**
 * Mettre à jour une habitude
 */
export async function updateHabit(habitId: string, data: UpdateHabitInput) {
  try {
    const validatedData = updateHabitSchema.parse(data);

    const habit = await prisma.habit.update({
      where: { id: habitId },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color,
        icon: validatedData.icon,
        habitType: validatedData.habitType,
        frequencyType: validatedData.frequencyType,
        frequencyValue: validatedData.frequencyValue,
        frequencyDays: validatedData.frequencyDays,
      },
    });

    revalidatePath("/habits");
    return { success: true, data: habit };
  } catch (error) {
    console.error("Error updating habit:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la mise à jour de l'habitude" };
  }
}

/**
 * Supprimer une habitude
 */
export async function deleteHabit(habitId: string) {
  try {
    await prisma.habit.delete({
      where: { id: habitId },
    });

    revalidatePath("/habits");
    return { success: true };
  } catch (error) {
    console.error("Error deleting habit:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la suppression de l'habitude" };
  }
}

/**
 * Archiver une habitude
 */
export async function archiveHabit(habitId: string) {
  try {
    const habit = await prisma.habit.update({
      where: { id: habitId },
      data: { isArchived: true },
    });

    revalidatePath("/habits");
    return { success: true, data: habit };
  } catch (error) {
    console.error("Error archiving habit:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de l'archivage de l'habitude" };
  }
}

// ============= LOG ACTIONS =============

/**
 * Toggle la complétion d'une habitude pour un jour donné
 */
export async function toggleHabitLog(data: ToggleHabitLogInput) {
  try {
    const validatedData = toggleHabitLogSchema.parse(data);

    // Convertir la date string en Date UTC (éviter les problèmes de timezone)
    // Format attendu: "YYYY-MM-DD"
    const [year, month, day] = validatedData.date.split("-").map(Number);
    const logDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));

    // Vérifier si un log existe déjà pour ce jour
    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habitId_date: {
          habitId: validatedData.habitId,
          date: logDate,
        },
      },
    });

    if (existingLog) {
      // Supprimer le log existant (toggle off)
      await prisma.habitLog.delete({
        where: { id: existingLog.id },
      });
      revalidatePath("/habits");
      return { success: true, data: null, completed: false };
    } else {
      // Créer un nouveau log (toggle on)
      const log = await prisma.habitLog.create({
        data: {
          habitId: validatedData.habitId,
          date: logDate,
          completed: true,
        },
      });
      revalidatePath("/habits");
      return { success: true, data: log, completed: true };
    }
  } catch (error) {
    console.error("Error toggling habit log:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la mise à jour du log" };
  }
}

// ============= STATS ACTIONS =============

/**
 * Calculer les statistiques d'une habitude
 */
export async function getHabitStats(habitId: string): Promise<{
  success: boolean;
  data?: HabitStats;
  error?: string;
}> {
  try {
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: {
        logs: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!habit) {
      throw new Error("Habitude introuvable");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculer le streak actuel
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastCompletedDate: Date | null = null;

    // Créer un Set des dates complétées pour un accès rapide (format UTC)
    const completedDates = new Set(
      habit.logs.map((log) => {
        const d = new Date(log.date);
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      })
    );

    if (habit.logs.length > 0) {
      lastCompletedDate = habit.logs[0].date;
    }

    // Parcourir les 365 derniers jours pour calculer les streaks
    const checkDate = new Date(today);
    let isFirstCheck = true;

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split("T")[0];
      const isExpected = isExpectedDay(checkDate, habit);

      if (isExpected) {
        if (completedDates.has(dateStr)) {
          tempStreak++;
          if (isFirstCheck || tempStreak > 0) {
            currentStreak = tempStreak;
          }
        } else {
          // Streak cassé
          if (isFirstCheck && i === 0) {
            // Aujourd'hui n'est pas encore complété, vérifier si hier l'était
            currentStreak = 0;
          }
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
          if (!isFirstCheck) {
            break; // Arrêter de chercher pour le streak actuel
          }
        }
        isFirstCheck = false;
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculer le taux de complétion sur les 30 derniers jours
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let totalExpected = 0;
    let totalCompleted = 0;

    const iterDate = new Date(thirtyDaysAgo);
    while (iterDate <= today) {
      const dateStr = iterDate.toISOString().split("T")[0];
      if (isExpectedDay(iterDate, habit)) {
        totalExpected++;
        if (completedDates.has(dateStr)) {
          totalCompleted++;
        }
      }
      iterDate.setDate(iterDate.getDate() + 1);
    }

    const completionRate =
      totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

    return {
      success: true,
      data: {
        currentStreak,
        longestStreak,
        completionRate,
        totalCompleted,
        totalExpected,
        lastCompletedDate,
      },
    };
  } catch (error) {
    console.error("Error calculating habit stats:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors du calcul des statistiques" };
  }
}

/**
 * Récupérer les stats de toutes les habitudes
 */
export async function getAllHabitsStats(): Promise<{
  success: boolean;
  data?: Record<string, HabitStats>;
  error?: string;
}> {
  try {
    const profile = await prisma.userProfile.findFirst();
    if (!profile) {
      return { success: true, data: {} };
    }

    const habits = await prisma.habit.findMany({
      where: { userId: profile.id, isArchived: false },
      select: { id: true },
    });

    const statsMap: Record<string, HabitStats> = {};

    for (const habit of habits) {
      const result = await getHabitStats(habit.id);
      if (result.success && result.data) {
        statsMap[habit.id] = result.data;
      }
    }

    return { success: true, data: statsMap };
  } catch (error) {
    console.error("Error fetching all habits stats:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors du calcul des statistiques" };
  }
}

// ============= HELPER FUNCTIONS =============

/**
 * Vérifie si un jour est attendu pour une habitude selon sa fréquence
 */
function isExpectedDay(
  date: Date,
  habit: { frequencyType: string; frequencyDays: string | null }
): boolean {
  switch (habit.frequencyType) {
    case "DAILY":
      return true;
    case "TIMES_PER_WEEK":
      // Pour X fois par semaine, tous les jours comptent
      return true;
    case "SPECIFIC_DAYS": {
      if (!habit.frequencyDays) return false;
      const days = habit.frequencyDays.split(",").map(Number);
      return days.includes(date.getDay());
    }
    default:
      return true;
  }
}
