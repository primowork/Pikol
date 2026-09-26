-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN     "vapidSubject" TEXT,
ALTER COLUMN "aboutUsText" DROP NOT NULL;
