-- AlterTable
ALTER TABLE "companies" ADD COLUMN "clerkOrgId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "companies_clerkOrgId_key" ON "companies"("clerkOrgId");
