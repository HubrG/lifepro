"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./sortable-item";
import { Images } from "lucide-react";
import { useReorderVisionBoardItems } from "@/lib/queries/use-vision-board";
import type { VisionBoardItem } from "@prisma/client";

interface ItemGridProps {
  items: VisionBoardItem[];
  boardId: string;
}

// Calcul des classes de taille basées sur l'importance
function getGridClasses(importance: number): string {
  switch (importance) {
    case 4: // Très grand - 3x2
      return "col-span-3 row-span-2";
    case 3: // Grand - 2x2
      return "col-span-2 row-span-2";
    case 2: // Moyen - 2x1
      return "col-span-2 row-span-1";
    case 1: // Petit - 1x1
    default:
      return "col-span-1 row-span-1";
  }
}

export function ItemGrid({ items, boardId }: ItemGridProps) {
  const [localItems, setLocalItems] = useState(items);
  const reorderItems = useReorderVisionBoardItems(boardId);

  // Sync local items when props change (new items added/removed)
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex((item) => item.id === active.id);
      const newIndex = localItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(localItems, oldIndex, newIndex);
      setLocalItems(newItems);

      // Persist to server
      reorderItems.mutate({
        boardId,
        itemIds: newItems.map((item) => item.id),
      });
    }
  };

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={localItems.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div
          className="mx-auto grid gap-3 sm:gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gridAutoRows: "180px",
            maxWidth: "1200px",
          }}
        >
          {localItems.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              boardId={boardId}
              className={getGridClasses(item.importance)}
              style={{
                minHeight: item.importance >= 3 ? "360px" : "180px",
              }}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
