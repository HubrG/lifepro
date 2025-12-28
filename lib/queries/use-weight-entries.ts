import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addWeightEntry, getWeightEntries, deleteWeightEntry } from "@/lib/actions/weight";
import type { WeightEntry } from "@prisma/client";

/**
 * Hook pour récupérer les entrées de poids
 */
export function useWeightEntries(limit?: number) {
  return useQuery({
    queryKey: ["weight-entries", limit],
    queryFn: () => getWeightEntries(limit),
  });
}

/**
 * Hook pour ajouter une entrée de poids avec optimistic update
 */
export function useAddWeightEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addWeightEntry,
    onMutate: async (newEntry) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ["weight-entries"] });

      // Sauvegarder les données précédentes
      const previousEntries = queryClient.getQueryData<WeightEntry[]>(["weight-entries"]);

      // Optimistic update
      queryClient.setQueryData<WeightEntry[]>(["weight-entries"], (old = []) => {
        const optimisticEntry: WeightEntry = {
          id: `temp-${Date.now()}`,
          weight: newEntry.weight,
          date: newEntry.date,
          notes: newEntry.notes || null,
          userId: "temp",
          createdAt: new Date(),
        };
        return [optimisticEntry, ...old];
      });

      return { previousEntries };
    },
    onError: (_error, _newEntry, context) => {
      // Rollback en cas d'erreur
      if (context?.previousEntries) {
        queryClient.setQueryData(["weight-entries"], context.previousEntries);
      }
    },
    onSuccess: () => {
      // Invalider pour récupérer les vraies données du serveur
      queryClient.invalidateQueries({ queryKey: ["weight-entries"] });
    },
  });
}

/**
 * Hook pour supprimer une entrée de poids avec optimistic update
 */
export function useDeleteWeightEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWeightEntry,
    onMutate: async (entryId) => {
      await queryClient.cancelQueries({ queryKey: ["weight-entries"] });
      const previousEntries = queryClient.getQueryData<WeightEntry[]>(["weight-entries"]);

      // Optimistic update : retirer l'entrée
      queryClient.setQueryData<WeightEntry[]>(["weight-entries"], (old = []) =>
        old.filter((entry) => entry.id !== entryId)
      );

      return { previousEntries };
    },
    onError: (_error, _entryId, context) => {
      if (context?.previousEntries) {
        queryClient.setQueryData(["weight-entries"], context.previousEntries);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-entries"] });
    },
  });
}
