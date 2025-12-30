"use client";

import { Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useDeleteVisionBoardItem,
  useUpdateVisionBoardItemImportance,
} from "@/lib/queries/use-vision-board";
import { ItemEditForm } from "./item-edit-form";
import type { VisionBoardItem } from "@prisma/client";

interface ItemCardProps {
  item: VisionBoardItem;
  boardId: string;
}

export function ItemCard({ item, boardId }: ItemCardProps) {
  const deleteItem = useDeleteVisionBoardItem(boardId);
  const updateImportance = useUpdateVisionBoardItemImportance(boardId);

  const handleDelete = async () => {
    await deleteItem.mutateAsync(item.id);
  };

  const handleIncrease = () => {
    if (item.importance < 4) {
      updateImportance.mutate({ itemId: item.id, importance: item.importance + 1 });
    }
  };

  const handleDecrease = () => {
    if (item.importance > 1) {
      updateImportance.mutate({ itemId: item.id, importance: item.importance - 1 });
    }
  };

  const hasImage = !!item.imageUrl;
  const hasText = !!item.text;

  // Composant des contrôles de taille
  const SizeControls = () => (
    <div className="absolute top-2 left-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="secondary"
        size="icon"
        className="h-6 w-6"
        onClick={handleDecrease}
        disabled={item.importance <= 1 || updateImportance.isPending}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="h-6 w-6"
        onClick={handleIncrease}
        disabled={item.importance >= 4 || updateImportance.isPending}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );

  // Composant des actions (éditer/supprimer)
  const ActionButtons = () => (
    <div className="flex gap-1">
      <ItemEditForm item={item} boardId={boardId} />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="icon" className="h-7 w-7">
            <Trash2 className="h-3 w-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet élément ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // Item avec image (et potentiellement du texte)
  if (hasImage) {
    return (
      <div className="group relative h-full min-h-[150px] overflow-hidden rounded-lg border bg-muted">
        <img
          src={item.imageUrl!}
          alt="Vision board image"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />

        {/* Texte superposé sur l'image */}
        {hasText && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 pt-8">
            <p className="text-sm font-medium text-white leading-snug line-clamp-3">
              {item.text}
            </p>
          </div>
        )}

        {/* Overlay avec crédit et actions (au hover) */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.imageCredit && !hasText && (
            <p className="absolute bottom-2 left-2 right-10 text-[10px] text-white/80 truncate">
              {item.imageCredit}
            </p>
          )}

          {/* Contrôles de taille en haut à gauche */}
          <SizeControls />

          {/* Actions en haut à droite */}
          <div className="absolute top-2 right-2">
            <ActionButtons />
          </div>
        </div>
      </div>
    );
  }

  // Item texte seul (affirmation)
  return (
    <div
      className="group relative flex h-full min-h-[150px] items-center justify-center rounded-lg border p-4 text-center"
      style={{
        backgroundColor: item.color || "#f8fafc",
      }}
    >
      <p className="text-sm font-medium leading-relaxed">{item.text}</p>

      {/* Contrôles de taille en haut à gauche */}
      <SizeControls />

      {/* Actions en haut à droite */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ActionButtons />
      </div>
    </div>
  );
}
