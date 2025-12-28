-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "manualCalories" DOUBLE PRECISION,
ADD COLUMN     "steps" INTEGER,
ALTER COLUMN "duration" DROP NOT NULL,
ALTER COLUMN "intensity" DROP NOT NULL;
