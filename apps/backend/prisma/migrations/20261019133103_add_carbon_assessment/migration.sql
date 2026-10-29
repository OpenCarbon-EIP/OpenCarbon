/*
  Warnings:

  - The `payment_status` column on the `mission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[id_application]` on the table `mission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('LITRE', 'KG', 'TONNE', 'M3', 'M2', 'KWH', 'TONNE_KM', 'KM', 'UNIT');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('ROADWORKS', 'NETWORKS', 'EARTHWORKS', 'CIVIL_ENGINEERING', 'OTHER');

-- CreateEnum
CREATE TYPE "OrganizationalBoundary" AS ENUM ('OPERATIONAL_CONTROL', 'FINANCIAL_CONTROL', 'EQUITY_SHARE');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('FORECAST', 'ACTUAL');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'VALIDATED', 'SENT');

-- CreateEnum
CREATE TYPE "MaturityLevel" AS ENUM ('INITIAL', 'STANDARD', 'ADVANCED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('FUEL_INVOICE', 'DELIVERY_NOTE', 'MATERIAL_INVOICE', 'WASTE_SLIP', 'ELECTRICITY_INVOICE', 'BILL_OF_QUANTITIES', 'MAINTENANCE_REPORT', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ExtractionJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'CORRECTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DataOrigin" AS ENUM ('MEASURED', 'CALCULATED', 'ESTIMATED');

-- CreateEnum
CREATE TYPE "EntryMode" AS ENUM ('AI_EXTRACTED', 'MANUAL');

-- CreateEnum
CREATE TYPE "EmissionFactorSource" AS ENUM ('BASE_EMPREINTE', 'FDES', 'SUPPLIER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EmissionFactorStatus" AS ENUM ('VALID_GENERIC', 'VALID_SPECIFIC', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PROPOSED', 'RETAINED', 'REJECTED');

-- AlterTable
ALTER TABLE "mission" ADD COLUMN     "id_application" TEXT,
ALTER COLUMN "end_date" DROP NOT NULL,
DROP COLUMN "payment_status",
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "client" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "siren" TEXT,
    "employee_count" INTEGER,
    "sector" TEXT,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "id_consultant" TEXT NOT NULL,
    "id_company" TEXT,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worksite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "project_owner" TEXT,
    "contract_reference" TEXT,
    "address" TEXT,
    "work_type" "WorkType" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "functional_unit_value" DECIMAL(14,3),
    "functional_unit_label" TEXT,
    "organizational_boundary" "OrganizationalBoundary" NOT NULL DEFAULT 'OPERATIONAL_CONTROL',
    "subcontractors_included" BOOLEAN NOT NULL DEFAULT true,
    "boundary_justification" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "id_client" TEXT NOT NULL,
    "id_mission" TEXT,

    CONSTRAINT "worksite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment" (
    "id" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL DEFAULT 'ACTUAL',
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "maturity_level" "MaturityLevel" NOT NULL DEFAULT 'INITIAL',
    "title" TEXT,
    "total_kgco2e" DECIMAL(18,3),
    "total_uncertainty_pct" DECIMAL(6,2),
    "computed_at" TIMESTAMP(3),
    "validated_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "report_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "id_worksite" TEXT NOT NULL,

    CONSTRAINT "assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "detected_type" "DocumentType" NOT NULL DEFAULT 'UNKNOWN',
    "extraction_status" "ExtractionJobStatus" NOT NULL DEFAULT 'PENDING',
    "extraction_error" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_worksite" TEXT NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extraction" (
    "id" TEXT NOT NULL,
    "page" INTEGER,
    "bounding_box" JSONB,
    "raw_values" JSONB NOT NULL,
    "product_label" TEXT,
    "quantity" DECIMAL(18,6),
    "unit" "Unit",
    "document_date" TIMESTAMP(3),
    "supplier_name" TEXT,
    "supplier_address" TEXT,
    "confidence" DECIMAL(4,3) NOT NULL,
    "status" "ExtractionStatus" NOT NULL DEFAULT 'PROPOSED',
    "correction" JSONB,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_document" TEXT NOT NULL,
    "id_proposed_category" TEXT,
    "id_proposed_factor" TEXT,

    CONSTRAINT "extraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_category" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "iso_14064_category" TEXT NOT NULL,
    "bilan_carbone_v9_post" TEXT,
    "is_direct" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "emission_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_factor" (
    "id" TEXT NOT NULL,
    "source" "EmissionFactorSource" NOT NULL DEFAULT 'BASE_EMPREINTE',
    "external_id" TEXT,
    "name" TEXT NOT NULL,
    "attribute" TEXT,
    "boundary" TEXT,
    "value_kgco2e" DECIMAL(18,6) NOT NULL,
    "per_unit" "Unit" NOT NULL,
    "uncertainty_pct" DECIMAL(6,2),
    "scope_note" TEXT,
    "location" TEXT NOT NULL DEFAULT 'France continentale',
    "status" "EmissionFactorStatus" NOT NULL DEFAULT 'VALID_GENERIC',
    "source_reference" TEXT,
    "database_version" TEXT,
    "retrieved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_default_category" TEXT,
    "id_consultant" TEXT,

    CONSTRAINT "emission_factor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_line" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "input_quantity" DECIMAL(18,6) NOT NULL,
    "input_unit" "Unit" NOT NULL,
    "conversion_factor" DECIMAL(12,6),
    "conversion_note" TEXT,
    "calc_quantity" DECIMAL(18,6) NOT NULL,
    "calc_unit" "Unit" NOT NULL,
    "fe_value_kgco2e" DECIMAL(18,6) NOT NULL,
    "fe_label" TEXT NOT NULL,
    "fe_uncertainty_pct" DECIMAL(6,2),
    "fe_database_version" TEXT,
    "data_uncertainty_pct" DECIMAL(6,2) NOT NULL,
    "data_origin" "DataOrigin" NOT NULL,
    "entry_mode" "EntryMode" NOT NULL DEFAULT 'MANUAL',
    "result_kgco2e" DECIMAL(18,3) NOT NULL,
    "line_uncertainty_pct" DECIMAL(6,2) NOT NULL,
    "is_validated" BOOLEAN NOT NULL DEFAULT false,
    "validated_at" TIMESTAMP(3),
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "id_assessment" TEXT NOT NULL,
    "id_category" TEXT NOT NULL,
    "id_emission_factor" TEXT NOT NULL,
    "id_extraction" TEXT,

    CONSTRAINT "activity_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reduction_action" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "estimated_reduction_kgco2e" DECIMAL(18,3),
    "status" "ActionStatus" NOT NULL DEFAULT 'PROPOSED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_assessment" TEXT NOT NULL,
    "id_activity_line" TEXT,
    "id_alternative_factor" TEXT,

    CONSTRAINT "reduction_action_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_id_consultant_idx" ON "client"("id_consultant");

-- CreateIndex
CREATE INDEX "worksite_id_client_idx" ON "worksite"("id_client");

-- CreateIndex
CREATE INDEX "worksite_id_mission_idx" ON "worksite"("id_mission");

-- CreateIndex
CREATE INDEX "assessment_id_worksite_idx" ON "assessment"("id_worksite");

-- CreateIndex
CREATE INDEX "document_id_worksite_idx" ON "document"("id_worksite");

-- CreateIndex
CREATE UNIQUE INDEX "document_id_worksite_sha256_key" ON "document"("id_worksite", "sha256");

-- CreateIndex
CREATE INDEX "extraction_id_document_idx" ON "extraction"("id_document");

-- CreateIndex
CREATE INDEX "extraction_status_idx" ON "extraction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "emission_category_code_key" ON "emission_category"("code");

-- CreateIndex
CREATE INDEX "emission_factor_external_id_idx" ON "emission_factor"("external_id");

-- CreateIndex
CREATE INDEX "emission_factor_id_default_category_idx" ON "emission_factor"("id_default_category");

-- CreateIndex
CREATE UNIQUE INDEX "activity_line_id_extraction_key" ON "activity_line"("id_extraction");

-- CreateIndex
CREATE INDEX "activity_line_id_assessment_idx" ON "activity_line"("id_assessment");

-- CreateIndex
CREATE INDEX "activity_line_id_category_idx" ON "activity_line"("id_category");

-- CreateIndex
CREATE INDEX "reduction_action_id_assessment_idx" ON "reduction_action"("id_assessment");

-- CreateIndex
CREATE UNIQUE INDEX "mission_id_application_key" ON "mission"("id_application");

-- AddForeignKey
ALTER TABLE "mission" ADD CONSTRAINT "mission_id_application_fkey" FOREIGN KEY ("id_application") REFERENCES "application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_id_consultant_fkey" FOREIGN KEY ("id_consultant") REFERENCES "consultant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_id_company_fkey" FOREIGN KEY ("id_company") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worksite" ADD CONSTRAINT "worksite_id_client_fkey" FOREIGN KEY ("id_client") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worksite" ADD CONSTRAINT "worksite_id_mission_fkey" FOREIGN KEY ("id_mission") REFERENCES "mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_id_worksite_fkey" FOREIGN KEY ("id_worksite") REFERENCES "worksite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_id_worksite_fkey" FOREIGN KEY ("id_worksite") REFERENCES "worksite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extraction" ADD CONSTRAINT "extraction_id_document_fkey" FOREIGN KEY ("id_document") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extraction" ADD CONSTRAINT "extraction_id_proposed_category_fkey" FOREIGN KEY ("id_proposed_category") REFERENCES "emission_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extraction" ADD CONSTRAINT "extraction_id_proposed_factor_fkey" FOREIGN KEY ("id_proposed_factor") REFERENCES "emission_factor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emission_factor" ADD CONSTRAINT "emission_factor_id_default_category_fkey" FOREIGN KEY ("id_default_category") REFERENCES "emission_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emission_factor" ADD CONSTRAINT "emission_factor_id_consultant_fkey" FOREIGN KEY ("id_consultant") REFERENCES "consultant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_line" ADD CONSTRAINT "activity_line_id_assessment_fkey" FOREIGN KEY ("id_assessment") REFERENCES "assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_line" ADD CONSTRAINT "activity_line_id_category_fkey" FOREIGN KEY ("id_category") REFERENCES "emission_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_line" ADD CONSTRAINT "activity_line_id_emission_factor_fkey" FOREIGN KEY ("id_emission_factor") REFERENCES "emission_factor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_line" ADD CONSTRAINT "activity_line_id_extraction_fkey" FOREIGN KEY ("id_extraction") REFERENCES "extraction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reduction_action" ADD CONSTRAINT "reduction_action_id_assessment_fkey" FOREIGN KEY ("id_assessment") REFERENCES "assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reduction_action" ADD CONSTRAINT "reduction_action_id_activity_line_fkey" FOREIGN KEY ("id_activity_line") REFERENCES "activity_line"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reduction_action" ADD CONSTRAINT "reduction_action_id_alternative_factor_fkey" FOREIGN KEY ("id_alternative_factor") REFERENCES "emission_factor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
