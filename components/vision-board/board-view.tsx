"use client";

import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemGrid } from "./item-grid";
import { ItemForm } from "./item-form";
import { BoardEditForm } from "./board-edit-form";
import type { VisionBoardWithItems } from "@/lib/types/vision-board";

interface BoardViewProps {
  board: VisionBoardWithItems;
}

export function BoardView({ board }: BoardViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mx-auto flex max-w-[1200px] items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vision-board">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{board.title}</h1>
              {board.isDefault && (
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            {board.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {board.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <BoardEditForm board={board} />
          <ItemForm boardId={board.id} />
        </div>
      </div>

      {/* Stats rapides */}
      <div className="mx-auto flex max-w-[1200px] gap-4 text-sm text-muted-foreground">
        <span>
          {board.items.filter((i) => i.type === "IMAGE").length} image
          {board.items.filter((i) => i.type === "IMAGE").length > 1 ? "s" : ""}
        </span>
        <span>•</span>
        <span>
          {board.items.filter((i) => i.type === "AFFIRMATION").length}{" "}
          affirmation
          {board.items.filter((i) => i.type === "AFFIRMATION").length > 1
            ? "s"
            : ""}
        </span>
      </div>

      {/* Grille d'items */}
      <ItemGrid items={board.items} boardId={board.id} />
    </div>
  );
}
