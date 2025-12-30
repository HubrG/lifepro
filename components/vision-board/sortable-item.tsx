"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ItemCard } from "./item-card";
import type { VisionBoardItem } from "@prisma/client";
import type { CSSProperties } from "react";

interface SortableItemProps {
  item: VisionBoardItem;
  boardId: string;
  className?: string;
  style?: CSSProperties;
}

export function SortableItem({ item, boardId, className, style }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const sortableStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    ...style,
  };

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      className={className}
      {...attributes}
      {...listeners}
    >
      <ItemCard item={item} boardId={boardId} />
    </div>
  );
}
