import { useState, useEffect } from "react";
import { useMetabolicData } from "./use-metabolic-data";

/**
 * Hook qui calcule les calories brûlées au repos depuis le début de la journée
 * Mise à jour chaque seconde
 */
export function useCalorieCounter() {
  const metabolicData = useMetabolicData();
  const [caloriesBurned, setCaloriesBurned] = useState(0);

  useEffect(() => {
    if (!metabolicData?.bmr) {
      setCaloriesBurned(0);
      return;
    }

    const calculateCalories = () => {
      const bmr = metabolicData.bmr;
      const caloriesPerSecond = bmr / 24 / 60 / 60; // BMR par seconde

      // Calculer les secondes écoulées depuis minuit
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(0, 0, 0, 0);
      const secondsSinceMidnight = (now.getTime() - midnight.getTime()) / 1000;

      // Calories brûlées depuis minuit
      const totalCalories = caloriesPerSecond * secondsSinceMidnight;
      setCaloriesBurned(totalCalories);
    };

    // Calculer immédiatement
    calculateCalories();

    // Mettre à jour chaque seconde
    const interval = setInterval(calculateCalories, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, [metabolicData?.bmr]);

  return {
    caloriesBurned,
    bmr: metabolicData?.bmr || 0,
  };
}
