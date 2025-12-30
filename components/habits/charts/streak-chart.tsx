"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHabits, useAllHabitsStats } from "@/lib/queries/use-habit";
import { Flame } from "lucide-react";

export function StreakChart() {
  const { data: habits } = useHabits();
  const { data: allStats } = useAllHabitsStats();

  interface BestHabitInfo {
    name: string;
    streak: number;
    color: string;
  }

  const { chartData, bestHabit } = useMemo(() => {
    if (!habits || !allStats) {
      return { chartData: [], bestHabit: null as BestHabitInfo | null };
    }

    // Calculer les streaks totaux par jour sur les 30 derniers jours
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const data: { date: string; dateLabel: string; streak: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dateLabel = date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      });

      // Calculer combien d'habitudes ont été complétées ce jour
      let completed = 0;
      habits.forEach((habit) => {
        const log = habit.logs.find((l) => {
          const d = new Date(l.date);
          const logDateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
          return logDateStr === dateStr;
        });
        if (log) completed++;
      });

      data.push({
        date: dateStr,
        dateLabel,
        streak: completed,
      });
    }

    // Trouver la meilleure habitude (plus long streak)
    let bestHabitData: BestHabitInfo | null = null;

    habits.forEach((habit) => {
      const stats = allStats[habit.id];
      if (stats) {
        if (!bestHabitData || stats.longestStreak > bestHabitData.streak) {
          bestHabitData = {
            name: habit.name,
            streak: stats.longestStreak,
            color: habit.color || "#22c55e",
          };
        }
      }
    });

    return {
      chartData: data,
      bestHabit: bestHabitData,
    };
  }, [habits, allStats]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Activité quotidienne</CardTitle>
        {bestHabit && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>
              Meilleur streak: {bestHabit.name} ({bestHabit.streak}j)
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorStreak" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="dateLabel"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              fontSize={10}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              formatter={(value: number) => [
                `${value} habitude${value > 1 ? "s" : ""}`,
                "Complétées",
              ]}
            />
            <Area
              type="monotone"
              dataKey="streak"
              stroke="#22c55e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorStreak)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
