"use client";

import { BoardList } from "@/components/vision-board/board-list";
import { BoardForm } from "@/components/vision-board/board-form";
import { Target, Images, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVisionBoards } from "@/lib/queries/use-vision-board";

export default function VisionBoardPage() {
  const { data: boards } = useVisionBoards();

  const totalBoards = boards?.length || 0;
  const totalItems = boards?.reduce((acc, b) => acc + b.itemCount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vision Board</h1>
          <p className="text-muted-foreground">
            Visualisez vos objectifs et rêves pour les atteindre
          </p>
        </div>
        <BoardForm />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Boards</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBoards}</div>
            <p className="text-xs text-muted-foreground">
              tableau{totalBoards > 1 ? "x" : ""} de visualisation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Éléments</CardTitle>
            <Images className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              images et affirmations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conseil</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Consultez votre board chaque matin pour rester motivé
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des boards */}
      <BoardList />
    </div>
  );
}
