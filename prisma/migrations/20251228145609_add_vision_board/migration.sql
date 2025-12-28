-- CreateEnum
CREATE TYPE "VisionBoardItemType" AS ENUM ('IMAGE', 'AFFIRMATION');

-- CreateTable
CREATE TABLE "VisionBoard" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "VisionBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisionBoardItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "VisionBoardItemType" NOT NULL,
    "imageUrl" TEXT,
    "imageCredit" TEXT,
    "text" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "boardId" TEXT NOT NULL,

    CONSTRAINT "VisionBoardItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisionBoard_userId_updatedAt_idx" ON "VisionBoard"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "VisionBoardItem_boardId_position_idx" ON "VisionBoardItem"("boardId", "position");

-- AddForeignKey
ALTER TABLE "VisionBoard" ADD CONSTRAINT "VisionBoard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisionBoardItem" ADD CONSTRAINT "VisionBoardItem_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "VisionBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
