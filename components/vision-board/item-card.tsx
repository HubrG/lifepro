"use client";

import { Trash2 } from "lucide-react";
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
import { useDeleteVisionBoardItem } from "@/lib/queries/use-vision-board";
import type { VisionBoardItem } from "@prisma/client";

interface ItemCardProps {
  item: VisionBoardItem;
  boardId: string;
}

export function ItemCard({ item, boardId }: ItemCardProps) {
  const deleteItem = useDeleteVisionBoardItem(boardId);

  const handleDelete = async () => {
    await deleteItem.mutateAsync(item.id);
  };

  if (item.type === "IMAGE") {
    return (
      <div className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt="Vision board image"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        )}

        {/* Overlay avec crédit et actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          {item.imageCredit && (
            <p className="absolute bottom-2 left-2 right-10 text-[10px] text-white/80 truncate">
              {item.imageCredit}
            </p>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
              >
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
      </div>
    );
  }

  // Affirmation
  return (
    <div
      className="group relative flex aspect-square items-center justify-center rounded-lg border p-4 text-center"
      style={{
        backgroundColor: item.color || "#f8fafc",
      }}
    >
      <p className="text-sm font-medium leading-relaxed">{item.text}</p>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette affirmation ?</AlertDialogTitle>
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
}
