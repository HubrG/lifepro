import { z } from "zod";
import { ActivityLevel, Sex } from "@prisma/client";

export const profileSchema = z
  .object({
    age: z
      .number({
        message: "L'âge doit être un nombre",
      })
      .int("L'âge doit être un nombre entier")
      .min(10, "L'âge doit être au moins 10 ans")
      .max(120, "L'âge ne peut pas dépasser 120 ans"),

    height: z
      .number({
        message: "La taille doit être un nombre",
      })
      .int("La taille doit être un nombre entier")
      .min(100, "La taille doit être au moins 100 cm")
      .max(250, "La taille ne peut pas dépasser 250 cm"),

    sex: z.nativeEnum(Sex, {
      message: "Sexe invalide",
    }),

    activityLevel: z.nativeEnum(ActivityLevel, {
      message: "Niveau d'activité invalide",
    }),

    currentWeight: z
      .number({
        message: "Le poids doit être un nombre",
      })
      .min(30, "Le poids doit être au moins 30 kg")
      .max(300, "Le poids ne peut pas dépasser 300 kg"),

    targetWeight: z
      .number({
        message: "Le poids cible doit être un nombre",
      })
      .min(30, "Le poids cible doit être au moins 30 kg")
      .max(300, "Le poids cible ne peut pas dépasser 300 kg"),

    targetDate: z.date({
      message: "Date invalide",
    }),
  })
  .refine((data) => data.targetWeight !== data.currentWeight, {
    message: "Le poids cible doit être différent du poids actuel",
    path: ["targetWeight"],
  })
  .refine((data) => data.targetDate > new Date(), {
    message: "La date cible doit être dans le futur",
    path: ["targetDate"],
  });

export type ProfileFormValues = z.infer<typeof profileSchema>;
