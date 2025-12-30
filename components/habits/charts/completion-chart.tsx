"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHabits, useAllHabitsStats } from "@/lib/queries/use-habit";

export function CompletionChart() {
  const { data: habits } = useHabits();
  const { data: allStats } = useAllHabitsStats();

  const chartData = useMemo(() => {
    if (!habits || !allStats) return [];

    return habits.map((habit) => ({
      name: habit.name.slice(0, 12) + (habit.name.length > 12 ? "..." : ""),
      fullName: habit.name,
      completionRate: allStats[habit.id]?.completionRate ?? 0,
      color: habit.color || "#22c55e",
    }));
  }, [habits, allStats]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Taux de complétion (30j)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              fontSize={12}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              fontSize={12}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`, "Complétion"]}
              labelFormatter={(label) => {
                const item = chartData.find((d) => d.name === label);
                return item?.fullName || label;
              }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Bar dataKey="completionRate" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
