"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface HabitCheckboxProps {
  checked: boolean;
  isExpected: boolean;
  isToday: boolean;
  isFuture: boolean;
  color?: string;
  onClick: () => void;
  disabled?: boolean;
}

export function HabitCheckbox({
  checked,
  isExpected,
  isToday,
  isFuture,
  color,
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

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-7 w-7 rounded border-2 transition-all flex items-center justify-center",
        checked
          ? "border-transparent"
          : "border-muted-foreground/30 hover:border-muted-foreground/50",
        isToday && !checked && "ring-2 ring-primary/30 ring-offset-1",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      style={{
        backgroundColor: checked ? (color || "#22c55e") : "transparent",
      }}
    >
      {checked && <Check className="h-4 w-4 text-white" />}
    </button>
  );
}
