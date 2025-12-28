"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Activity, Footprints, Flame } from "lucide-react";
import { ActivityType, Intensity } from "@prisma/client";
import { activitySchema, type ActivityInput } from "@/lib/validations/activity-schema";
import { useAddActivity } from "@/lib/queries/use-activities";
import { useProfile } from "@/lib/queries/use-profile";
import { useWeightEntries } from "@/lib/queries/use-weight-entries";
import { calculateActivityCalories, calculateCaloriesFromSteps } from "@/lib/services/activity-calories";
import { ACTIVITY_TYPE_LABELS, INTENSITY_LABELS } from "@/lib/constants/met-values";

type EntryMode = "met" | "steps" | "manual";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActivityForm() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<EntryMode>("met");
  const addActivity = useAddActivity();
  const { data: profile } = useProfile();
  const { data: weightEntries } = useWeightEntries(1); // Dernière entrée de poids

  // Utiliser le dernier poids entré ou le poids du profil en fallback
  const currentWeight = weightEntries?.[0]?.weight || profile?.currentWeight || 70;

  const form = useForm<ActivityInput>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: ActivityType.STRENGTH,
      name: "",
      intensity: undefined,
      duration: undefined,
      steps: undefined,
      manualCalories: undefined,
      date: new Date(),
      notes: "",
    },
  });

  // Réinitialiser les champs quand on change de mode
  const handleModeChange = (newMode: EntryMode) => {
    setMode(newMode);

    // Nettoyer les champs selon le mode
    if (newMode === "met") {
      form.setValue("steps", undefined);
      form.setValue("manualCalories", undefined);
      // Réinitialiser les valeurs MET par défaut
      form.setValue("intensity", Intensity.MODERATE);
      form.setValue("duration", 60);
    } else if (newMode === "steps") {
      form.setValue("name", undefined); // Sera auto-généré
      form.setValue("intensity", undefined);
      form.setValue("duration", undefined);
      form.setValue("manualCalories", undefined);
    } else if (newMode === "manual") {
      form.setValue("intensity", undefined);
      form.setValue("duration", undefined);
      form.setValue("steps", undefined);
    }
  };

  // Calcul en temps réel des calories estimées
  const watchedValues = form.watch();
  let estimatedCalories = 0;

  if (currentWeight) {
    if (mode === "met" && watchedValues.type && watchedValues.intensity && watchedValues.duration) {
      estimatedCalories = calculateActivityCalories(
        watchedValues.type,
        watchedValues.intensity,
        watchedValues.duration,
        currentWeight
      );
    } else if (mode === "steps" && watchedValues.steps) {
      estimatedCalories = calculateCaloriesFromSteps(
        watchedValues.steps,
        currentWeight
      );
    } else if (mode === "manual" && watchedValues.manualCalories) {
      estimatedCalories = watchedValues.manualCalories;
    }
  }

  const onSubmit = async (data: ActivityInput) => {
    // Définir automatiquement le nom et le type pour le mode "steps"
    const submissionData = { ...data };

    // Convertir les chaînes vides en undefined
    if (submissionData.name === "") {
      submissionData.name = undefined;
    }
    if (submissionData.notes === "") {
      submissionData.notes = undefined;
    }

    if (mode === "steps" && data.steps) {
      submissionData.name = `${data.steps.toLocaleString("fr-FR")} pas`;
      submissionData.type = ActivityType.DAILY_ACTIVITY;
    } else if (mode === "manual") {
      submissionData.type = ActivityType.DAILY_ACTIVITY;
    }

    const result = await addActivity.mutateAsync(submissionData);
    if (result.success) {
      form.reset();
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une activité
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter une activité</DialogTitle>
          <DialogDescription>
            Enregistrez votre activité physique par durée/intensité, nombre de pas, ou calories directes
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => handleModeChange(v as EntryMode)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="met" className="text-xs">
              <Activity className="h-4 w-4 mr-1" />
              Durée
            </TabsTrigger>
            <TabsTrigger value="steps" className="text-xs">
              <Footprints className="h-4 w-4 mr-1" />
              Pas
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-xs">
              <Flame className="h-4 w-4 mr-1" />
              Manuel
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              {/* Champs communs */}
              {mode === "met" && (
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'activité</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ActivityType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {ACTIVITY_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {mode !== "steps" && (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'activité</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            mode === "manual"
                              ? "Ex: Activité diverse..."
                              : "Ex: Séance de musculation, Course..."
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Champs spécifiques par mode */}
              <TabsContent value="met" className="space-y-4 mt-0">
                <FormField
                  control={form.control}
                  name="intensity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intensité</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une intensité" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(Intensity).map((intensity) => (
                            <SelectItem key={intensity} value={intensity}>
                              {INTENSITY_LABELS[intensity]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durée (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="1440"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Durée totale de l'activité</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="steps" className="space-y-4 mt-0">
                <FormField
                  control={form.control}
                  name="steps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de pas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="100000"
                          placeholder="10000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Ex: 10 000 pas ≈ {Math.round(calculateCaloriesFromSteps(10000, currentWeight))} kcal
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="manual" className="space-y-4 mt-0">
                <FormField
                  control={form.control}
                  name="manualCalories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calories brûlées</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="10000"
                          placeholder="300"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Entrez directement les calories brûlées
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: fr })
                            ) : (
                              <span>Sélectionner une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes sur cette séance..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Aperçu calories */}
              {estimatedCalories > 0 && (
                <div className="rounded-lg bg-muted p-4">
                  <div className="text-sm font-medium text-muted-foreground">
                    Calories estimées
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round(estimatedCalories)} kcal
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={addActivity.isPending}>
                {addActivity.isPending ? "Ajout en cours..." : "Ajouter l'activité"}
              </Button>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
