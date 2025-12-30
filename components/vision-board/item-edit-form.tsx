"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Square, RectangleHorizontal, Maximize2, LayoutGrid } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateVisionBoardItem } from "@/lib/queries/use-vision-board";
import type { VisionBoardItem } from "@prisma/client";

interface ItemEditFormProps {
  item: VisionBoardItem;
  boardId: string;
}

const itemEditSchema = z.object({
  imageUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  imageCredit: z.string().max(200).optional().or(z.literal("")),
  text: z.string().max(500).optional().or(z.literal("")),
  color: z.string().optional().or(z.literal("")),
  importance: z.number().min(1).max(4),
});

type ItemEditInput = z.infer<typeof itemEditSchema>;

const importanceOptions = [
  { value: 1, label: "Petit", icon: Square, description: "1×1" },
  { value: 2, label: "Moyen", icon: RectangleHorizontal, description: "2×1" },
  { value: 3, label: "Grand", icon: Maximize2, description: "2×2" },
  { value: 4, label: "Très grand", icon: LayoutGrid, description: "3×2" },
];

export function ItemEditForm({ item, boardId }: ItemEditFormProps) {
  const [open, setOpen] = useState(false);
  const updateItem = useUpdateVisionBoardItem(boardId);

  const form = useForm<ItemEditInput>({
    resolver: zodResolver(itemEditSchema),
    defaultValues: {
      imageUrl: item.imageUrl || "",
      imageCredit: item.imageCredit || "",
      text: item.text || "",
      color: item.color || "",
      importance: item.importance || 1,
    },
  });

  const handleSubmit = async (data: ItemEditInput) => {
    try {
      await updateItem.mutateAsync({
        itemId: item.id,
        data: {
          imageUrl: data.imageUrl || undefined,
          imageCredit: data.imageCredit || undefined,
          text: data.text || undefined,
          color: data.color || undefined,
          importance: data.importance,
        },
      });
      setOpen(false);
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const hasImage = !!item.imageUrl;
  const hasText = !!item.text;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="icon" className="h-7 w-7">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l'élément</DialogTitle>
          <DialogDescription>
            Modifiez l'image et/ou le texte de cet élément
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs defaultValue={hasImage ? "image" : "text"}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="image">
                  Image {form.watch("imageUrl") && "✓"}
                </TabsTrigger>
                <TabsTrigger value="text">
                  Texte {form.watch("text") && "✓"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de l'image</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://images.unsplash.com/..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageCredit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crédit (optionnel)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Photo by John Doe on Unsplash"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("imageUrl") && (
                  <div className="relative aspect-video overflow-hidden rounded-md border">
                    <img
                      src={form.watch("imageUrl")}
                      alt="Aperçu"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="text" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texte / Affirmation</FormLabel>
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
                      <FormLabel>Couleur de fond</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          {[
                            "",
                            "#f0f9ff",
                            "#fef3c7",
                            "#dcfce7",
                            "#fce7f3",
                            "#f3e8ff",
                            "#fed7aa",
                          ].map((color, index) => (
                            <button
                              key={color || "none"}
                              type="button"
                              onClick={() => field.onChange(color)}
                              className={`h-8 w-8 rounded-full border-2 transition-all ${
                                field.value === color
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "border-muted"
                              }`}
                              style={{
                                backgroundColor: color || "#ffffff",
                              }}
                              title={index === 0 ? "Aucune" : undefined}
                            >
                              {index === 0 && (
                                <span className="text-xs text-muted-foreground">
                                  ∅
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            {/* Sélecteur d'importance (commun) */}
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
              <Button type="submit" disabled={updateItem.isPending}>
                {updateItem.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
