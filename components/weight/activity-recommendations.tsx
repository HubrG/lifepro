"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMetabolicData } from "@/hooks/use-metabolic-data";
import { useProfile } from "@/lib/queries/use-profile";
import { formatCalories } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Footprints, Dumbbell, TrendingUp, Target } from "lucide-react";

export function ActivityRecommendations() {
  const { data: profile } = useProfile();
  const metabolicData = useMetabolicData();

  if (!profile || !metabolicData) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { weeklyDeficit } = metabolicData;
  const weight = profile.currentWeight;

  // Déficit total nécessaire
  const totalDeficitPerWeek = weeklyDeficit;
  const totalDeficitPerDay = weeklyDeficit / 7;

  // Approche équilibrée: 50% nutrition, 50% activité physique
  const activityDeficitPerWeek = totalDeficitPerWeek * 0.5;
  const activityDeficitPerDay = totalDeficitPerDay * 0.5;
  const nutritionDeficitPerDay = totalDeficitPerDay * 0.5;

  // Calculs pour la marche (formule basée sur recherches scientifiques)
  // Moyenne : 415 kcal pour 10 000 pas (personne de 70 kg)
  // Formule : 0.04 kcal par pas, ajusté au poids
  const caloriesPerStep = 0.04 * (weight / 70);
  const caloriesPer1000Steps = caloriesPerStep * 1000;

  // Recommandations standards de santé
  const standardStepsPerDay = 10000; // Recommandation OMS
  const standardStepsCaloriesPerDay = standardStepsPerDay * caloriesPerStep;

  // Calculs pour la musculation (formule MET scientifique)
  // Formule : MET × poids × heures
  // Modéré : 5 MET, Intense : 7 MET
  const moderateStrengthCaloriesPerHour = 5 * weight; // MET 5
  const intenseStrengthCaloriesPerHour = 7 * weight; // MET 7

  // Recommandations standards (3-4 séances de 1h par semaine)
  const standardModerateSessionsPerWeek = 4;
  const standardIntenseSessionsPerWeek = 3;
  const standardModerateCaloriesPerWeek = standardModerateSessionsPerWeek * moderateStrengthCaloriesPerHour;
  const standardIntenseCaloriesPerWeek = standardIntenseSessionsPerWeek * intenseStrengthCaloriesPerHour;

  // Approche mixte: marche quotidienne + musculation
  const mixedStepsPerDay = standardStepsPerDay;
  const mixedStepsCaloriesPerWeek = standardStepsCaloriesPerDay * 7;
  const mixedSessionsPerWeek = 3; // 3 séances de musculation
  const mixedSessionsCaloriesPerWeek = mixedSessionsPerWeek * moderateStrengthCaloriesPerHour;
  const mixedTotalCaloriesPerWeek = mixedStepsCaloriesPerWeek + mixedSessionsCaloriesPerWeek;

  return (
    <div className="space-y-6">
      {/* Objectif global */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Déficit calorique nécessaire
          </CardTitle>
          <CardDescription>
            Approche équilibrée : 50% nutrition + 50% activité physique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Déficit total/jour
              </div>
              <div className="text-3xl font-bold">{formatCalories(totalDeficitPerDay)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Via nutrition/jour
              </div>
              <div className="text-2xl font-bold text-orange-600">{formatCalories(nutritionDeficitPerDay)}</div>
              <p className="text-xs text-muted-foreground mt-1">Manger moins</p>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Via activité/jour
              </div>
              <div className="text-2xl font-bold text-blue-600">{formatCalories(activityDeficitPerDay)}</div>
              <p className="text-xs text-muted-foreground mt-1">Bouger plus</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Option 1: Marche/Pas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Footprints className="h-5 w-5 text-blue-600" />
              Option 1: Marche quotidienne
            </CardTitle>
            <CardDescription>
              Recommandation OMS : 10 000 pas/jour
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Objectif quotidien
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {standardStepsPerDay.toLocaleString("fr-FR")} pas/jour
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {formatCalories(standardStepsCaloriesPerDay)} brûlées/jour
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                📊 <strong>Compléter avec nutrition:</strong> {formatCalories(totalDeficitPerDay - standardStepsCaloriesPerDay)}/jour
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Option 2: Musculation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Dumbbell className="h-5 w-5 text-purple-600" />
              Option 2: Musculation régulière
            </CardTitle>
            <CardDescription>
              Programme équilibré et soutenable
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Intensité modérée (5 MET)
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {standardModerateSessionsPerWeek} séances/semaine
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  1h par séance • {formatCalories(standardModerateCaloriesPerWeek)} brûlées/semaine
                </p>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Intensité élevée (7 MET)
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {standardIntenseSessionsPerWeek} séances/semaine
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  1h par séance • {formatCalories(standardIntenseCaloriesPerWeek)} brûlées/semaine
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Option 3: Mixte */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Option 3: Approche mixte (Recommandée)
            </CardTitle>
            <CardDescription>
              Combinez marche quotidienne et musculation régulière
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Footprints className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Marche quotidienne</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {mixedStepsPerDay.toLocaleString("fr-FR")} pas/jour
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCalories(standardStepsCaloriesPerDay)}/jour
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Musculation</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {mixedSessionsPerWeek} séances/semaine
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCalories(mixedSessionsCaloriesPerWeek)}/semaine
                </p>
              </div>

              <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-green-900 dark:text-green-100">Total activité</span>
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-500">
                  {formatCalories(mixedTotalCaloriesPerWeek / 7)}/jour
                </div>
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                  Compléter avec {formatCalories(totalDeficitPerDay - (mixedTotalCaloriesPerWeek / 7))} nutrition
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-green-50 dark:bg-green-950 p-4">
              <p className="text-sm text-green-900 dark:text-green-100">
                ✨ <strong>Pourquoi cette approche ?</strong> Combiner marche et musculation vous permet de :
                <br />• Brûler des calories tout au long de la journée (marche)
                <br />• Développer votre masse musculaire (musculation)
                <br />• Augmenter votre métabolisme de base à long terme
                <br />• Réduire le risque de blessures par surentraînement
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note importante */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>💡 Approche équilibrée:</strong> Les recommandations ci-dessus suivent le principe 50% nutrition + 50% activité physique.
            Cette approche est plus saine et soutenable qu'un déficit uniquement par l'alimentation ou uniquement par l'exercice.
            <br /><br />
            <strong>📊 Personnalisation:</strong> Vous pouvez ajuster la répartition selon vos préférences. Par exemple, si vous êtes plus actif physiquement,
            vous pouvez réduire davantage votre restriction calorique. L'important est d'atteindre le déficit total quotidien.
            <br /><br />
            <strong>📱 Suivi:</strong> L'activité physique que vous enregistrerez dans la section "Activités" sera automatiquement comptabilisée
            dans vos bilans quotidiens.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
