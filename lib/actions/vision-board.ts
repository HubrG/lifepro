"use server";

import prisma from "@/lib/db";
import {
  visionBoardSchema,
  visionBoardItemSchema,
  updateVisionBoardSchema,
  updateVisionBoardItemSchema,
  reorderItemsSchema,
  type VisionBoardInput,
  type VisionBoardItemInput,
  type UpdateVisionBoardInput,
  type UpdateVisionBoardItemInput,
  type ReorderItemsInput,
} from "@/lib/validations/vision-board";
import { revalidatePath } from "next/cache";
import type { VisionBoardSummary } from "@/lib/types/vision-board";

// ============= BOARD ACTIONS =============

/**
 * Créer un nouveau vision board
 */
export async function createVisionBoard(data: VisionBoardInput) {
  try {
    const validatedData = visionBoardSchema.parse(data);

    const profile = await prisma.userProfile.findFirst();
    if (!profile) {
      throw new Error("Profil utilisateur introuvable");
    }

    // Si on définit ce board comme défaut, retirer le défaut des autres
    if (validatedData.isDefault) {
      await prisma.visionBoard.updateMany({
        where: { userId: profile.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const board = await prisma.visionBoard.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        coverImage: validatedData.coverImage || null,
        isDefault: validatedData.isDefault ?? false,
        userId: profile.id,
      },
    });

    revalidatePath("/vision-board");
    return { success: true, data: board };
  } catch (error) {
    console.error("Error creating vision board:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la création du board" };
  }
}

/**
 * Récupérer tous les vision boards de l'utilisateur
 */
export async function getVisionBoards(): Promise<{
  success: boolean;
  data?: VisionBoardSummary[];
  error?: string;
}> {
  try {
    const profile = await prisma.userProfile.findFirst();
    if (!profile) {
      return { success: true, data: [] };
    }

    const boards = await prisma.visionBoard.findMany({
      where: { userId: profile.id },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });

    const summaries: VisionBoardSummary[] = boards.map((board) => ({
      id: board.id,
      title: board.title,
      description: board.description,
      coverImage: board.coverImage,
      isDefault: board.isDefault,
      itemCount: board._count.items,
      updatedAt: board.updatedAt,
    }));

    return { success: true, data: summaries };
  } catch (error) {
    console.error("Error fetching vision boards:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la récupération des boards" };
  }
}

/**
 * Récupérer un vision board avec tous ses items
 */
export async function getVisionBoard(boardId: string) {
  try {
    const profile = await prisma.userProfile.findFirst();
    if (!profile) {
      throw new Error("Profil utilisateur introuvable");
    }

    const board = await prisma.visionBoard.findFirst({
      where: { id: boardId, userId: profile.id },
      include: {
        items: { orderBy: { position: "asc" } },
      },
    });

    if (!board) {
      throw new Error("Board introuvable");
    }

    return { success: true, data: board };
  } catch (error) {
    console.error("Error fetching vision board:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la récupération du board" };
  }
}

/**
 * Mettre à jour un vision board
 */
export async function updateVisionBoard(boardId: string, data: UpdateVisionBoardInput) {
  try {
    const validatedData = updateVisionBoardSchema.parse(data);

    const profile = await prisma.userProfile.findFirst();
    if (!profile) {
      throw new Error("Profil utilisateur introuvable");
    }

    // Si on définit ce board comme défaut, retirer le défaut des autres
    if (validatedData.isDefault) {
      await prisma.visionBoard.updateMany({
        where: { userId: profile.id, isDefault: true, id: { not: boardId } },
        data: { isDefault: false },
      });
    }

    const board = await prisma.visionBoard.update({
      where: { id: boardId },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        coverImage: validatedData.coverImage,
        isDefault: validatedData.isDefault,
      },
    });

    revalidatePath("/vision-board");
    revalidatePath(`/vision-board/${boardId}`);
    return { success: true, data: board };
  } catch (error) {
    console.error("Error updating vision board:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la mise à jour du board" };
  }
}

/**
 * Supprimer un vision board
 */
export async function deleteVisionBoard(boardId: string) {
  try {
    await prisma.visionBoard.delete({
      where: { id: boardId },
    });

    revalidatePath("/vision-board");
    return { success: true };
  } catch (error) {
    console.error("Error deleting vision board:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la suppression du board" };
  }
}

// ============= ITEM ACTIONS =============

/**
 * Ajouter un item à un vision board
 */
export async function addVisionBoardItem(data: VisionBoardItemInput) {
  try {
    const validatedData = visionBoardItemSchema.parse(data);

    // Récupérer la position max pour ce board
    const maxPosition = await prisma.visionBoardItem.findFirst({
      where: { boardId: validatedData.boardId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const item = await prisma.visionBoardItem.create({
      data: {
        type: validatedData.type,
        imageUrl: validatedData.imageUrl || null,
        imageCredit: validatedData.imageCredit || null,
        text: validatedData.text || null,
        position: validatedData.position ?? (maxPosition?.position ?? -1) + 1,
        color: validatedData.color || null,
        boardId: validatedData.boardId,
      },
    });

    revalidatePath(`/vision-board/${validatedData.boardId}`);
    return { success: true, data: item };
  } catch (error) {
    console.error("Error adding vision board item:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de l'ajout de l'élément" };
  }
}

/**
 * Mettre à jour un item
 */
export async function updateVisionBoardItem(
  itemId: string,
  data: UpdateVisionBoardItemInput
) {
  try {
    const validatedData = updateVisionBoardItemSchema.parse(data);

    const item = await prisma.visionBoardItem.update({
      where: { id: itemId },
      data: {
        type: validatedData.type,
        imageUrl: validatedData.imageUrl,
        imageCredit: validatedData.imageCredit,
        text: validatedData.text,
        position: validatedData.position,
        color: validatedData.color,
      },
    });

    revalidatePath(`/vision-board/${item.boardId}`);
    return { success: true, data: item };
  } catch (error) {
    console.error("Error updating vision board item:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la mise à jour de l'élément" };
  }
}

/**
 * Supprimer un item
 */
export async function deleteVisionBoardItem(itemId: string) {
  try {
    const item = await prisma.visionBoardItem.delete({
      where: { id: itemId },
    });

    revalidatePath(`/vision-board/${item.boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting vision board item:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la suppression de l'élément" };
  }
}

/**
 * Réorganiser les items (drag-and-drop)
 */
export async function reorderVisionBoardItems(data: ReorderItemsInput) {
  try {
    const validatedData = reorderItemsSchema.parse(data);

    // Mettre à jour les positions dans une transaction
    await prisma.$transaction(
      validatedData.itemIds.map((id, index) =>
        prisma.visionBoardItem.update({
          where: { id },
          data: { position: index },
        })
      )
    );

    revalidatePath(`/vision-board/${validatedData.boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Error reordering vision board items:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors du réordonnancement" };
  }
}
