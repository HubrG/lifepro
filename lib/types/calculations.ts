export interface MetabolicData {
  bmr: number; // kcal/jour
  tdee: number; // kcal/jour
  dailyDeficit: number; // kcal/jour
  weeklyDeficit: number; // kcal/semaine
  estimatedCompletionDate: Date;
  daysRemaining: number;
  weeklyGoalKg: number;
  dailyCalorieTarget: number; // kcal cibles quotidiennes
}

export interface DailyStats {
  date: Date;
  caloriesConsumed: number;
  caloriesBurned: number;
  caloriesNet: number;
  tdee: number;
  balance: number; // net - tdee
  weight?: number;
}
