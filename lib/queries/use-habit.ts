import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createHabit,
  getHabits,
  updateHabit,
  deleteHabit,
  archiveHabit,
  toggleHabitLog,
  getHabitStats,
  getAllHabitsStats,
} from "@/lib/actions/habit";
import type {
  CreateHabitInput,
  UpdateHabitInput,
  ToggleHabitLogInput,
} from "@/lib/validations/habit";
import type { HabitWithLogs, HabitStats } from "@/lib/types/habit";
import type { Habit, HabitLog } from "@prisma/client";
import { toast } from "sonner";

// ============= HABIT HOOKS =============

/**
 * Hook pour récupérer toutes les habitudes avec leurs logs récents
 */
export function useHabits() {
  return useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      const result = await getHabits();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
  });
}

/**
 * Hook pour récupérer les stats de toutes les habitudes
 */
export function useAllHabitsStats() {
  return useQuery({
    queryKey: ["habits-stats"],
    queryFn: async () => {
      const result = await getAllHabitsStats();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || {};
    },
  });
}

/**
 * Hook pour récupérer les stats d'une habitude spécifique
 */
export function useHabitStats(habitId: string) {
  return useQuery({
    queryKey: ["habit-stats", habitId],
    queryFn: async () => {
      const result = await getHabitStats(habitId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as HabitStats;
    },
    enabled: !!habitId,
  });
}

/**
 * Hook pour créer une habitude avec mise à jour optimiste
 */
export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHabit,
    onMutate: async (newHabit: CreateHabitInput) => {
      await queryClient.cancelQueries({ queryKey: ["habits"] });
      const previousHabits = queryClient.getQueryData<HabitWithLogs[]>(["habits"]);

      queryClient.setQueryData<HabitWithLogs[]>(["habits"], (old = []) => {
        const optimisticHabit: HabitWithLogs = {
          id: `temp-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: newHabit.name,
          description: newHabit.description || null,
          color: newHabit.color || null,
          icon: newHabit.icon || null,
          frequencyType: newHabit.frequencyType || "DAILY",
          frequencyValue: newHabit.frequencyValue ?? null,
          frequencyDays: newHabit.frequencyDays ?? null,
          isArchived: false,
          userId: "",
          logs: [],
        };
        return [...old, optimisticHabit];
      });

      return { previousHabits };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(["habits"], context.previousHabits);
      }
      toast.error("Erreur lors de la création de l'habitude");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erreur lors de la création");
      } else {
        toast.success("Habitude créée avec succès");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habits-stats"] });
    },
  });
}

/**
 * Hook pour mettre à jour une habitude
 */
export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, data }: { habitId: string; data: UpdateHabitInput }) =>
      updateHabit(habitId, data),
    onMutate: async ({ habitId, data }) => {
      await queryClient.cancelQueries({ queryKey: ["habits"] });
      const previousHabits = queryClient.getQueryData<HabitWithLogs[]>(["habits"]);

      queryClient.setQueryData<HabitWithLogs[]>(["habits"], (old = []) =>
        old.map((habit) =>
          habit.id === habitId ? { ...habit, ...data, updatedAt: new Date() } : habit
        )
      );

      return { previousHabits };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(["habits"], context.previousHabits);
      }
      toast.error("Erreur lors de la mise à jour");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erreur lors de la mise à jour");
      } else {
        toast.success("Habitude mise à jour");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

/**
 * Hook pour supprimer une habitude avec mise à jour optimiste
 */
export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHabit,
    onMutate: async (habitId: string) => {
      await queryClient.cancelQueries({ queryKey: ["habits"] });
      const previousHabits = queryClient.getQueryData<HabitWithLogs[]>(["habits"]);

      queryClient.setQueryData<HabitWithLogs[]>(["habits"], (old = []) =>
        old.filter((habit) => habit.id !== habitId)
      );

      return { previousHabits };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(["habits"], context.previousHabits);
      }
      toast.error("Erreur lors de la suppression");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erreur lors de la suppression");
      } else {
        toast.success("Habitude supprimée");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habits-stats"] });
    },
  });
}

/**
 * Hook pour archiver une habitude
 */
export function useArchiveHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveHabit,
    onMutate: async (habitId: string) => {
      await queryClient.cancelQueries({ queryKey: ["habits"] });
      const previousHabits = queryClient.getQueryData<HabitWithLogs[]>(["habits"]);

      queryClient.setQueryData<HabitWithLogs[]>(["habits"], (old = []) =>
        old.filter((habit) => habit.id !== habitId)
      );

      return { previousHabits };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(["habits"], context.previousHabits);
      }
      toast.error("Erreur lors de l'archivage");
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erreur lors de l'archivage");
      } else {
        toast.success("Habitude archivée");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habits-stats"] });
    },
  });
}

// ============= LOG HOOKS =============

/**
 * Hook pour toggle un log d'habitude avec mise à jour optimiste
 */
export function useToggleHabitLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleHabitLog,
    onMutate: async (data: ToggleHabitLogInput) => {
      await queryClient.cancelQueries({ queryKey: ["habits"] });
      const previousHabits = queryClient.getQueryData<HabitWithLogs[]>(["habits"]);

      // Mise à jour optimiste
      queryClient.setQueryData<HabitWithLogs[]>(["habits"], (old = []) =>
        old.map((habit) => {
          if (habit.id !== data.habitId) return habit;

          const logDate = new Date(data.date);
          logDate.setHours(0, 0, 0, 0);
          const logDateStr = logDate.toISOString().split("T")[0];

          // Vérifier si le log existe déjà
          const existingLogIndex = habit.logs.findIndex(
            (log) => log.date.toISOString().split("T")[0] === logDateStr
          );

          let newLogs: HabitLog[];
          if (existingLogIndex >= 0) {
            // Supprimer le log (toggle off)
            newLogs = habit.logs.filter((_, index) => index !== existingLogIndex);
          } else {
            // Ajouter le log (toggle on)
            const newLog: HabitLog = {
              id: `temp-${Date.now()}`,
              createdAt: new Date(),
              date: logDate,
              completed: true,
              note: null,
              habitId: habit.id,
            };
            newLogs = [...habit.logs, newLog];
          }

          return { ...habit, logs: newLogs };
        })
      );

      return { previousHabits };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(["habits"], context.previousHabits);
      }
      toast.error("Erreur lors de la mise à jour");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habits-stats"] });
    },
  });
}
