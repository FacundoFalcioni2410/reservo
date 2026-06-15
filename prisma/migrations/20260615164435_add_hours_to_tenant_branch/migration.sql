-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "closeTime" INTEGER,
ADD COLUMN     "openTime" INTEGER;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "closeTime" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "openTime" INTEGER NOT NULL DEFAULT 8;
