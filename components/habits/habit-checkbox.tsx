"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface HabitCheckboxProps {
  checked: boolean;
  isExpected: boolean;
  isToday: boolean;
  isFuture: boolean;
  color?: string;
  isBadHabit?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function HabitCheckbox({
  checked,
  isExpected,
  isToday,
  isFuture,
  color,
  isBadHabit,
  onClick,
  disabled,
}: HabitCheckboxProps) {
  // Les jours futurs sont désactivés
  if (isFuture) {
    return (
      <div className="h-7 w-7 rounded border border-dashed border-muted-foreground/20" />
    );
  }

  // Les jours non attendus (fréquence) sont grisés
  if (!isExpected) {
    return (
      <div className="h-7 w-7 rounded bg-muted/50" />
    );
  }

  // Pour les mauvaises habitudes:
  // - Coché = jour "clean" (pas fait la mauvaise habitude) -> vert
  // - Non coché = rechute -> bordure rouge
  const getBackgroundColor = () => {
    if (!checked) return "transparent";
    if (isBadHabit) return "#22c55e"; // Toujours vert pour "clean"
    return color || "#22c55e";
  };

  const getBorderClass = () => {
    if (checked) return "border-transparent";
    if (isBadHabit) {
      return "border-red-300 hover:border-red-400 dark:border-red-800 dark:hover:border-red-700";
    }
    return "border-muted-foreground/30 hover:border-muted-foreground/50";
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-7 w-7 rounded border-2 transition-all flex items-center justify-center",
        getBorderClass(),
        isToday && !checked && "ring-2 ring-offset-1",
        isToday && !checked && (isBadHabit ? "ring-red-300/50" : "ring-primary/30"),
        disabled && "opacity-50 cursor-not-allowed"
      )}
      style={{
        backgroundColor: getBackgroundColor(),
      }}
    >
      {checked && <Check className="h-4 w-4 text-white" />}
    </button>
  );
}
