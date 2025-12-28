"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeightEntries } from "@/lib/queries/use-weight-entries";
import { useProfile } from "@/lib/queries/use-profile";

export function WeightChart() {
  const { data: entries, isLoading: entriesLoading } = useWeightEntries(90); // 90 derniers jours
  const { data: profile, isLoading: profileLoading } = useProfile();

  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    return entries
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((entry) => ({
        date: format(new Date(entry.date), "d MMM", { locale: fr }),
        fullDate: format(new Date(entry.date), "d MMMM yyyy", { locale: fr }),
        weight: entry.weight,
      }));
  }, [entries]);

  if (entriesLoading || profileLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Évolution du poids</CardTitle>
          <CardDescription>Aucune donnée à afficher</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Ajoutez des pesées pour voir votre progression
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const targetWeight = profile?.targetWeight;
  const minWeight = Math.min(...chartData.map(d => d.weight));
  const maxWeight = Math.max(...chartData.map(d => d.weight));
  const yAxisDomain = [
    Math.floor(Math.min(minWeight, targetWeight || minWeight) - 2),
    Math.ceil(Math.max(maxWeight, targetWeight || maxWeight) + 2),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution du poids</CardTitle>
        <CardDescription>
          Historique des {entries.length} dernières pesées
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              domain={yAxisDomain}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              label={{ value: "Poids (kg)", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.fullDate;
                }
                return label;
              }}
              formatter={(value: number) => [`${value.toFixed(1)} kg`, "Poids"]}
            />
            <Legend />

            {/* Ligne d'objectif */}
            {targetWeight && (
              <ReferenceLine
                y={targetWeight}
                stroke="hsl(var(--primary))"
                strokeDasharray="5 5"
                label={{ value: `Objectif: ${targetWeight} kg`, position: "right" }}
              />
            )}

            {/* Ligne de poids */}
            <Line
              type="natural"
              dataKey="weight"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", r: 5 }}
              activeDot={{ r: 7 }}
              name="Poids (kg)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
