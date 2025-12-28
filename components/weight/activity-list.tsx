"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Trash2, Filter } from "lucide-react";
import { useActivities, useDeleteActivity } from "@/lib/queries/use-activities";
import { ACTIVITY_TYPE_LABELS, INTENSITY_LABELS } from "@/lib/constants/met-values";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ActivityListProps {
  days?: number;
  showFilter?: boolean;
}

export function ActivityList({ days = 30, showFilter = true }: ActivityListProps) {
  const [selectedDays, setSelectedDays] = useState(days);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: activities, isLoading } = useActivities({ days: selectedDays });
  const deleteActivity = useDeleteActivity();

  const handleDelete = async () => {
    if (deleteId) {
      await deleteActivity.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activités récentes</CardTitle>
          <CardDescription>Aucune activité enregistrée</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Ajoutez votre première activité pour commencer le suivi
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculer les totaux
  const totalCalories = activities.reduce((sum, a) => sum + a.caloriesBurned, 0);
  const totalDuration = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
  const totalHours = Math.floor(totalDuration / 60);
  const totalMinutes = totalDuration % 60;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activités récentes</CardTitle>
              <CardDescription>
                {activities.length} activité{activities.length > 1 ? "s" : ""} • {totalCalories.toLocaleString("fr-FR")} kcal • {totalHours}h{totalMinutes > 0 ? `${totalMinutes}min` : ""}
              </CardDescription>
            </div>
            {showFilter && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={selectedDays.toString()}
                  onValueChange={(value) => setSelectedDays(parseInt(value))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 derniers jours</SelectItem>
                    <SelectItem value="14">14 derniers jours</SelectItem>
                    <SelectItem value="30">30 derniers jours</SelectItem>
                    <SelectItem value="90">90 derniers jours</SelectItem>
                    <SelectItem value="365">Tous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Activité</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Intensité</TableHead>
                  <TableHead className="text-right">Durée</TableHead>
                  <TableHead className="text-right">Calories</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">
                      {format(new Date(activity.date), "d MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{activity.name}</div>
                        {activity.notes && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {activity.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30">
                        {ACTIVITY_TYPE_LABELS[activity.type]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {activity.intensity ? (
                        <span className="text-sm text-muted-foreground">
                          {INTENSITY_LABELS[activity.intensity]}
                        </span>
                      ) : activity.steps ? (
                        <span className="text-sm text-muted-foreground">
                          {activity.steps.toLocaleString("fr-FR")} pas
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Manuel</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {activity.duration ? `${activity.duration} min` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {activity.caloriesBurned} kcal
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(activity.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Alert dialog pour confirmation de suppression */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette activité ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'activité sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
