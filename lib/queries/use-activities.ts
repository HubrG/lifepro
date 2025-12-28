import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addActivity, getActivities, deleteActivity, getActivityStats } from "@/lib/actions/activities";
import type { ActivityInput } from "@/lib/validations/activity-schema";
import type { Activity } from "@prisma/client";
import { toast } from "sonner";

/**
 * Hook pour récupérer les activités
 */
export function useActivities(options?: { date?: Date; limit?: number; days?: number }) {
  return useQuery({
    queryKey: ["activities", options],
    queryFn: async () => {
      const result = await getActivities(options);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
  });
}

/**
 * Hook pour ajouter une activité avec optimistic update
 */
export function useAddActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addActivity,
    onMutate: async (newActivity: ActivityInput) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ["activities"] });

      // Sauvegarder les données précédentes
      const previousActivities = queryClient.getQueryData<Activity[]>(["activities"]);

      // Optimistic update
      queryClient.setQueryData<Activity[]>(["activities"], (old = []) => {
        const optimisticActivity: Activity = {
          id: `temp-${Date.now()}`,
          type: newActivity.type || "DAILY_ACTIVITY",
          name: newActivity.name || "Activité",
          intensity: newActivity.intensity || null,
          duration: newActivity.duration || null,
          steps: newActivity.steps || null,
          manualCalories: newActivity.manualCalories || null,
          date: newActivity.date,
          notes: newActivity.notes || null,
          caloriesBurned: 0, // Sera calculé côté serveur
          userId: "temp",
          createdAt: new Date(),
        };
        return [optimisticActivity, ...old];
      });

      return { previousActivities };
    },
    onError: (_error, _variables, context) => {
      // Rollback en cas d'erreur
      if (context?.previousActivities) {
        queryClient.setQueryData(["activities"], context.previousActivities);
      }
      toast.error("Erreur lors de l'ajout de l'activité");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erreur lors de l'ajout de l'activité");
      } else {
        toast.success("Activité ajoutée avec succès");
      }
    },
    onSettled: () => {
      // Toujours invalider pour récupérer les données à jour
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["activity-stats"] });
    },
  });
}

/**
 * Hook pour supprimer une activité avec optimistic update
 */
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteActivity,
    onMutate: async (activityId: string) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ["activities"] });

      // Sauvegarder les données précédentes
      const previousActivities = queryClient.getQueryData<Activity[]>(["activities"]);

      // Optimistic update - retirer l'activité
      queryClient.setQueryData<Activity[]>(["activities"], (old = []) => {
        return old.filter((activity) => activity.id !== activityId);
      });

      return { previousActivities };
    },
    onError: (_error, _variables, context) => {
      // Rollback en cas d'erreur
      if (context?.previousActivities) {
        queryClient.setQueryData(["activities"], context.previousActivities);
      }
      toast.error("Erreur lors de la suppression de l'activité");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erreur lors de la suppression de l'activité");
      } else {
        toast.success("Activité supprimée avec succès");
      }
    },
    onSettled: () => {
      // Toujours invalider pour récupérer les données à jour
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["activity-stats"] });
    },
  });
}

/**
 * Hook pour récupérer les statistiques d'activités
 */
export function useActivityStats(days: number = 7) {
  return useQuery({
    queryKey: ["activity-stats", days],
    queryFn: async () => {
      const result = await getActivityStats(days);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}
