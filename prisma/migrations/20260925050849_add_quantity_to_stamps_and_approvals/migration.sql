-- AlterTable
ALTER TABLE "ApprovalRequest" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "StampEvent" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;
