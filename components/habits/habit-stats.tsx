"use client";

import { useMemo } from "react";
import { Flame, Target, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHabits, useAllHabitsStats } from "@/lib/queries/use-habit";

export function HabitStats() {
  const { data: habits } = useHabits();
  const { data: allStats } = useAllHabitsStats();

  const summary = useMemo(() => {
    if (!habits || !allStats) {
      return {
        totalHabits: 0,
        completedToday: 0,
        longestStreak: 0,
        avgCompletionRate: 0,
      };
    }

    const today = new Date().toISOString().split("T")[0];
    let completedToday = 0;
    let longestStreak = 0;
    let totalCompletionRate = 0;

    habits.forEach((habit) => {
      // Compter les habitudes complétées aujourd'hui
      const todayLog = habit.logs.find(
        (log) => log.date.toISOString().split("T")[0] === today
      );
      if (todayLog) {
        completedToday++;
      }

      // Trouver le plus long streak
      const stats = allStats[habit.id];
      if (stats) {
        longestStreak = Math.max(longestStreak, stats.longestStreak);
        totalCompletionRate += stats.completionRate;
      }
    });

    return {
      totalHabits: habits.length,
      completedToday,
      longestStreak,
      avgCompletionRate: habits.length > 0
        ? Math.round(totalCompletionRate / habits.length)
        : 0,
    };
  }, [habits, allStats]);

  const stats = [
    {
      title: "Habitudes actives",
      value: summary.totalHabits,
      icon: Target,
      description: "habitudes à suivre",
    },
    {
      title: "Complétées aujourd'hui",
      value: `${summary.completedToday}/${summary.totalHabits}`,
      icon: CheckCircle2,
      description: "progression du jour",
    },
    {
      title: "Plus long streak",
      value: summary.longestStreak,
      icon: Flame,
      description: "jours consécutifs",
      suffix: "j",
    },
    {
      title: "Taux moyen",
      value: summary.avgCompletionRate,
      icon: TrendingUp,
      description: "de complétion",
      suffix: "%",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.value}
              {stat.suffix && <span className="text-lg">{stat.suffix}</span>}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
