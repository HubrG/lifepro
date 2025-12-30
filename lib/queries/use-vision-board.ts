import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createVisionBoard,
  getVisionBoards,
  getVisionBoard,
  updateVisionBoard,
  deleteVisionBoard,
  addVisionBoardItem,
  updateVisionBoardItem,
  deleteVisionBoardItem,
  reorderVisionBoardItems,
  updateVisionBoardItemImportance,
} from "@/lib/actions/vision-board";
import type {
  VisionBoardInput,
  VisionBoardItemInput,
  UpdateVisionBoardInput,
  UpdateVisionBoardItemInput,
  ReorderItemsInput,
} from "@/lib/validations/vision-board";
import type {
  VisionBoardWithItems,
  VisionBoardSummary,
} from "@/lib/types/vision-board";
import type { VisionBoardItem } from "@prisma/client";
import { toast } from "sonner";

// ============= BOARD HOOKS =============

/**
 * Hook pour récupérer tous les vision boards
 */
export function useVisionBoards() {
  return useQuery({
    queryKey: ["vision-boards"],
    queryFn: async () => {
      const result = await getVisionBoards();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
  });
}

/**
 * Hook pour récupérer un vision board avec ses items
 */
export function useVisionBoard(boardId: string) {
  return useQuery({
    queryKey: ["vision-board", boardId],
    queryFn: async () => {
      const result = await getVisionBoard(boardId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as VisionBoardWithItems;
    },
    enabled: !!boardId,
  });
}

/**
 * Hook pour créer un vision board avec mise à jour optimiste
 */
export function useCreateVisionBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVisionBoard,
    onMutate: async (newBoard: VisionBoardInput) => {
      await queryClient.cancelQueries({ queryKey: ["vision-boards"] });
      const previousBoards = queryClient.getQueryData<VisionBoardSummary[]>([
        "vision-boards",
      ]);

      queryClient.setQueryData<VisionBoardSummary[]>(
        ["vision-boards"],
        (old = []) => {
          const optimisticBoard: VisionBoardSummary = {
            id: `temp-${Date.now()}`,
            title: newBoard.title,
            description: newBoard.description || null,
            coverImage: newBoard.coverImage || null,
            isDefault: newBoard.isDefault || false,
            itemCount: 0,
            updatedAt: new Date(),
          };
          return [optimisticBoard, ...old];
        }
      );

      return { previousBoards };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousBoards) {
        queryClient.setQueryData(["vision-boards"], context.previousBoards);
      }
      toast.error("Erreur lors de la création du board");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erreur lors de la création du board");
      } else {
        toast.success("Board créé avec succès");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["vision-boards"] });
    },
  });
}

/**
 * Hook pour mettre à jour un vision board
 */
export function useUpdateVisionBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      data,
    }: {
      boardId: string;
      data: UpdateVisionBoardInput;
    }) => updateVisionBoard(boardId, data),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erreur lors de la mise à jour");
      } else {
        toast.success("Board mis à jour");
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vision-boards"] });
      queryClient.invalidateQueries({
        queryKey: ["vision-board", variables.boardId],
      });
    },
  });
}

/**
 * Hook pour supprimer un vision board avec mise à jour optimiste
 */
export function useDeleteVisionBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVisionBoard,
    onMutate: async (boardId: string) => {
      await queryClient.cancelQueries({ queryKey: ["vision-boards"] });
      const previousBoards = queryClient.getQueryData<VisionBoardSummary[]>([
        "vision-boards",
      ]);

      queryClient.setQueryData<VisionBoardSummary[]>(
        ["vision-boards"],
        (old = []) => old.filter((board) => board.id !== boardId)
      );

      return { previousBoards };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousBoards) {
        queryClient.setQueryData(["vision-boards"], context.previousBoards);
      }
      toast.error("Erreur lors de la suppression");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erreur lors de la suppression");
      } else {
        toast.success("Board supprimé");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["vision-boards"] });
    },
  });
}

// ============= ITEM HOOKS =============

/**
 * Hook pour ajouter un item avec mise à jour optimiste
 */
