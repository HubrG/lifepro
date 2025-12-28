import { z } from "zod";
import { VisionBoardItemType } from "@prisma/client";

// Schema pour créer/éditer un Vision Board
export const visionBoardSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis")
    .max(100, "Le titre ne peut pas dépasser 100 caractères"),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .or(z.literal("")),
  coverImage: z.string().url("URL invalide").optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export type VisionBoardInput = z.infer<typeof visionBoardSchema>;

// Schema pour créer un item
export const visionBoardItemSchema = z
  .object({
    boardId: z.string().cuid("ID de board invalide"),
    type: z.nativeEnum(VisionBoardItemType),

    // Pour IMAGE
    imageUrl: z.string().url("URL d'image invalide").optional().or(z.literal("")),
    imageCredit: z.string().max(200).optional().or(z.literal("")),

    // Pour AFFIRMATION
    text: z.string().max(500).optional().or(z.literal("")),

    // Commun
    position: z.number().int().min(0).optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Format de couleur invalide (ex: #FF5733)")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.type === "IMAGE") {
        return !!data.imageUrl;
      }
      if (data.type === "AFFIRMATION") {
        return !!data.text;
      }
      return false;
    },
    {
      message: "Champs requis manquants pour ce type d'élément",
      path: ["type"],
    }
  );

export type VisionBoardItemInput = z.infer<typeof visionBoardItemSchema>;

// Schemas de mise à jour (partiels)
export const updateVisionBoardSchema = visionBoardSchema.partial();
export type UpdateVisionBoardInput = z.infer<typeof updateVisionBoardSchema>;

export const updateVisionBoardItemSchema = visionBoardItemSchema
  .omit({ boardId: true })
  .partial();
export type UpdateVisionBoardItemInput = z.infer<typeof updateVisionBoardItemSchema>;

// Schema pour réorganiser les items (drag-and-drop)
export const reorderItemsSchema = z.object({
  boardId: z.string().cuid(),
  itemIds: z.array(z.string().cuid()).min(1),
});

export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;
