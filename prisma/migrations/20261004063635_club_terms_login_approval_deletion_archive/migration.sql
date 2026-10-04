-- AlterEnum
ALTER TYPE "ApprovalRequestKind" ADD VALUE 'LOGIN';

-- AlterTable
ALTER TABLE "ConsentEvent" ADD COLUMN     "termsVersion" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "birthdayRewardGrantedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DeletedCustomer" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "consentHistory" JSONB NOT NULL,
    "customerSince" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedByStaffId" TEXT,

    CONSTRAINT "DeletedCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeletedCustomer_phone_idx" ON "DeletedCustomer"("phone");
