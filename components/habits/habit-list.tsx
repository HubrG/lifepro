"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";
import { HabitRow } from "./habit-row";
import { HabitForm } from "./habit-form";
import { PeriodToggle } from "./period-toggle";
import { useHabits, useAllHabitsStats } from "@/lib/queries/use-habit";
import type { HabitPeriod, HabitWithLogs } from "@/lib/types/habit";
import { Skeleton } from "@/components/ui/skeleton";

export function HabitList() {
  const [period, setPeriod] = useState<HabitPeriod>("week");
  const [editingHabit, setEditingHabit] = useState<HabitWithLogs | null>(null);
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: allStats } = useAllHabitsStats();

  if (habitsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-40" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!habits || habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Aucune habitude</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Créez votre première habitude pour commencer à tracker vos progrès
        </p>
        <HabitForm />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec toggle période */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Mes habitudes</h2>
        <PeriodToggle period={period} onPeriodChange={setPeriod} />
      </div>

      {/* Liste des habitudes */}
      <div className="rounded-lg border divide-y">
        {habits.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            period={period}
            stats={allStats?.[habit.id]}
            onEdit={setEditingHabit}
          />
        ))}
      </div>

      {/* Dialogue d'édition */}
      <HabitForm
        habit={editingHabit}
        open={!!editingHabit}
        onOpenChange={(open) => !open && setEditingHabit(null)}
      />
    </div>
  );
}
