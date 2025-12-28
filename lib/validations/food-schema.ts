import { z } from "zod";
import { MealType } from "@prisma/client";

/**
 * Schéma de validation pour l'ajout d'une entrée alimentaire
 */
export const foodEntrySchema = z.object({
  productName: z
    .string()
    .min(1, "Le nom du produit est requis")
    .max(200, "Le nom ne peut pas dépasser 200 caractères"),

  productBarcode: z.string().optional(),
  brandName: z.string().max(100, "Le nom de la marque ne peut pas dépasser 100 caractères").optional(),

  // Valeurs nutritionnelles pour 100g/100ml
  calories: z.number().min(0, "Les calories ne peuvent pas être négatives"),
  proteins: z.number().min(0, "Les protéines ne peuvent pas être négatives").optional(),
  carbs: z.number().min(0, "Les glucides ne peuvent pas être négatifs").optional(),
  fats: z.number().min(0, "Les lipides ne peuvent pas être négatifs").optional(),
  fibers: z.number().min(0, "Les fibres ne peuvent pas être négatives").optional(),

  // Quantité consommée
  quantity: z
    .number()
    .min(1, "La quantité doit être d'au moins 1g/ml")
    .max(10000, "La quantité ne peut pas dépasser 10kg/10L"),

  servingSize: z.number().min(1).default(100),

  // Métadonnées
  date: z.date(),
  mealType: z.nativeEnum(MealType),
  notes: z
    .string()
    .max(500, "Les notes ne peuvent pas dépasser 500 caractères")
    .optional()
    .or(z.literal("")),
});

export type FoodEntryInput = z.infer<typeof foodEntrySchema>;

/**
 * Données de produit depuis Open Food Facts ou AI
 */
export interface OpenFoodFactsProduct {
  code: string;
  name: string;
  brands: string;
  quantity?: string | null; // Poids net du produit (ex: "500g", "1L")
  caloriesPer100g: number;
  proteinsPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fibersPer100g?: number | null;
  imageUrl: string | null;
  // Champs spécifiques AI
  source?: "AI" | "OpenFoodFacts";
  confidence?: "high" | "medium" | "low";
  aiSource?: string;
}
