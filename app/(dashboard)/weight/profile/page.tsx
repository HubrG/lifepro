import { ProfileForm } from "@/components/weight/profile-form";
import { BMRCalculator } from "@/components/weight/bmr-calculator";
import { ActivityRecommendations } from "@/components/weight/activity-recommendations";

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profil</h2>
        <p className="text-muted-foreground">
          Configurez vos données physiologiques et vos objectifs
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Informations personnelles</h3>
          <div className="rounded-lg border p-6">
            <ProfileForm />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Calculs métaboliques</h3>
          <BMRCalculator />
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Plan d'activité physique</h3>
          <ActivityRecommendations />
        </div>
      </div>
    </div>
  );
}
