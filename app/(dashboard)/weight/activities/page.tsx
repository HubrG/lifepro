"use client";

import { ActivityForm } from "@/components/weight/activity-form";
import { ActivityList } from "@/components/weight/activity-list";
import { useActivityStats } from "@/lib/queries/use-activities";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Clock, TrendingUp, Activity as ActivityIcon } from "lucide-react";
import { ACTIVITY_TYPE_LABELS } from "@/lib/constants/met-values";

export default function ActivitiesPage() {
  const { data: stats, isLoading } = useActivityStats(7); // Stats des 7 derniers jours

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Activités Physiques</h2>
          <p className="text-muted-foreground">
            Suivez vos activités physiques et calories brûlées
          </p>
        </div>
        <ActivityForm />
      </div>

      {/* Stats Cards - 7 derniers jours */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ActivityIcon className="h-4 w-4" />
            Activités (7j)
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <div className="text-2xl font-bold mt-1">
              {stats?.totalActivities || 0}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Flame className="h-4 w-4" />
            Calories brûlées (7j)
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <div className="text-2xl font-bold mt-1">
              {stats?.totalCaloriesBurned.toLocaleString("fr-FR") || 0} kcal
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            Temps total (7j)
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-20 mt-1" />
          ) : (
            <div className="text-2xl font-bold mt-1">
              {Math.floor((stats?.totalDurationMinutes || 0) / 60)}h
              {(stats?.totalDurationMinutes || 0) % 60 > 0 &&
                `${(stats?.totalDurationMinutes || 0) % 60}min`
              }
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Moyenne/activité (7j)
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <div className="text-2xl font-bold mt-1">
              {Math.round(stats?.averageCaloriesPerActivity || 0)} kcal
            </div>
          )}
        </Card>
      </div>

      {/* Répartition par type */}
      {!isLoading && stats && Object.keys(stats.activitiesByType).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Répartition par type (7 derniers jours)</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(stats.activitiesByType).map(([type, count]) => (
              <div
                key={type}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="text-sm font-medium">
                  {ACTIVITY_TYPE_LABELS[type as keyof typeof ACTIVITY_TYPE_LABELS]}
                </span>
                <span className="text-2xl font-bold">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Liste des activités */}
      <ActivityList days={30} showFilter={true} />
    </div>
  );
}
