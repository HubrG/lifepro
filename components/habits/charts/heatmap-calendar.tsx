"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHabits } from "@/lib/queries/use-habit";
import { cn } from "@/lib/utils";

const INTENSITY_COLORS = [
  "bg-muted",           // 0 - Aucune activité
  "bg-green-200",       // 1 - Faible
  "bg-green-400",       // 2 - Moyen
  "bg-green-500",       // 3 - Bon
  "bg-green-600",       // 4 - Excellent
];

interface DayData {
  date: string;
  count: number;
  total: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

export function HeatmapCalendar() {
  const { data: habits } = useHabits();

  const { days, weeks, maxCount } = useMemo(() => {
    if (!habits || habits.length === 0) {
      return { days: [], weeks: [], maxCount: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalHabits = habits.length;

    // Générer les 90 derniers jours (environ 3 mois)
    const dayData: DayData[] = [];
    let maxCountValue = 0;

    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Compter les habitudes complétées ce jour
      let count = 0;
      habits.forEach((habit) => {
        const log = habit.logs.find((l) => {
          const d = new Date(l.date);
          const logDateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
          return logDateStr === dateStr;
        });
        if (log) count++;
      });

      maxCountValue = Math.max(maxCountValue, count);

      // Calculer l'intensité (0-4)
      let intensity: 0 | 1 | 2 | 3 | 4 = 0;
      if (count > 0) {
        const ratio = count / totalHabits;
        if (ratio >= 0.9) intensity = 4;
        else if (ratio >= 0.7) intensity = 3;
        else if (ratio >= 0.4) intensity = 2;
        else intensity = 1;
      }

      dayData.push({
        date: dateStr,
        count,
        total: totalHabits,
        intensity,
      });
    }

    // Organiser en semaines (colonnes)
    const weekData: DayData[][] = [];
    let currentWeek: DayData[] = [];

    // Remplir le début de la première semaine si nécessaire
    const firstDay = new Date(today);
    firstDay.setDate(firstDay.getDate() - 89);
    const startDayOfWeek = firstDay.getDay();

    // Ajouter des jours vides au début si la période ne commence pas un dimanche
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({ date: "", count: 0, total: 0, intensity: 0 });
    }

    dayData.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weekData.push(currentWeek);
        currentWeek = [];
      }
    });

    // Ajouter la dernière semaine si non complète
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: "", count: 0, total: 0, intensity: 0 });
      }
      weekData.push(currentWeek);
    }

    return { days: dayData, weeks: weekData, maxCount: maxCountValue };
  }, [habits]);

  if (weeks.length === 0) {
    return null;
  }

  const dayLabels = ["D", "L", "M", "M", "J", "V", "S"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Calendrier d'activité (90j)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {/* Labels des jours */}
          <div className="flex flex-col gap-1 pr-2">
            {dayLabels.map((label, i) => (
              <div
                key={i}
                className="h-3 w-4 text-[10px] text-muted-foreground flex items-center"
              >
                {i % 2 === 1 ? label : ""}
              </div>
            ))}
          </div>

          {/* Grille du calendrier */}
          <div className="flex gap-1 overflow-x-auto pb-2">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={cn(
                      "h-3 w-3 rounded-sm transition-colors",
                      day.date ? INTENSITY_COLORS[day.intensity] : "bg-transparent"
                    )}
                    title={
                      day.date
                        ? `${new Date(day.date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}: ${day.count}/${day.total} habitudes`
                        : ""
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Légende */}
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
          <span>Moins</span>
          {INTENSITY_COLORS.map((color, i) => (
            <div key={i} className={cn("h-3 w-3 rounded-sm", color)} />
          ))}
          <span>Plus</span>
        </div>
      </CardContent>
    </Card>
  );
}
