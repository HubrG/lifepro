import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addFoodEntry, getFoodEntries, deleteFoodEntry, getFoodStats } from "@/lib/actions/food";
import type { FoodEntryInput } from "@/lib/validations/food-schema";
import type { FoodEntry } from "@prisma/client";
import { toast } from "sonner";
import ky from "ky";
import type { OpenFoodFactsProduct } from "@/lib/validations/food-schema";

/**
 * Hook pour récupérer les entrées alimentaires
 */
export function useFoodEntries(options?: { date?: Date; limit?: number; days?: number }) {
  return useQuery({
    queryKey: ["food-entries", options],
    queryFn: async () => {
      const result = await getFoodEntries(options);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
  });
}

/**
 * Hook pour ajouter une entrée alimentaire avec optimistic update
 */
export function useAddFoodEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addFoodEntry,
    onMutate: async (newEntry: FoodEntryInput) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ["food-entries"] });

      // Sauvegarder les données précédentes
      const previousEntries = queryClient.getQueryData<FoodEntry[]>(["food-entries"]);

      // Optimistic update
      queryClient.setQueryData<FoodEntry[]>(["food-entries"], (old = []) => {
        const optimisticEntry: FoodEntry = {
          id: `temp-${Date.now()}`,
          productName: newEntry.productName,
          productBarcode: newEntry.productBarcode || null,
          brandName: newEntry.brandName || null,
          calories: newEntry.calories,
          proteins: newEntry.proteins || null,
          carbs: newEntry.carbs || null,
          fats: newEntry.fats || null,
          fibers: newEntry.fibers || null,
          quantity: newEntry.quantity,
          servingSize: newEntry.servingSize,
          date: newEntry.date,
          mealType: newEntry.mealType,
          notes: newEntry.notes || null,
          userId: "temp",
          createdAt: new Date(),
        };
        return [optimisticEntry, ...old];
      });

      return { previousEntries };
    },
    onError: (_error, _variables, context) => {
      // Rollback en cas d'erreur
      if (context?.previousEntries) {
        queryClient.setQueryData(["food-entries"], context.previousEntries);
      }
      toast.error("Erreur lors de l'ajout de l'entrée alimentaire");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erreur lors de l'ajout de l'entrée alimentaire");
      } else {
        toast.success("Entrée alimentaire ajoutée avec succès");
      }
    },
    onSettled: () => {
      // Toujours invalider pour récupérer les données à jour
      queryClient.invalidateQueries({ queryKey: ["food-entries"] });
      queryClient.invalidateQueries({ queryKey: ["food-stats"] });
    },
  });
}

/**
 * Hook pour supprimer une entrée alimentaire avec optimistic update
 */
export function useDeleteFoodEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFoodEntry,
    onMutate: async (entryId: string) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ["food-entries"] });

      // Sauvegarder les données précédentes
      const previousEntries = queryClient.getQueryData<FoodEntry[]>(["food-entries"]);

      // Optimistic update - retirer l'entrée
      queryClient.setQueryData<FoodEntry[]>(["food-entries"], (old = []) => {
        return old.filter((entry) => entry.id !== entryId);
      });

      return { previousEntries };
    },
    onError: (_error, _variables, context) => {
      // Rollback en cas d'erreur
      if (context?.previousEntries) {
        queryClient.setQueryData(["food-entries"], context.previousEntries);
      }
      toast.error("Erreur lors de la suppression de l'entrée alimentaire");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erreur lors de la suppression de l'entrée alimentaire");
      } else {
        toast.success("Entrée alimentaire supprimée avec succès");
      }
    },
    onSettled: () => {
      // Toujours invalider pour récupérer les données à jour
      queryClient.invalidateQueries({ queryKey: ["food-entries"] });
      queryClient.invalidateQueries({ queryKey: ["food-stats"] });
    },
  });
}

/**
 * Hook pour récupérer les statistiques alimentaires
 */
export function useFoodStats(days: number = 7) {
  return useQuery({
    queryKey: ["food-stats", days],
    queryFn: async () => {
      const result = await getFoodStats(days);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}

/**
 * Hook pour rechercher des produits avec Open Food Facts
 */
export function useFoodSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ["food-search", query],
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        console.log("🔍 Query too short:", query);
        return [];
      }

      try {
        console.log("🔍 Searching Open Food Facts for:", query);
        const response = await ky
          .get("/api/food/search", {
            searchParams: { q: query },
            timeout: 10000,
          })
          .json<{ products: OpenFoodFactsProduct[] }>();

        console.log("🔍 Open Food Facts results:", response.products.length, "products");
        return response.products || [];
      } catch (error) {
        console.error("Food search error:", error);
        toast.error("Erreur lors de la recherche de produits");
        return [];
      }
    },
    enabled: enabled && query.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });
}

/**
 * Hook pour rechercher un produit par code-barre
 */
export function useBarcodeSearch(barcode: string, enabled = true) {
  return useQuery({
    queryKey: ["barcode-search", barcode],
    queryFn: async () => {
      if (!barcode || !/^\d{8,13}$/.test(barcode)) {
        console.log("📷 Barcode invalid:", barcode);
        return null;
      }

      try {
        console.log("📷 Searching by barcode:", barcode);
        const response = await ky
          .get(`/api/food/barcode/${barcode}`, {
            timeout: 10000,
          })
          .json<{ product: OpenFoodFactsProduct }>();

        console.log("📷 Product found for barcode:", barcode);
        return response.product;
      } catch (error: any) {
        if (error?.response?.status === 404) {
          console.log("📷 Product not found for barcode:", barcode);
          toast.error("Produit non trouvé pour ce code-barre");
        } else {
          console.error("Barcode search error:", error);
          toast.error("Erreur lors de la recherche par code-barre");
        }
        return null;
      }
    },
    enabled: enabled && /^\d{8,13}$/.test(barcode),
    staleTime: 10 * 60 * 1000, // Cache 10 minutes (codes-barres changent rarement)
  });
}
