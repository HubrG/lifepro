"use server";

import prisma from "@/lib/db";
import { foodEntrySchema, type FoodEntryInput } from "@/lib/validations/food-schema";
import { revalidatePath } from "next/cache";

/**
 * Ajoute une nouvelle entrée alimentaire avec calcul automatique des calories
 */
export async function addFoodEntry(data: FoodEntryInput) {
  try {
    // Validation des données
    const validatedData = foodEntrySchema.parse(data);

    // Récupérer le profil utilisateur
    const profile = await prisma.userProfile.findFirst();

    if (!profile) {
      throw new Error("Profil utilisateur introuvable. Veuillez créer votre profil d'abord.");
    }

    // Convertir les chaînes vides en undefined
    const notes = validatedData.notes === "" ? undefined : validatedData.notes;

    // Corriger la date pour éviter les problèmes de timezone
    // On utilise UTC à midi pour éviter les décalages
    const inputDate = validatedData.date;
    const correctedDate = new Date(Date.UTC(
      inputDate.getFullYear(),
      inputDate.getMonth(),
      inputDate.getDate(),
      12, 0, 0, 0
    ));

    // Créer l'entrée alimentaire
    const foodEntry = await prisma.foodEntry.create({
      data: {
        productName: validatedData.productName,
        productBarcode: validatedData.productBarcode,
        brandName: validatedData.brandName,
        calories: validatedData.calories,
        proteins: validatedData.proteins,
        carbs: validatedData.carbs,
        fats: validatedData.fats,
        fibers: validatedData.fibers,
        quantity: validatedData.quantity,
        servingSize: validatedData.servingSize,
        date: correctedDate,
        mealType: validatedData.mealType,
        notes,
        userId: profile.id,
      },
    });

    revalidatePath("/weight/food");
    revalidatePath("/weight");

    return { success: true, data: foodEntry };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Une erreur est survenue lors de l'ajout de l'entrée alimentaire" };
  }
}

/**
 * Récupère les entrées alimentaires, optionnellement filtrées par date et limitées
 */
export async function getFoodEntries(options?: {
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
      // Filtrer par jour spécifique (utiliser UTC pour éviter les problèmes de timezone)
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

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

    const foodEntries = await prisma.foodEntry.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
    });

    return { success: true, data: foodEntries };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Une erreur est survenue lors de la récupération des entrées alimentaires" };
  }
}

/**
 * Supprime une entrée alimentaire
 */
export async function deleteFoodEntry(id: string) {
  try {
    await prisma.foodEntry.delete({
      where: { id },
    });

    revalidatePath("/weight/food");
    revalidatePath("/weight");

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Une erreur est survenue lors de la suppression de l'entrée alimentaire" };
  }
}

/**
 * Récupère les statistiques alimentaires pour une période donnée
 */
export async function getFoodStats(days: number = 7) {
  try {
    const profile = await prisma.userProfile.findFirst();

    if (!profile) {
      return {
        success: true,
        data: {
          totalEntries: 0,
          totalCalories: 0,
          totalProteins: 0,
          totalCarbs: 0,
          totalFats: 0,
          averageCaloriesPerDay: 0,
          entriesByMealType: {},
        },
      };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const foodEntries = await prisma.foodEntry.findMany({
      where: {
        userId: profile.id,
        date: { gte: startDate },
      },
    });

    const totalEntries = foodEntries.length;

    // Calculer les calories réelles consommées (basées sur la quantité)
    const totalCalories = foodEntries.reduce((sum, entry) => {
      const caloriesForQuantity = (entry.calories * entry.quantity) / entry.servingSize;
      return sum + caloriesForQuantity;
    }, 0);

    const totalProteins = foodEntries.reduce((sum, entry) => {
      const proteinsForQuantity = ((entry.proteins || 0) * entry.quantity) / entry.servingSize;
      return sum + proteinsForQuantity;
    }, 0);

    const totalCarbs = foodEntries.reduce((sum, entry) => {
      const carbsForQuantity = ((entry.carbs || 0) * entry.quantity) / entry.servingSize;
      return sum + carbsForQuantity;
    }, 0);

    const totalFats = foodEntries.reduce((sum, entry) => {
      const fatsForQuantity = ((entry.fats || 0) * entry.quantity) / entry.servingSize;
      return sum + fatsForQuantity;
    }, 0);

    const averageCaloriesPerDay = totalCalories / days;

    const entriesByMealType = foodEntries.reduce(
      (acc, entry) => {
        acc[entry.mealType] = (acc[entry.mealType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      success: true,
      data: {
        totalEntries,
        totalCalories,
        totalProteins,
        totalCarbs,
        totalFats,
        averageCaloriesPerDay,
        entriesByMealType,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Une erreur est survenue lors du calcul des statistiques" };
  }
}
