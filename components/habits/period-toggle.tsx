"use client";

import { Button } from "@/components/ui/button";
import type { HabitPeriod } from "@/lib/types/habit";

interface PeriodToggleProps {
  period: HabitPeriod;
  onPeriodChange: (period: HabitPeriod) => void;
}

export function PeriodToggle({ period, onPeriodChange }: PeriodToggleProps) {
  return (
    <div className="inline-flex rounded-lg border bg-muted p-1">
      <Button
        variant={period === "week" ? "default" : "ghost"}
        size="sm"
        onClick={() => onPeriodChange("week")}
        className="h-8 px-3"
      >
        7 jours
      </Button>
      <Button
        variant={period === "month" ? "default" : "ghost"}
        size="sm"
        onClick={() => onPeriodChange("month")}
        className="h-8 px-3"
      >
        30 jours
      </Button>
    </div>
  );
}
