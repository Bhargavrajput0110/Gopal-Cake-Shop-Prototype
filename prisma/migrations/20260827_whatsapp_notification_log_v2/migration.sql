-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationStatus" ADD VALUE 'SENDING';
ALTER TYPE "NotificationStatus" ADD VALUE 'FAILED_RETRYABLE';
ALTER TYPE "NotificationStatus" ADD VALUE 'FAILED_FINAL';
ALTER TYPE "NotificationStatus" ADD VALUE 'UNKNOWN';

-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "mediaSourceUrl" TEXT,
ADD COLUMN     "mediaType" TEXT,
ADD COLUMN     "providerMediaId" TEXT,
ADD COLUMN     "providerMessageId" TEXT,
ADD COLUMN     "templateVersion" TEXT NOT NULL DEFAULT 'v1';

