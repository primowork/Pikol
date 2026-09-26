-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "bonusRewardsAvailable" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastBirthdayRewardYear" INTEGER;
