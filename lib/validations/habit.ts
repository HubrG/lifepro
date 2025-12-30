import { z } from "zod";
import { HabitFrequencyType } from "@prisma/client";

// Liste des jours de la semaine
export const DAYS_OF_WEEK = [
  { value: 0, label: "Dimanche", short: "Dim" },
  { value: 1, label: "Lundi", short: "Lun" },
  { value: 2, label: "Mardi", short: "Mar" },
  { value: 3, label: "Mercredi", short: "Mer" },
  { value: 4, label: "Jeudi", short: "Jeu" },
  { value: 5, label: "Vendredi", short: "Ven" },
  { value: 6, label: "Samedi", short: "Sam" },
] as const;

// Couleurs prédéfinies pour les habitudes
export const HABIT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
] as const;

// Schema de base pour le formulaire (sans refine pour typage correct)
const habitBaseSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .or(z.literal("")),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Format de couleur invalide")
    .optional()
    .or(z.literal("")),
  icon: z.string().max(50).optional().or(z.literal("")),
  frequencyType: z.nativeEnum(HabitFrequencyType),
  frequencyValue: z.number().int().min(1).max(7).optional(),
  frequencyDays: z.string().optional(), // Format: "0,1,2,3,4" pour lun-ven
});

// Type pour le formulaire
export type HabitFormInput = z.infer<typeof habitBaseSchema>;

// Schema pour créer une habitude (avec validation conditionnelle)
export const createHabitSchema = habitBaseSchema
  .refine(
    (data) => {
      // TIMES_PER_WEEK nécessite frequencyValue
      if (data.frequencyType === "TIMES_PER_WEEK") {
        return data.frequencyValue !== undefined && data.frequencyValue >= 1;
      }
      // SPECIFIC_DAYS nécessite frequencyDays
      if (data.frequencyType === "SPECIFIC_DAYS") {
        return data.frequencyDays && data.frequencyDays.length > 0;
      }
      return true;
    },
    {
      message: "Configuration de fréquence invalide",
      path: ["frequencyType"],
    }
  );

export type CreateHabitInput = z.infer<typeof createHabitSchema>;

// Schema pour mettre à jour une habitude
export const updateHabitSchema = createHabitSchema.partial();
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

// Schema pour toggle un log
export const toggleHabitLogSchema = z.object({
  habitId: z.string().cuid("ID d'habitude invalide"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
});

export type ToggleHabitLogInput = z.infer<typeof toggleHabitLogSchema>;

// Schema pour récupérer les logs sur une période
export const getHabitLogsSchema = z.object({
  habitId: z.string().cuid("ID d'habitude invalide"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type GetHabitLogsInput = z.infer<typeof getHabitLogsSchema>;
