"use server";

import { revalidatePath } from "next/cache";
import { differenceInDays } from "date-fns";
import prisma from "@/lib/db";
import { profileSchema } from "@/lib/validations/profile-schema";
import { CALORIES_PER_KG_FAT } from "@/lib/constants/nutrition";
import type { UserProfileData } from "@/lib/types/profile";

/**
 * Récupère le profil utilisateur
 * Note: Application single-user, on récupère le premier profil
 */
export async function getProfile(): Promise<UserProfileData | null> {
  try {
    const profile = await prisma.userProfile.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return profile;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw new Error("Erreur lors de la récupération du profil");
  }
}

/**
 * Crée ou met à jour le profil utilisateur
 */
export async function createOrUpdateProfile(
  data: unknown
): Promise<UserProfileData> {
  try {
    // Validation des données
    const validatedData = profileSchema.parse(data);

    // Calculer l'objectif hebdomadaire automatiquement
    const weightToLose = validatedData.currentWeight - validatedData.targetWeight;
    const daysRemaining = differenceInDays(validatedData.targetDate, new Date());
    const weeksRemaining = daysRemaining / 7;
    const weeklyGoal = Math.abs(weightToLose / weeksRemaining);

    // Vérifier si un profil existe déjà
    const existingProfile = await prisma.userProfile.findFirst();

    let profile: UserProfileData;

    if (existingProfile) {
      // Mise à jour
      profile = await prisma.userProfile.update({
        where: { id: existingProfile.id },
        data: {
          ...validatedData,
          weeklyGoal,
        },
      });
    } else {
      // Création
      profile = await prisma.userProfile.create({
        data: {
          ...validatedData,
          weeklyGoal,
        },
      });
    }

    revalidatePath("/weight/profile");
    revalidatePath("/weight");

    return profile;
  } catch (error) {
    console.error("Error creating/updating profile:", error);
    throw new Error("Erreur lors de la sauvegarde du profil");
  }
}
