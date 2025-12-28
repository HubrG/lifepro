import { z } from "zod";
import { ActivityType, Intensity } from "@prisma/client";

/**
 * Schéma de validation pour l'ajout d'une activité physique
 * Supporte 3 modes :
 * 1. MET-based: type, intensity, duration, name
 * 2. Steps-based: steps (type et name auto)
 * 3. Manual calories: manualCalories, name (type auto)
 */
export const activitySchema = z.object({
  type: z.nativeEnum(ActivityType).optional(),
  name: z
    .string()
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .optional()
    .or(z.literal("")), // Accepter les chaînes vides

  // Mode MET-based (optionnel)
  intensity: z.nativeEnum(Intensity).optional(),
  duration: z
    .number()
    .int("La durée doit être un nombre entier")
    .min(1, "La durée doit être d'au moins 1 minute")
    .max(1440, "La durée ne peut pas dépasser 24 heures")
    .optional(),

  // Mode Steps-based (optionnel)
  steps: z
    .number()
    .int("Le nombre de pas doit être un entier")
    .min(1, "Le nombre de pas doit être d'au moins 1")
    .max(100000, "Le nombre de pas ne peut pas dépasser 100 000")
    .optional(),

  // Mode Manual calories (optionnel)
  manualCalories: z
    .number()
    .min(1, "Les calories doivent être d'au moins 1")
    .max(10000, "Les calories ne peuvent pas dépasser 10 000")
    .optional(),

  date: z.date(),
  notes: z
    .string()
    .max(500, "Les notes ne peuvent pas dépasser 500 caractères")
    .optional()
    .or(z.literal("")), // Accepter les chaînes vides
}).refine(
  (data) => {
    // Au moins un mode doit être renseigné
    const hasMETData = data.intensity && data.duration;
    const hasSteps = data.steps;
    const hasManualCalories = data.manualCalories;

    return hasMETData || hasSteps || hasManualCalories;
  },
  {
    message: "Vous devez renseigner soit la durée + intensité, soit le nombre de pas, soit les calories manuellement",
    path: ["duration"],
  }
);

export type ActivityInput = z.infer<typeof activitySchema>;
