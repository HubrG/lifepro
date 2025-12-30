"use client";

import { use } from "react";
import { useVisionBoard } from "@/lib/queries/use-vision-board";
import { BoardView } from "@/components/vision-board/board-view";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";

interface BoardPageProps {
  params: Promise<{ boardId: string }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const { boardId } = use(params);
  const { data: board, isLoading, error } = useVisionBoard(boardId);

  if (isLoading) {
    return <BoardSkeleton />;
  }

  if (error || !board) {
    notFound();
  }

  return <BoardView board={board} />;
}

function BoardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