export function useAddVisionBoardItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addVisionBoardItem,
    onMutate: async (newItem: VisionBoardItemInput) => {
      await queryClient.cancelQueries({
        queryKey: ["vision-board", newItem.boardId],
      });
      const previousBoard = queryClient.getQueryData<VisionBoardWithItems>([
        "vision-board",
        newItem.boardId,
      ]);

      queryClient.setQueryData<VisionBoardWithItems>(
        ["vision-board", newItem.boardId],
        (old) => {
          if (!old) return old;
          const optimisticItem: VisionBoardItem = {
            id: `temp-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            type: newItem.type,
            imageUrl: newItem.imageUrl || null,
            imageCredit: newItem.imageCredit || null,
            text: newItem.text || null,
            position: old.items.length,
            color: newItem.color || null,
            importance: newItem.importance || 1,
            boardId: newItem.boardId,
          };
          return {
            ...old,
            items: [...old.items, optimisticItem],
          };
        }
      );

      return { previousBoard };
    },
    onError: (_error, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(
          ["vision-board", variables.boardId],
          context.previousBoard
        );
      }
      toast.error("Erreur lors de l'ajout de l'élément");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erreur lors de l'ajout");
      } else {
        toast.success("Élément ajouté");
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["vision-board", variables.boardId],
      });
      queryClient.invalidateQueries({ queryKey: ["vision-boards"] });
    },
  });
}

/**
 * Hook pour mettre à jour un item
 */
export function useUpdateVisionBoardItem(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: UpdateVisionBoardItemInput;
    }) => updateVisionBoardItem(itemId, data),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erreur lors de la mise à jour");
      } else {
        toast.success("Élément mis à jour");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["vision-board", boardId] });
    },
  });
}

/**
 * Hook pour supprimer un item avec mise à jour optimiste
 */
export function useDeleteVisionBoardItem(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVisionBoardItem,
    onMutate: async (itemId: string) => {
      await queryClient.cancelQueries({ queryKey: ["vision-board", boardId] });
      const previousBoard = queryClient.getQueryData<VisionBoardWithItems>([
        "vision-board",
        boardId,
      ]);

      queryClient.setQueryData<VisionBoardWithItems>(
        ["vision-board", boardId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((item) => item.id !== itemId),
          };
        }
      );

      return { previousBoard };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["vision-board", boardId], context.previousBoard);
      }
      toast.error("Erreur lors de la suppression");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erreur lors de la suppression");
      } else {
        toast.success("Élément supprimé");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["vision-board", boardId] });
      queryClient.invalidateQueries({ queryKey: ["vision-boards"] });
    },
  });
}

/**
 * Hook pour réorganiser les items (drag-and-drop)
 */
export function useReorderVisionBoardItems(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderVisionBoardItems,
    onMutate: async (data: ReorderItemsInput) => {
      await queryClient.cancelQueries({ queryKey: ["vision-board", boardId] });
      const previousBoard = queryClient.getQueryData<VisionBoardWithItems>([
        "vision-board",
        boardId,
      ]);

      queryClient.setQueryData<VisionBoardWithItems>(
        ["vision-board", boardId],
        (old) => {
          if (!old) return old;
          const reorderedItems = data.itemIds
            .map((id, index) => {
              const item = old.items.find((i) => i.id === id);
              return item ? { ...item, position: index } : null;
            })
            .filter(Boolean) as VisionBoardItem[];
          return { ...old, items: reorderedItems };
        }
      );

      return { previousBoard };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["vision-board", boardId], context.previousBoard);
      }
      toast.error("Erreur lors du réordonnancement");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["vision-board", boardId] });
    },
  });
}

/**
 * Hook pour mettre à jour l'importance d'un item (taille dans la grille)
 */
export function useUpdateVisionBoardItemImportance(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, importance }: { itemId: string; importance: number }) =>
      updateVisionBoardItemImportance(itemId, importance),
    onMutate: async ({ itemId, importance }) => {
      await queryClient.cancelQueries({ queryKey: ["vision-board", boardId] });
      const previousBoard = queryClient.getQueryData<VisionBoardWithItems>([
        "vision-board",
        boardId,
      ]);

      queryClient.setQueryData<VisionBoardWithItems>(
        ["vision-board", boardId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === itemId ? { ...item, importance } : item
            ),
          };
        }
      );

      return { previousBoard };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["vision-board", boardId], context.previousBoard);
      }
      toast.error("Erreur lors du redimensionnement");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["vision-board", boardId] });
    },
  });
}
