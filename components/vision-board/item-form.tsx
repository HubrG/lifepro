"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Image as ImageIcon, MessageSquareQuote, Square, RectangleHorizontal, Maximize2, LayoutGrid } from "lucide-react";
import { z } from "zod";

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePicker } from "./image-picker";
import { useAddVisionBoardItem } from "@/lib/queries/use-vision-board";
import { VisionBoardItemType } from "@prisma/client";

interface ItemFormProps {
  boardId: string;
}

const affirmationSchema = z.object({
  text: z.string().min(1, "L'affirmation est requise").max(500),
  color: z.string().optional(),
  importance: z.number().min(1).max(4),
});

type AffirmationInput = z.infer<typeof affirmationSchema>;

const importanceOptions = [
  { value: 1, label: "Petit", icon: Square, description: "1×1" },
  { value: 2, label: "Moyen", icon: RectangleHorizontal, description: "2×1" },
  { value: 3, label: "Grand", icon: Maximize2, description: "2×2" },
  { value: 4, label: "Très grand", icon: LayoutGrid, description: "3×2" },
];

export function ItemForm({ boardId }: ItemFormProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"image" | "affirmation">("image");
  const [imageImportance, setImageImportance] = useState(1);
  const addItem = useAddVisionBoardItem();

  const form = useForm<AffirmationInput>({
    resolver: zodResolver(affirmationSchema),
    defaultValues: {
      text: "",
      color: "",
      importance: 1,
    },
  });

  const handleImageSelect = async (imageUrl: string, credit?: string) => {
    try {
      await addItem.mutateAsync({
        boardId,
        type: VisionBoardItemType.IMAGE,
        imageUrl,
        imageCredit: credit,
        importance: imageImportance,
      });
      setOpen(false);
      setImageImportance(1);
    } catch (error) {
      console.error("Error adding image:", error);
    }
  };

  const handleAffirmationSubmit = async (data: AffirmationInput) => {
    try {
      await addItem.mutateAsync({
        boardId,
        type: VisionBoardItemType.AFFIRMATION,
        text: data.text,
        color: data.color || undefined,
        importance: data.importance,
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error adding affirmation:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter un élément</DialogTitle>
          <DialogDescription>
            Ajoutez une image ou une affirmation à votre vision board
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "image" | "affirmation")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Image
            </TabsTrigger>
            <TabsTrigger value="affirmation" className="flex items-center gap-2">
              <MessageSquareQuote className="h-4 w-4" />
              Affirmation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="mt-4 space-y-4">
            {/* Sélecteur d'importance pour les images */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Taille dans la grille</label>
              <div className="flex gap-2">
                {importanceOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setImageImportance(option.value)}
                      className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all ${
                        imageImportance === option.value
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/30"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${imageImportance === option.value ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium">{option.label}</span>
                      <span className="text-[10px] text-muted-foreground">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <ImagePicker onSelect={handleImageSelect} />
          </TabsContent>

          <TabsContent value="affirmation" className="mt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleAffirmationSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Votre affirmation</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Je suis capable d'atteindre tous mes objectifs..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Couleur de fond (optionnel)</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          {[
                            "#f0f9ff",
                            "#fef3c7",
                            "#dcfce7",
                            "#fce7f3",
                            "#f3e8ff",
                            "#fed7aa",
                          ].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => field.onChange(color)}
                              className={`h-8 w-8 rounded-full border-2 transition-all ${
                                field.value === color
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "border-transparent"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="importance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taille dans la grille</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          {importanceOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => field.onChange(option.value)}
                                className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all ${
                                  field.value === option.value
                                    ? "border-primary bg-primary/5"
                                    : "border-muted hover:border-muted-foreground/30"
                                }`}
                              >
                                <Icon className={`h-5 w-5 ${field.value === option.value ? "text-primary" : "text-muted-foreground"}`} />
                                <span className="text-xs font-medium">{option.label}</span>
                                <span className="text-[10px] text-muted-foreground">{option.description}</span>
                              </button>
                            );
                          })}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={addItem.isPending}>
                    {addItem.isPending ? "Ajout..." : "Ajouter"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
