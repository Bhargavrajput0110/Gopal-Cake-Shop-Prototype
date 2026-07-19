-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('WEBSITE', 'SALES', 'ADMIN', 'POS', 'WHATSAPP', 'INSTAGRAM', 'PHONE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'RAZORPAY';
ALTER TYPE "PaymentMethod" ADD VALUE 'PHONEPE';
ALTER TYPE "PaymentMethod" ADD VALUE 'MANUAL';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "anniversaryDate" TIMESTAMP(3),
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "preferences" JSONB;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "isPriority" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "productionPhotoUrl" TEXT,
ADD COLUMN     "qualityChecklist" JSONB,
ADD COLUMN     "source" "OrderSource" NOT NULL DEFAULT 'WEBSITE';

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
