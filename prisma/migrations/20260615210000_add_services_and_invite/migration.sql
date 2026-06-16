-- AlterTable User: make passwordHash nullable, add invite fields
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "inviteToken" TEXT;
ALTER TABLE "User" ADD COLUMN "inviteExpiry" TIMESTAMP(3);
CREATE UNIQUE INDEX "User_inviteToken_key" ON "User"("inviteToken");

-- CreateTable Service
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30),
    "imageUrl" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable _ProfessionalServices (User <-> Service)
CREATE TABLE "_ProfessionalServices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProfessionalServices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable _BranchServices (Branch <-> Service)
CREATE TABLE "_BranchServices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_BranchServices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable _ProfessionalBranches (Branch <-> User)
CREATE TABLE "_ProfessionalBranches" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProfessionalBranches_AB_pkey" PRIMARY KEY ("A","B")
);

-- AlterTable Booking: add serviceId
ALTER TABLE "Booking" ADD COLUMN "serviceId" TEXT;

-- CreateIndex for join tables
CREATE INDEX "_ProfessionalServices_B_index" ON "_ProfessionalServices"("B");
CREATE INDEX "_BranchServices_B_index" ON "_BranchServices"("B");
CREATE INDEX "_ProfessionalBranches_B_index" ON "_ProfessionalBranches"("B");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "_ProfessionalServices" ADD CONSTRAINT "_ProfessionalServices_A_fkey" FOREIGN KEY ("A") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProfessionalServices" ADD CONSTRAINT "_ProfessionalServices_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_BranchServices" ADD CONSTRAINT "_BranchServices_A_fkey" FOREIGN KEY ("A") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_BranchServices" ADD CONSTRAINT "_BranchServices_B_fkey" FOREIGN KEY ("B") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProfessionalBranches" ADD CONSTRAINT "_ProfessionalBranches_A_fkey" FOREIGN KEY ("A") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProfessionalBranches" ADD CONSTRAINT "_ProfessionalBranches_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
