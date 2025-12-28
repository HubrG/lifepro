import { ActivityType, Intensity } from "@prisma/client";

/**
 * MET (Metabolic Equivalent of Task) values par type d'activité et intensité
 * Source: Compendium of Physical Activities
 * https://sites.google.com/site/compendiumofphysicalactivities/
 */
export const MET_VALUES: Record<ActivityType, Record<Intensity, number>> = {
  CARDIO: {
    LOW: 3.5, // Marche lente (4 km/h)
    MODERATE: 6.0, // Marche rapide (6 km/h)
    HIGH: 8.0, // Course modérée (8 km/h)
    VERY_HIGH: 12.0, // Course intense (12 km/h)
  },
  STRENGTH: {
    LOW: 3.0, // Yoga doux, étirements
    MODERATE: 5.0, // Musculation modérée
    HIGH: 6.0, // Musculation intense
    VERY_HIGH: 8.0, // CrossFit, HIIT
  },
  FLEXIBILITY: {
    LOW: 2.5, // Étirements légers
    MODERATE: 3.0, // Yoga, Pilates
    HIGH: 4.0, // Yoga dynamique
    VERY_HIGH: 5.0, // Power Yoga
  },
  SPORTS: {
    LOW: 4.0, // Golf, pétanque
    MODERATE: 6.0, // Tennis de table, badminton
    HIGH: 8.0, // Tennis, football amateur
    VERY_HIGH: 10.0, // Basketball, football compétition
  },
  DAILY_ACTIVITY: {
    LOW: 2.0, // Ménage léger
    MODERATE: 3.5, // Jardinage, bricolage
    HIGH: 5.0, // Déménagement, travaux
    VERY_HIGH: 6.5, // Travail physique intense
  },
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  CARDIO: "Cardio",
  STRENGTH: "Musculation",
  FLEXIBILITY: "Flexibilité",
  SPORTS: "Sports",
  DAILY_ACTIVITY: "Activité quotidienne",
};

export const INTENSITY_LABELS: Record<Intensity, string> = {
  LOW: "Faible",
  MODERATE: "Modérée",
  HIGH: "Élevée",
  VERY_HIGH: "Très élevée",
};
