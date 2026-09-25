-- CreateEnum
CREATE TYPE "ApprovalRequestKind" AS ENUM ('STAMP', 'REDEEM');

-- AlterTable
ALTER TABLE "ApprovalRequest" ADD COLUMN     "kind" "ApprovalRequestKind" NOT NULL DEFAULT 'STAMP';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "consentIp" TEXT,
ADD COLUMN     "consentedAt" TIMESTAMP(3),
ADD COLUMN     "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "termsAccepted" BOOLEAN NOT NULL DEFAULT false;
