"use client";

import { useState } from "react";
import { Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useFoodEntries, useDeleteFoodEntry } from "@/lib/queries/use-food-entries";
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS, MEAL_TYPE_ORDER } from "@/lib/constants/meal-types";
import type { MealType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FoodListProps {
  selectedDate?: Date;
}

export function FoodList({ selectedDate = new Date() }: FoodListProps) {
  const [date, setDate] = useState<Date>(selectedDate);
  const { data: foodEntries = [], isLoading } = useFoodEntries({ date });
  const deleteFoodEntry = useDeleteFoodEntry();

  const handleDelete = async (id: string) => {
    await deleteFoodEntry.mutateAsync(id);
  };

  // Grouper les entrées par type de repas
  const entriesByMealType = foodEntries.reduce(
    (acc, entry) => {
      if (!acc[entry.mealType]) {
        acc[entry.mealType] = [];
      }
      acc[entry.mealType].push(entry);
      return acc;
    },
    {} as Record<MealType, typeof foodEntries>
  );

  // Calculer le total des calories pour chaque repas
  const getMealTotalCalories = (mealType: MealType) => {
    const entries = entriesByMealType[mealType] || [];
    return entries.reduce((sum, entry) => {
      const caloriesForQuantity = (entry.calories * entry.quantity) / entry.servingSize;
      return sum + caloriesForQuantity;
    }, 0);
  };

  // Total journalier
  const dailyTotalCalories = Object.values(entriesByMealType)
    .flat()
    .reduce((sum, entry) => {
      const caloriesForQuantity = (entry.calories * entry.quantity) / entry.servingSize;
      return sum + caloriesForQuantity;
    }, 0);

  const dailyTotalProteins = Object.values(entriesByMealType)
    .flat()
    .reduce((sum, entry) => {
      const proteinsForQuantity = ((entry.proteins || 0) * entry.quantity) / entry.servingSize;
      return sum + proteinsForQuantity;
    }, 0);

  const dailyTotalCarbs = Object.values(entriesByMealType)
    .flat()
    .reduce((sum, entry) => {
      const carbsForQuantity = ((entry.carbs || 0) * entry.quantity) / entry.servingSize;
      return sum + carbsForQuantity;
    }, 0);

  const dailyTotalFats = Object.values(entriesByMealType)
    .flat()
    .reduce((sum, entry) => {
      const fatsForQuantity = ((entry.fats || 0) * entry.quantity) / entry.servingSize;
      return sum + fatsForQuantity;
    }, 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sélecteur de date */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Journal alimentaire</h2>
        <div className="flex items-center gap-2">
          {/* Bouton jour précédent */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDate(subDays(date, 1))}
            disabled={date <= new Date("1900-01-01")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Sélecteur de date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>

          {/* Bouton jour suivant */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDate(addDays(date, 1))}
            disabled={date >= new Date()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Résumé quotidien */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé du jour</CardTitle>
          <CardDescription>{format(date, "PPP", { locale: fr })}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Calories</div>
              <div className="text-2xl font-bold">{Math.round(dailyTotalCalories)} kcal</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Protéines</div>
              <div className="text-2xl font-bold">{Math.round(dailyTotalProteins)}g</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Glucides</div>
              <div className="text-2xl font-bold">{Math.round(dailyTotalCarbs)}g</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Lipides</div>
              <div className="text-2xl font-bold">{Math.round(dailyTotalFats)}g</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste par repas */}
      {foodEntries.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Aucune entrée alimentaire pour cette journée
            </div>
          </CardContent>
        </Card>
      ) : (
        MEAL_TYPE_ORDER.map((mealType) => {
          const entries = entriesByMealType[mealType];
          if (!entries || entries.length === 0) return null;

          const mealTotal = getMealTotalCalories(mealType);

          return (
            <Card key={mealType}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{MEAL_TYPE_ICONS[mealType]}</span>
                  <span>{MEAL_TYPE_LABELS[mealType]}</span>
                  <span className="ml-auto text-base font-normal text-muted-foreground">
                    {Math.round(mealTotal)} kcal
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead className="text-right">Calories</TableHead>
                      <TableHead className="text-right">Protéines</TableHead>
                      <TableHead className="text-right">Glucides</TableHead>
                      <TableHead className="text-right">Lipides</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => {
                      const caloriesForQuantity = Math.round(
                        (entry.calories * entry.quantity) / entry.servingSize
                      );
                      const proteinsForQuantity = Math.round(
                        ((entry.proteins || 0) * entry.quantity) / entry.servingSize
                      );
                      const carbsForQuantity = Math.round(
                        ((entry.carbs || 0) * entry.quantity) / entry.servingSize
                      );
                      const fatsForQuantity = Math.round(
                        ((entry.fats || 0) * entry.quantity) / entry.servingSize
                      );

                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{entry.productName}</div>
                              {entry.brandName && (
                                <div className="text-xs text-muted-foreground">
                                  {entry.brandName}
                                </div>
                              )}
                              {entry.notes && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {entry.notes}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{entry.quantity}g</TableCell>
                          <TableCell className="text-right font-medium">
                            {caloriesForQuantity} kcal
                          </TableCell>
                          <TableCell className="text-right">{proteinsForQuantity}g</TableCell>
                          <TableCell className="text-right">{carbsForQuantity}g</TableCell>
                          <TableCell className="text-right">{fatsForQuantity}g</TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer cette entrée ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible. L'entrée sera définitivement
                                    supprimée.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(entry.id)}>
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
