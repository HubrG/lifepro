import { FoodSearch } from "@/components/weight/food-search";
import { FoodList } from "@/components/weight/food-list";
import { CalorieBalanceChart } from "@/components/weight/calorie-balance-chart";

export default function FoodPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alimentation</h1>
          <p className="text-muted-foreground">
            Suivez votre consommation alimentaire quotidienne
          </p>
        </div>
        <FoodSearch />
      </div>

      <FoodList />

      {/* Graphique de balance calorique */}
      <CalorieBalanceChart days={7} />
    </div>
  );
}
