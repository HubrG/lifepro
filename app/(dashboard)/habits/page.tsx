"use client";

import { HabitList } from "@/components/habits/habit-list";
import { HabitForm } from "@/components/habits/habit-form";
import { HabitStats } from "@/components/habits/habit-stats";
import { CompletionChart } from "@/components/habits/charts/completion-chart";
import { StreakChart } from "@/components/habits/charts/streak-chart";
import { HeatmapCalendar } from "@/components/habits/charts/heatmap-calendar";

export default function HabitsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Habitudes</h1>
          <p className="text-muted-foreground">
            Suivez vos habitudes quotidiennes et atteignez vos objectifs
          </p>
        </div>
        <HabitForm />
      </div>

      {/* Stats résumé */}
      <HabitStats />

      {/* Liste des habitudes avec checkboxes */}
      <HabitList />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <StreakChart />
        <CompletionChart />
      </div>

      {/* Heatmap calendrier */}
      <HeatmapCalendar />
    </div>
  );
}
