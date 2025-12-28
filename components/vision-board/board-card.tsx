"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MoreHorizontal, Star, Trash2, Images } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useDeleteVisionBoard } from "@/lib/queries/use-vision-board";
import type { VisionBoardSummary } from "@/lib/types/vision-board";

interface BoardCardProps {
  board: VisionBoardSummary;
}

export function BoardCard({ board }: BoardCardProps) {
  const deleteBoard = useDeleteVisionBoard();

  const handleDelete = async () => {
    await deleteBoard.mutateAsync(board.id);
  };

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/vision-board/${board.id}`}>
        <div className="relative aspect-video bg-muted">
          {board.coverImage ? (
            <img
              src={board.coverImage}
              alt={board.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Images className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          {board.isDefault && (
            <div className="absolute top-2 left-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
          )}
        </div>
      </Link>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <Link href={`/vision-board/${board.id}`} className="flex-1">
            <h3 className="font-semibold line-clamp-1 hover:underline">
              {board.title}
            </h3>
          </Link>

          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce board ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Tous les éléments de ce board
                  seront supprimés.
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
      </CardHeader>

      <CardContent className="pt-0">
        {board.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {board.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{board.itemCount} élément{board.itemCount > 1 ? "s" : ""}</span>
          <span>
            {formatDistanceToNow(new Date(board.updatedAt), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
