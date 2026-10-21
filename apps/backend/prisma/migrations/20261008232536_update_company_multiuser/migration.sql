/*
  Warnings:

  - You are about to drop the column `id_user` on the `company` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `company` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CompanyRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "CompanyMemberStatus" AS ENUM ('ACTIVE', 'PENDING_APPROVAL', 'REJECTED');

-- DropForeignKey
ALTER TABLE "company" DROP CONSTRAINT "company_id_user_fkey";

-- DropIndex
DROP INDEX "company_id_user_key";

-- AlterTable
ALTER TABLE "company" DROP COLUMN "id_user",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "company_member" (
    "id" TEXT NOT NULL,
    "id_company" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "role" "CompanyRole" NOT NULL DEFAULT 'MEMBER',
    "status" "CompanyMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_domain" (
    "id" TEXT NOT NULL,
    "id_company" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_invitation" (
    "id" TEXT NOT NULL,
    "id_company" TEXT NOT NULL,
    "email" TEXT,
    "role" "CompanyRole" NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_member_id_company_id_user_key" ON "company_member"("id_company", "id_user");

-- CreateIndex
CREATE UNIQUE INDEX "company_domain_domain_key" ON "company_domain"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "company_invitation_token_key" ON "company_invitation"("token");

-- AddForeignKey
ALTER TABLE "company_member" ADD CONSTRAINT "company_member_id_company_fkey" FOREIGN KEY ("id_company") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_member" ADD CONSTRAINT "company_member_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_domain" ADD CONSTRAINT "company_domain_id_company_fkey" FOREIGN KEY ("id_company") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_invitation" ADD CONSTRAINT "company_invitation_id_company_fkey" FOREIGN KEY ("id_company") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_invitation" ADD CONSTRAINT "company_invitation_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
