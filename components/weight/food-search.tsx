"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Loader2, Sparkles, Database } from "lucide-react";
import { MealType } from "@prisma/client";
import { useAddFoodEntry, useFoodSearch, useBarcodeSearch } from "@/lib/queries/use-food-entries";
import { MEAL_TYPE_LABELS } from "@/lib/constants/meal-types";
import type { OpenFoodFactsProduct } from "@/lib/validations/food-schema";
import { toast } from "sonner";
import ky from "ky";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Schéma pour le formulaire de quantité
const quantityFormSchema = z.object({
  quantity: z.number().min(1, "La quantité doit être d'au moins 1g/ml"),
  mealType: z.nativeEnum(MealType),
  date: z.date(),
  notes: z.string().optional().or(z.literal("")),
});

type QuantityFormValues = z.infer<typeof quantityFormSchema>;

export function FoodSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<OpenFoodFactsProduct | null>(null);
  const [showQuantityForm, setShowQuantityForm] = useState(false);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiProduct, setAiProduct] = useState<OpenFoodFactsProduct | null>(null);

  // Détecter si c'est un code-barre (8-13 chiffres)
  const isBarcode = /^\d{8,13}$/.test(searchQuery.trim());

  // Recherche par texte OU par code-barre selon le format
  const { data: products = [], isLoading: isLoadingText } = useFoodSearch(
    searchQuery,
    open && !isBarcode
  );
  const { data: barcodeProduct, isLoading: isLoadingBarcode } = useBarcodeSearch(
    searchQuery,
    open && isBarcode
  );

  // Combiner les résultats : code-barre donne 1 produit, texte donne plusieurs
  const displayProducts = isBarcode && barcodeProduct ? [barcodeProduct] : products;
  const isLoading = isLoadingText || isLoadingBarcode;

  const addFoodEntry = useAddFoodEntry();

  // Recherche AI
  const handleAiSearch = async () => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      toast.error("Veuillez entrer au moins 2 caractères");
      return;
    }

    setAiSearchLoading(true);
    setAiProduct(null);

    try {
      const response = await ky
        .post("/api/food/ai-search", {
          json: { query: searchQuery },
          timeout: 30000, // 30 secondes pour l'AI
        })
        .json<{ product: OpenFoodFactsProduct }>();

      console.log("✅ AI product received:", response.product);
      setAiProduct(response.product);
      console.log("✅ AI product state set, should render now");
      toast.success("Informations nutritionnelles générées par IA");
    } catch (error) {
      console.error("AI search error:", error);
      toast.error("Erreur lors de la recherche IA. Veuillez réessayer.");
    } finally {
      setAiSearchLoading(false);
    }
  };

  const form = useForm<QuantityFormValues>({
    resolver: zodResolver(quantityFormSchema),
    defaultValues: {
      quantity: 100,
      mealType: MealType.LUNCH,
      date: new Date(),
      notes: "",
    },
  });

  const handleProductSelect = (product: OpenFoodFactsProduct) => {
    setSelectedProduct(product);
    setShowQuantityForm(true);
  };

  const onSubmit = async (data: QuantityFormValues) => {
    if (!selectedProduct) return;

    const result = await addFoodEntry.mutateAsync({
      productName: selectedProduct.name,
      productBarcode: selectedProduct.code,
      brandName: selectedProduct.brands,
      calories: selectedProduct.caloriesPer100g,
      proteins: selectedProduct.proteinsPer100g,
      carbs: selectedProduct.carbsPer100g,
      fats: selectedProduct.fatPer100g,
      fibers: selectedProduct.fibersPer100g || undefined,
      quantity: data.quantity,
      servingSize: 100,
      date: data.date,
      mealType: data.mealType,
      notes: data.notes || undefined,
    });

    if (result.success) {
      setOpen(false);
      setSelectedProduct(null);
      setShowQuantityForm(false);
      setSearchQuery("");
      setAiProduct(null);
      form.reset();
    }
  };

  const handleBack = () => {
    setShowQuantityForm(false);
    setSelectedProduct(null);
    setAiProduct(null); // Clear AI result when going back
  };

  // Ne pas effacer le résultat AI automatiquement - laisser l'utilisateur le faire manuellement
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // On ne clear plus aiProduct ici - cela causait l'effacement avant l'affichage
  };

  // Calcul des calories pour la quantité
  const watchedQuantity = form.watch("quantity");
  const estimatedCalories = selectedProduct
    ? Math.round((selectedProduct.caloriesPer100g * watchedQuantity) / 100)
    : 0;

  // Handler pour la fermeture du dialog
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Réinitialiser tous les états quand on ferme le dialog
      setSearchQuery("");
      setAiProduct(null);
      setShowQuantityForm(false);
      setSelectedProduct(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un aliment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        {!showQuantityForm ? (
          <>
            <DialogHeader>
              <DialogTitle>Rechercher un aliment</DialogTitle>
              <DialogDescription>
                Recherchez dans la base de données Open Food Facts (500 000+ produits)
              </DialogDescription>
              
            </DialogHeader>

            <Command shouldFilter={false} className="rounded-lg border shadow-md">
              <CommandInput
                placeholder="Rechercher un produit... (ex: yaourt, pomme)"
                value={searchQuery}
                onValueChange={handleSearchChange}
              />
              <CommandList>
                {isLoading && (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
                {!isLoading && searchQuery.length < 2 && (
                  <CommandEmpty>
                    <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Tapez au moins 2 caractères pour rechercher
                    </p>
                  </CommandEmpty>
                )}
                {!isLoading && searchQuery.length >= 2 && displayProducts.length === 0 && !aiProduct && (
                  <CommandEmpty>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Aucun produit trouvé dans Open Food Facts</p>
                      <Button
                        onClick={handleAiSearch}
                        disabled={aiSearchLoading}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        {aiSearchLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyse en cours...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Rechercher avec l'IA
                          </>
                        )}
                      </Button>
                    </div>
                  </CommandEmpty>
                )}
                {!isLoading && displayProducts.length > 0 && (
                  <>
                    <CommandGroup heading={`${displayProducts.length} produit${displayProducts.length > 1 ? 's' : ''} trouvé${displayProducts.length > 1 ? 's' : ''}`}>
                    {displayProducts.map((product) => (
                      <CommandItem
                        key={product.code}
                        onSelect={() => handleProductSelect(product)}
                        className="flex items-start gap-3 cursor-pointer"
                      >
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-12 w-12 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          {product.brands && (
                            <p className="text-xs text-muted-foreground truncate">
                              {product.brands}
                            </p>
                          )}
                          {product.quantity && (
                            <p className="text-xs text-muted-foreground">
                              📦 {product.quantity}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {product.caloriesPer100g} kcal / 100g
                            {product.proteinsPer100g > 0 && ` • ${product.proteinsPer100g}g protéines`}
                          </p>
                        </div>
                      </CommandItem>
                    ))}
                    </CommandGroup>
                    <div className="p-3 border-t">
                      <Button
                        onClick={handleAiSearch}
                        disabled={aiSearchLoading}
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                      >
                        {aiSearchLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyse en cours...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Ou rechercher avec l'IA
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
                {aiProduct && (
                  <CommandGroup heading="Résultat IA">
                    <CommandItem
                      onSelect={() => handleProductSelect(aiProduct)}
                      className="flex items-start gap-3 cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{aiProduct.name}</p>
                        {aiProduct.brands && (
                          <p className="text-xs text-muted-foreground truncate">
                            {aiProduct.brands}
                          </p>
                        )}
                        {aiProduct.quantity && (
                          <p className="text-xs text-muted-foreground">
                            📦 {aiProduct.quantity}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {aiProduct.caloriesPer100g} kcal / 100g
                          {aiProduct.proteinsPer100g > 0 && ` • ${aiProduct.proteinsPer100g}g protéines`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Sparkles className="h-3 w-3" />
                            IA
                          </span>
                          {aiProduct.confidence && (
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              aiProduct.confidence === "high"
                                ? "bg-green-100 text-green-800"
                                : aiProduct.confidence === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-orange-100 text-orange-800"
                            }`}>
                              {aiProduct.confidence === "high"
                                ? "Haute confiance"
                                : aiProduct.confidence === "medium"
                                ? "Confiance moyenne"
                                : "Estimation"}
                            </span>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Ajouter au journal</DialogTitle>
              <DialogDescription>
                {selectedProduct?.name}
                {selectedProduct?.brands && ` - ${selectedProduct.brands}`}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Quantité */}
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantité (g ou ml)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="10000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Valeurs nutritionnelles pour 100g/100ml
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type de repas */}
                <FormField
                  control={form.control}
                  name="mealType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de repas</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type de repas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(MealType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {MEAL_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: fr })
                              ) : (
                                <span>Sélectionner une date</span>
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
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notes sur ce repas..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Aperçu calories */}
                {estimatedCalories > 0 && (
                  <div className="rounded-lg bg-muted p-4">
                    <div className="text-sm font-medium text-muted-foreground">
                      Calories pour {watchedQuantity}g
                    </div>
                    <div className="text-2xl font-bold">{estimatedCalories} kcal</div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                    Retour
                  </Button>
                  <Button type="submit" className="flex-1" disabled={addFoodEntry.isPending}>
                    {addFoodEntry.isPending ? "Ajout en cours..." : "Ajouter"}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
