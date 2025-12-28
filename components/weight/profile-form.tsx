"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActivityLevel, Sex } from "@prisma/client";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { profileSchema, type ProfileFormValues } from "@/lib/validations/profile-schema";
import { useProfile, useUpdateProfile } from "@/lib/queries/use-profile";

export function ProfileForm() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      sex: Sex.MALE,
    },
  });

  // Charger les données du profil quand elles sont disponibles
  useEffect(() => {
    if (profile) {
      form.reset({
        age: profile.age,
        height: profile.height,
        sex: profile.sex,
        activityLevel: profile.activityLevel,
        currentWeight: profile.currentWeight,
        targetWeight: profile.targetWeight,
        targetDate: new Date(profile.targetDate),
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync(data);
      toast.success("Profil sauvegardé avec succès");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la sauvegarde du profil"
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Âge */}
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Âge</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="30"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Votre âge en années</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Taille */}
          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Taille (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="175"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Votre taille en centimètres</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sexe */}
          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexe</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre sexe" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={Sex.MALE}>Homme</SelectItem>
                    <SelectItem value={Sex.FEMALE}>Femme</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Niveau d'activité */}
          <FormField
            control={form.control}
            name="activityLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Niveau d'activité</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre niveau" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ActivityLevel.SEDENTARY}>
                      Sédentaire (peu ou pas d'exercice)
                    </SelectItem>
                    <SelectItem value={ActivityLevel.LIGHT}>
                      Léger (exercice 1-3j/semaine)
                    </SelectItem>
                    <SelectItem value={ActivityLevel.MODERATE}>
                      Modéré (exercice 3-5j/semaine)
                    </SelectItem>
                    <SelectItem value={ActivityLevel.ACTIVE}>
                      Actif (exercice 6-7j/semaine)
                    </SelectItem>
                    <SelectItem value={ActivityLevel.VERY_ACTIVE}>
                      Très actif (exercice intense quotidien)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Votre niveau d'activité physique habituel
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Poids actuel */}
          <FormField
            control={form.control}
            name="currentWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Poids actuel (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="75.5"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Votre poids actuel en kilogrammes</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Poids cible */}
          <FormField
            control={form.control}
            name="targetWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Poids cible (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="70.0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Votre objectif de poids</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date cible */}
          <FormField
            control={form.control}
            name="targetDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date cible</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "d MMMM yyyy")
                        ) : (
                          <span>Sélectionnez une date</span>
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
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Date à laquelle vous souhaitez atteindre votre objectif
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Sauvegarde..." : "Sauvegarder le profil"}
        </Button>
      </form>
    </Form>
  );
}
