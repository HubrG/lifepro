import prisma from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";
import { calculateBMR, calculateTDEE } from "./metabolic-calculations";

/**
 * Agrège les données d'une journée pour calculer la balance calorique
 */
export async function aggregateDailyData(date: Date) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // Récupérer le profil utilisateur pour les calculs métaboliques
  const profile = await prisma.userProfile.findFirst();

  if (!profile) {
    throw new Error("Profil utilisateur non trouvé");
  }

  // Calculer BMR et TDEE avec validation
  let bmr = 0;
  let tdee = 0;

  try {
    // Vérifier que tous les champs nécessaires sont présents
    if (
      profile.currentWeight > 0 &&
      profile.height > 0 &&
      profile.age > 0 &&
      profile.sex &&
      profile.activityLevel
    ) {
      bmr = calculateBMR(
        profile.age,
        profile.currentWeight,
        profile.height,
        profile.sex
      );

      tdee = calculateTDEE(bmr, profile.activityLevel);

      // Vérifier que les calculs ne retournent pas NaN
      if (isNaN(bmr)) bmr = 0;
      if (isNaN(tdee)) tdee = 0;
    } else {
      console.warn("Profil incomplet pour calculer BMR/TDEE", {
        weight: profile.currentWeight,
        height: profile.height,
        age: profile.age,
        sex: profile.sex,
        activityLevel: profile.activityLevel,
      });
    }
  } catch (error) {
    console.error("Erreur lors du calcul BMR/TDEE:", error);
    bmr = 0;
    tdee = 0;
  }

  // Récupérer toutes les entrées alimentaires du jour
  const foodEntries = await prisma.foodEntry.findMany({
    where: {
      userId: profile.id,
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
  });

  // Calculer les calories consommées
  const caloriesConsumed = foodEntries.reduce((total, entry) => {
    // Calories pour la quantité consommée
    const calories = (entry.calories * entry.quantity) / entry.servingSize;
    // Vérifier que le calcul est valide
    return total + (isNaN(calories) ? 0 : calories);
  }, 0);

  // Récupérer toutes les activités du jour
  const activities = await prisma.activity.findMany({
    where: {
      userId: profile.id,
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
  });

  // Calculer les calories brûlées par les activités
  const caloriesBurnedFromActivities = activities.reduce((total, activity) => {
    const burned = activity.caloriesBurned || 0;
    return total + (isNaN(burned) ? 0 : burned);
  }, 0);

  // Total des calories brûlées = TDEE + activités
  const totalCaloriesBurned = tdee + caloriesBurnedFromActivities;

  // Balance calorique = consommé - brûlé
  const calorieBalance = caloriesConsumed - totalCaloriesBurned;

  // Validation finale pour éviter les NaN et retour des données
  return {
    date: dayStart,
    bmr: isNaN(bmr) ? 0 : bmr,
    tdee: isNaN(tdee) ? 0 : tdee,
    caloriesConsumed: isNaN(caloriesConsumed) ? 0 : caloriesConsumed,
    caloriesBurnedFromActivities: isNaN(caloriesBurnedFromActivities) ? 0 : caloriesBurnedFromActivities,
    totalCaloriesBurned: isNaN(totalCaloriesBurned) ? 0 : totalCaloriesBurned,
    calorieBalance: isNaN(calorieBalance) ? 0 : calorieBalance,
    foodEntriesCount: foodEntries.length,
    activitiesCount: activities.length,
  };
}

/**
 * Agrège les données pour une période (plusieurs jours)
 */
export async function aggregatePeriodData(startDate: Date, endDate: Date) {
  const days: Date[] = [];
  const currentDate = new Date(startDate);

  // Générer toutes les dates de la période
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Agréger les données pour chaque jour
  const dailyData = await Promise.all(
    days.map((day) => aggregateDailyData(day))
  );

  return dailyData;
}
