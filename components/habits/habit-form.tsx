"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { HabitFrequencyType, HabitType } from "@prisma/client";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCreateHabit, useUpdateHabit } from "@/lib/queries/use-habit";
import {
  createHabitSchema,
  HABIT_COLORS,
  DAYS_OF_WEEK,
  type HabitFormInput,
} from "@/lib/validations/habit";
import type { HabitWithLogs } from "@/lib/types/habit";

interface HabitFormProps {
  habit?: HabitWithLogs | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const GOOD_HABIT_EMOJIS = [
  "🏃", "💪", "📚", "🧘", "💧", "🥗", "😴", "✍️",
  "🎯", "💰", "🧹", "🎨", "🎸", "🌱", "❤️", "🧠",
];

const BAD_HABIT_EMOJIS = [
  "🚬", "🍺", "🍷", "🌿", "🍕", "🍫", "☕", "📵",
  "🔞", "💋", "🎰", "🎮", "💊", "🛒", "📱", "🍩",
];

export function HabitForm({ habit, open: controlledOpen, onOpenChange, trigger }: HabitFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const isEditing = !!habit;

  const form = useForm<HabitFormInput>({
    resolver: zodResolver(createHabitSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      color: HABIT_COLORS[0],
      habitType: "GOOD",
      frequencyType: "DAILY",
      frequencyValue: 3,
      frequencyDays: "",
    },
  });

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (habit && open) {
      form.reset({
        name: habit.name,
        description: habit.description || "",
        icon: habit.icon || "",
        color: habit.color || HABIT_COLORS[0],
        habitType: habit.habitType,
        frequencyType: habit.frequencyType,
        frequencyValue: habit.frequencyValue ?? 3,
        frequencyDays: habit.frequencyDays || "",
      });
    } else if (!habit && open) {
      form.reset({
        name: "",
        description: "",
        icon: "",
        color: HABIT_COLORS[0],
        habitType: "GOOD",
        frequencyType: "DAILY",
        frequencyValue: 3,
        frequencyDays: "",
      });
    }
  }, [habit, open, form]);

  const frequencyType = form.watch("frequencyType");
  const habitType = form.watch("habitType");
  const emojiOptions = habitType === "BAD" ? BAD_HABIT_EMOJIS : GOOD_HABIT_EMOJIS;

  const onSubmit = async (data: HabitFormInput) => {
    try {
      if (isEditing && habit) {
        await updateHabit.mutateAsync({ habitId: habit.id, data });
      } else {
        await createHabit.mutateAsync(data);
      }
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error saving habit:", error);
    }
  };

  const isPending = createHabit.isPending || updateHabit.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle habitude
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier l'habitude" : "Nouvelle habitude"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les paramètres de votre habitude"
              : "Créez une nouvelle habitude à suivre quotidiennement"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Type d'habitude */}
            <FormField
              control={form.control}
              name="habitType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d'habitude</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => field.onChange("GOOD")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                          field.value === "GOOD"
                            ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                            : "border-muted hover:border-muted-foreground/30"
                        }`}
                      >
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">Bonne habitude</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("BAD")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                          field.value === "BAD"
                            ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
                            : "border-muted hover:border-muted-foreground/30"
                        }`}
                      >
                        <TrendingDown className="h-4 w-4" />
                        <span className="font-medium">Mauvaise habitude</span>
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    {field.value === "GOOD"
                      ? "Habitude à développer (sport, lecture...)"
                      : "Habitude à arrêter (alcool, cigarette...)"}
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Nom */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l'habitude</FormLabel>
                  <FormControl>
                    <Input placeholder="Méditation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="10 minutes de méditation chaque matin..."
                      className="h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icône */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icône</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {emojiOptions.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => field.onChange(emoji)}
                          className={`h-10 w-10 rounded-lg border-2 text-xl transition-all ${
                            field.value === emoji
                              ? "border-primary bg-primary/10"
                              : "border-muted hover:border-muted-foreground/30"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Couleur */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Couleur</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {HABIT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={`h-8 w-8 rounded-full border-2 transition-all ${
                            field.value === color
                              ? "border-foreground ring-2 ring-primary/20"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Fréquence */}
            <FormField
              control={form.control}
              name="frequencyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fréquence</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une fréquence" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DAILY">Tous les jours</SelectItem>
                      <SelectItem value="TIMES_PER_WEEK">X fois par semaine</SelectItem>
                      <SelectItem value="SPECIFIC_DAYS">Jours spécifiques</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* X fois par semaine */}
            {frequencyType === "TIMES_PER_WEEK" && (
              <FormField
                control={form.control}
                name="frequencyValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de fois par semaine</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => field.onChange(num)}
                            className={`h-10 w-10 rounded-lg border-2 font-medium transition-all ${
                              field.value === num
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted hover:border-muted-foreground/30"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Vous pouvez choisir quand dans la semaine
                    </FormDescription>
                  </FormItem>
                )}
              />
            )}

            {/* Jours spécifiques */}
            {frequencyType === "SPECIFIC_DAYS" && (
              <FormField
                control={form.control}
                name="frequencyDays"
                render={({ field }) => {
                  const selectedDays = field.value ? field.value.split(",").map(Number) : [];
                  return (
                    <FormItem>
                      <FormLabel>Jours de la semaine</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          type="multiple"
                          value={selectedDays.map(String)}
                          onValueChange={(values) => field.onChange(values.join(","))}
                          className="justify-start"
                        >
                          {DAYS_OF_WEEK.map((day) => (
                            <ToggleGroupItem
                              key={day.value}
                              value={String(day.value)}
                              className="w-10"
                            >
                              {day.short}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enregistrement..." : isEditing ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
