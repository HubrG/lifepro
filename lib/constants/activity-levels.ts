import { ActivityLevel } from "@prisma/client";

export const ACTIVITY_LEVEL_FACTORS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2, // peu ou pas d'exercice
  LIGHT: 1.375, // exercice léger 1-3j/semaine
  MODERATE: 1.55, // exercice modéré 3-5j/semaine
  ACTIVE: 1.725, // exercice intense 6-7j/semaine
  VERY_ACTIVE: 1.9, // exercice très intense, travail physique
};

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: "Sédentaire",
  LIGHT: "Légèrement actif",
  MODERATE: "Modérément actif",
  ACTIVE: "Très actif",
  VERY_ACTIVE: "Extrêmement actif",
};

export const ACTIVITY_LEVEL_DESCRIPTIONS: Record<ActivityLevel, string> = {
  SEDENTARY: "Peu ou pas d'exercice",
  LIGHT: "Exercice léger 1-3 jours par semaine",
  MODERATE: "Exercice modéré 3-5 jours par semaine",
  ACTIVE: "Exercice intense 6-7 jours par semaine",
  VERY_ACTIVE: "Exercice très intense + travail physique",
};
