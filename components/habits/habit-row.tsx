"use client";

import { useMemo } from "react";
import { Pencil, Archive, Trash2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { HabitCheckbox } from "./habit-checkbox";
import { useToggleHabitLog, useDeleteHabit, useArchiveHabit } from "@/lib/queries/use-habit";
import type { HabitWithLogs, HabitPeriod, DayStatus, HabitStats } from "@/lib/types/habit";
import { MoreVertical } from "lucide-react";

interface HabitRowProps {
  habit: HabitWithLogs;
  period: HabitPeriod;
  stats?: HabitStats;
  onEdit: (habit: HabitWithLogs) => void;
}

export function HabitRow({ habit, period, stats, onEdit }: HabitRowProps) {
  const toggleLog = useToggleHabitLog();
  const deleteHabit = useDeleteHabit();
  const archiveHabit = useArchiveHabit();

  // Générer les jours à afficher
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result: DayStatus[] = [];
    const numDays = period === "week" ? 7 : 30;

    // Créer un Set des dates complétées (en format YYYY-MM-DD local)
    const completedDates = new Set(
      habit.logs.map((log) => {
        const d = new Date(log.date);
        // Utiliser les valeurs UTC pour éviter les décalages de timezone
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      })
    );

    // Parser les jours spécifiques si configurés
    const specificDays = habit.frequencyDays
      ? habit.frequencyDays.split(",").map(Number)
      : null;

    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Déterminer si ce jour est attendu selon la fréquence
      let isExpected = true;
      if (habit.frequencyType === "SPECIFIC_DAYS" && specificDays) {
        isExpected = specificDays.includes(date.getDay());
      }

      result.push({
        date,
        dateStr,
        completed: completedDates.has(dateStr),
        isExpected,
        isToday: i === 0,
        isFuture: false,
      });
    }

    return result;
  }, [habit, period]);

  const handleToggle = (dateStr: string) => {
    toggleLog.mutate({
      habitId: habit.id,
      date: dateStr,
    });
  };

  const handleDelete = () => {
    deleteHabit.mutate(habit.id);
  };

  const handleArchive = () => {
    archiveHabit.mutate(habit.id);
  };

  return (
    <div className="flex items-center gap-4 py-3 px-2 hover:bg-muted/50 rounded-lg transition-colors">
      {/* Nom de l'habitude */}
      <div className="flex items-center gap-2 min-w-[180px] flex-shrink-0">
        {habit.icon && <span className="text-lg">{habit.icon}</span>}
        <span className="font-medium truncate">{habit.name}</span>
        {stats && stats.currentStreak > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-orange-500">
            <Flame className="h-3 w-3" />
            {stats.currentStreak}
          </span>
        )}
      </div>

      {/* Grille de checkboxes */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-1">
          {days.map((day) => (
            <div key={day.dateStr} className="flex flex-col items-center">
              <HabitCheckbox
                checked={day.completed}
                isExpected={day.isExpected}
                isToday={day.isToday}
                isFuture={day.isFuture}
                color={habit.color || undefined}
                onClick={() => handleToggle(day.dateStr)}
                disabled={toggleLog.isPending}
              />
              {/* Label du jour (affiché seulement pour la vue semaine) */}
              {period === "week" && (
                <span className="text-[10px] text-muted-foreground mt-1">
                  {day.date.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 2)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(habit)}>
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchive}>
            <Archive className="h-4 w-4 mr-2" />
            Archiver
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer cette habitude ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Toutes les données de suivi seront perdues.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
