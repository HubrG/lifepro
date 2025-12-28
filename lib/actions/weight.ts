"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { z } from "zod";

// Schéma de validation pour une entrée de poids
const weightEntrySchema = z.object({
  weight: z.number().min(30).max(300),
  date: z.date(),
  notes: z.string().optional(),
});

type WeightEntryInput = z.infer<typeof weightEntrySchema>;

/**
 * Ajoute une nouvelle entrée de poids
 */
export async function addWeightEntry(data: WeightEntryInput) {
  try {
    // Validation
    const validatedData = weightEntrySchema.parse(data);

    // Récupérer le profil utilisateur (single user app)
    const profile = await prisma.userProfile.findFirst();
    if (!profile) {
      throw new Error("Profil utilisateur non trouvé");
    }

    // Vérifier qu'il n'existe pas déjà une entrée pour cette date
    const existingEntry = await prisma.weightEntry.findFirst({
      where: {
        userId: profile.id,
        date: validatedData.date,
      },
    });

    if (existingEntry) {
      throw new Error("Une entrée de poids existe déjà pour cette date");
    }

    // Créer l'entrée
    const weightEntry = await prisma.weightEntry.create({
      data: {
        weight: validatedData.weight,
        date: validatedData.date,
        notes: validatedData.notes,
        userId: profile.id,
      },
    });

    revalidatePath("/weight");
    return weightEntry;
  } catch (error) {
    console.error("Error adding weight entry:", error);
    if (error instanceof z.ZodError) {
      throw new Error("Données invalides");
    }
    throw error;
  }
}

/**
 * Récupère les entrées de poids
 */
export async function getWeightEntries(limit?: number) {
  try {
    const profile = await prisma.userProfile.findFirst();
    if (!profile) {
      return [];
    }

    const entries = await prisma.weightEntry.findMany({
      where: {
        userId: profile.id,
      },
      orderBy: {
        date: "desc",
      },
      take: limit,
    });

    return entries;
  } catch (error) {
    console.error("Error fetching weight entries:", error);
    throw new Error("Erreur lors de la récupération des entrées de poids");
  }
}

/**
 * Supprime une entrée de poids
 */
export async function deleteWeightEntry(id: string) {
  try {
    await prisma.weightEntry.delete({
      where: { id },
    });

    revalidatePath("/weight");
    return { success: true };
  } catch (error) {
    console.error("Error deleting weight entry:", error);
    throw new Error("Erreur lors de la suppression de l'entrée");
  }
}
