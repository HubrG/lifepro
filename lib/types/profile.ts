import { ActivityLevel, Sex } from "@prisma/client";

export interface UserProfileData {
  id: string;
  age: number;
  height: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  currentWeight: number;
  targetWeight: number;
  targetDate: Date;
  weeklyGoal: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfileInput {
  age: number;
  height: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  currentWeight: number;
  targetWeight: number;
  targetDate: Date;
  weeklyGoal?: number;
}
