-- CreateEnum
CREATE TYPE "HabitType" AS ENUM ('GOOD', 'BAD');

-- AlterTable
ALTER TABLE "Habit" ADD COLUMN     "habitType" "HabitType" NOT NULL DEFAULT 'GOOD';
