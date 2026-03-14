-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CONSULTANT', 'COMPANY', 'ADMIN');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CONSULTANT',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultant" (
    "id" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "professional_title" TEXT NOT NULL,
    "description" TEXT,
    "photo_url" TEXT,
    "rating_score" INTEGER NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "id_user" TEXT NOT NULL,

    CONSTRAINT "consultant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certification" (
    "id" TEXT NOT NULL,
    "certification_name" TEXT NOT NULL,
    "certification_end_date" TIMESTAMP(3) NOT NULL,
    "issuing_organization" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "evidence_url" TEXT,
    "id_consultant" TEXT NOT NULL,

    CONSTRAINT "certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "industry_sector" JSONB,
    "company_size" INTEGER,
    "description" TEXT,
    "logo_url" TEXT,
    "id_user" TEXT NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budget" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'OPEN',
    "location" TEXT NOT NULL,
    "id_company" TEXT NOT NULL,

    CONSTRAINT "offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "id_offer" TEXT NOT NULL,
    "id_consultant" TEXT NOT NULL,

    CONSTRAINT "application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal" (
    "id" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "id_company" TEXT,
    "id_consultant" TEXT,

    CONSTRAINT "legal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission" (
    "id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "estimated_end_date" TIMESTAMP(3) NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "payment_status" TEXT NOT NULL,
    "status" "MissionStatus" NOT NULL DEFAULT 'ONGOING',
    "id_company" TEXT NOT NULL,
    "id_consultant" TEXT NOT NULL,

    CONSTRAINT "mission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "consultant_id_user_key" ON "consultant"("id_user");

-- CreateIndex
CREATE UNIQUE INDEX "company_id_user_key" ON "company"("id_user");

-- CreateIndex
CREATE UNIQUE INDEX "legal_registration_number_key" ON "legal"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "legal_iban_key" ON "legal"("iban");

-- CreateIndex
CREATE UNIQUE INDEX "legal_id_company_key" ON "legal"("id_company");

-- CreateIndex
CREATE UNIQUE INDEX "legal_id_consultant_key" ON "legal"("id_consultant");

-- AddForeignKey
ALTER TABLE "consultant" ADD CONSTRAINT "consultant_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification" ADD CONSTRAINT "certification_id_consultant_fkey" FOREIGN KEY ("id_consultant") REFERENCES "consultant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer" ADD CONSTRAINT "offer_id_company_fkey" FOREIGN KEY ("id_company") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_id_offer_fkey" FOREIGN KEY ("id_offer") REFERENCES "offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_id_consultant_fkey" FOREIGN KEY ("id_consultant") REFERENCES "consultant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal" ADD CONSTRAINT "legal_id_company_fkey" FOREIGN KEY ("id_company") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal" ADD CONSTRAINT "legal_id_consultant_fkey" FOREIGN KEY ("id_consultant") REFERENCES "consultant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission" ADD CONSTRAINT "mission_id_company_fkey" FOREIGN KEY ("id_company") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission" ADD CONSTRAINT "mission_id_consultant_fkey" FOREIGN KEY ("id_consultant") REFERENCES "consultant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
