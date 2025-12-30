"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHabits, useAllHabitsStats } from "@/lib/queries/use-habit";
import { Flame, Ban } from "lucide-react";

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  [habitId: string]: number | string; // Dynamic keys for each habit
}

interface BestHabitInfo {
  name: string;
  streak: number;
  color: string;
  isBad: boolean;
}

export function StreakChart() {
  const { data: habits } = useHabits();
  const { data: allStats } = useAllHabitsStats();

  const { chartData, habitsList, bestHabit } = useMemo(() => {
    if (!habits || habits.length === 0) {
      return { chartData: [], habitsList: [], bestHabit: null as BestHabitInfo | null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const data: ChartDataPoint[] = [];

    // Générer les données pour les 14 derniers jours
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dateLabel = date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      });

      const point: ChartDataPoint = {
        date: dateStr,
        dateLabel,
      };

      // Pour chaque habitude, calculer le streak cumulé jusqu'à ce jour
      habits.forEach((habit) => {
        let streakCount = 0;

        // Compter les jours consécutifs complétés jusqu'à cette date
        for (let j = 0; j <= 13 - i; j++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i - j);
          const checkDateStr = checkDate.toISOString().split("T")[0];

          const log = habit.logs.find((l) => {
            const d = new Date(l.date);
            const logDateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
            return logDateStr === checkDateStr;
          });

          if (log) {
            streakCount++;
          } else {
            break; // Streak interrompu
          }
        }

        point[habit.id] = streakCount;
      });

      data.push(point);
    }

    // Liste des habitudes pour les lignes
    const habitsInfo = habits.map((h) => ({
      id: h.id,
      name: h.name,
      color: h.color || "#22c55e",
      isBad: h.habitType === "BAD",
    }));

    // Trouver la meilleure habitude (plus long streak actuel)
    let bestHabitData: BestHabitInfo | null = null;
    if (allStats) {
      habits.forEach((habit) => {
        const stats = allStats[habit.id];
        if (stats) {
          if (!bestHabitData || stats.currentStreak > bestHabitData.streak) {
            bestHabitData = {
              name: habit.name,
              streak: stats.currentStreak,
              color: habit.color || "#22c55e",
              isBad: habit.habitType === "BAD",
            };
          }
        }
      });
    }

    return {
      chartData: data,
      habitsList: habitsInfo,
      bestHabit: bestHabitData,
    };
  }, [habits, allStats]);

  if (chartData.length === 0 || habitsList.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Streaks par habitude</CardTitle>
        {bestHabit && bestHabit.streak > 0 && (
          <div className={`flex items-center gap-1 text-sm ${bestHabit.isBad ? "text-green-600" : "text-orange-500"}`}>
            {bestHabit.isBad ? (
              <Ban className="h-4 w-4" />
            ) : (
              <Flame className="h-4 w-4" />
            )}
            <span className="text-muted-foreground">
              {bestHabit.name}: {bestHabit.streak}j{bestHabit.isBad ? " clean" : ""}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
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
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => {
                const habit = habitsList.find((h) => h.id === name);
                return [
                  `${value} jour${value > 1 ? "s" : ""}`,
                  habit?.name || name,
                ];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
              formatter={(value) => {
                const habit = habitsList.find((h) => h.id === value);
                return habit?.name || value;
              }}
            />
            {habitsList.map((habit) => (
              <Line
                key={habit.id}
                type="monotone"
                dataKey={habit.id}
                name={habit.id}
                stroke={habit.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
