"use client";

import { ItemCard } from "./item-card";
import { Images } from "lucide-react";
import type { VisionBoardItem } from "@prisma/client";

interface ItemGridProps {
  items: VisionBoardItem[];
  boardId: string;
}

export function ItemGrid({ items, boardId }: ItemGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Images className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Votre board est vide</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Ajoutez des images et affirmations pour visualiser vos objectifs
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} boardId={boardId} />
      ))}
    </div>
  );
}
