import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  EntryMode,
  ExtractionStatus,
  Prisma,
} from 'src/generated/prisma/client';
import type { extraction } from 'src/generated/prisma/client';
import { ConsultantService } from 'src/consultant/consultant.service';
import { DocumentService } from 'src/document/document.service';
import { AssessmentService } from 'src/assessment/assessment.service';
import { ActivityLineService } from 'src/activity-line/activity-line.service';
import { EmissionFactorService } from 'src/emission-factor/emission-factor.service';
import { EmissionCategoryService } from 'src/emission-category/emission-category.service';
import {
  CreateExtractionDto,
  ListExtractionsQueryDto,
  ReviewExtractionDto,
} from 'src/dtos/extraction.dto';
import {
  EXTRACTION_DETAIL_INCLUDE,
  ExtractionWithDetails,
} from 'src/types/carbon.types';

type ExtractionWithOwner = Prisma.extractionGetPayload<{
  include: {
    document: { include: { worksite: { include: { client: true } } } };
  };
}>;

type CorrectableField =
  'label' | 'quantity' | 'unit' | 'id_category' | 'id_emission_factor';

const CORRECTABLE_FIELDS: CorrectableField[] = [
  'label',
  'quantity',
  'unit',
  'id_category',
  'id_emission_factor',
];

type Correction = Partial<
  Record<CorrectableField, { from: string | null; to: string }>
>;

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly consultantService: ConsultantService,
    private readonly documentService: DocumentService,
    private readonly assessmentService: AssessmentService,
    private readonly activityLineService: ActivityLineService,
    private readonly emissionFactorService: EmissionFactorService,
    private readonly emissionCategoryService: EmissionCategoryService,
  ) {}

  async createExtraction(
    userId: string,
    body: CreateExtractionDto,
  ): Promise<ExtractionWithDetails> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    await this.documentService.getOwnedDocument(
      body.id_document,
      consultant.id,
    );

    if (body.id_proposed_factor) {
      await this.emissionFactorService.getUsableFactor(
        body.id_proposed_factor,
        consultant.id,
      );
    }

    if (body.id_proposed_category) {
      await this.emissionCategoryService.getCategoryById(
        body.id_proposed_category,
      );
    }

    const created = await this.prisma.extraction.create({
      data: {
        ...body,
        raw_values: body.raw_values as Prisma.InputJsonObject,
        bounding_box: body.bounding_box as Prisma.InputJsonObject | undefined,
      },
      include: EXTRACTION_DETAIL_INCLUDE,
    });

    this.logger.log(
      `Extraction ${created.id} (confidence ${created.confidence.toString()}) created on document ${body.id_document}`,
    );

    return created;
  }

  async listExtractions(
    userId: string,
    query: ListExtractionsQueryDto,
  ): Promise<ExtractionWithDetails[]> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    await this.documentService.getOwnedDocument(
      query.id_document,
      consultant.id,
    );

    return await this.prisma.extraction.findMany({
      where: {
        id_document: query.id_document,
        ...(query.status && { status: query.status }),
      },
      include: EXTRACTION_DETAIL_INCLUDE,
      orderBy: [{ page: 'asc' }, { created_at: 'asc' }],
    });
  }

  async getExtractionById(
    id: string,
    userId: string,
  ): Promise<ExtractionWithDetails> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    await this.getOwnedExtraction(id, consultant.id);

    return await this.prisma.extraction.findUniqueOrThrow({
      where: { id },
      include: EXTRACTION_DETAIL_INCLUDE,
    });
  }

  async reviewExtraction(
    userId: string,
    id: string,
    body: ReviewExtractionDto,
  ): Promise<ExtractionWithDetails> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    const existing = await this.getOwnedExtraction(id, consultant.id);

    if (existing.status !== ExtractionStatus.PROPOSED) {
      throw new ConflictException(
        `Extraction has already been reviewed (${existing.status})`,
      );
    }

    if (body.status === ExtractionStatus.REJECTED) {
      const rejected = await this.prisma.extraction.update({
        where: { id },
        data: {
          status: ExtractionStatus.REJECTED,
          reviewed_at: new Date(),
          ...(body.comment && { correction: { comment: body.comment } }),
        },
        include: EXTRACTION_DETAIL_INCLUDE,
      });

      this.logger.log(
        `Extraction ${id} rejected by consultant ${consultant.id}`,
      );

      return rejected;
    }

    return await this.acceptExtraction(consultant.id, existing, body);
  }

  async deleteExtraction(
    userId: string,
    id: string,
  ): Promise<ExtractionWithDetails[]> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    const existing = await this.getOwnedExtraction(id, consultant.id);

    const linkedLine = await this.prisma.activity_line.findUnique({
      where: { id_extraction: id },
      select: { id: true },
    });

    if (linkedLine) {
      throw new ConflictException(
        `Extraction is used by activity line ${linkedLine.id}. Delete the line first`,
      );
    }

    await this.prisma.extraction.delete({ where: { id } });

    this.logger.log(`Extraction ${id} deleted by consultant ${consultant.id}`);

    return this.listExtractions(userId, { id_document: existing.id_document });
  }

  private async acceptExtraction(
    consultantId: string,
    existing: ExtractionWithOwner,
    body: ReviewExtractionDto,
  ): Promise<ExtractionWithDetails> {
    const assessmentId = body.id_assessment!;
    const assessment = await this.assessmentService.getOwnedAssessment(
      assessmentId,
      consultantId,
    );
    this.assessmentService.assertDraft(assessment);

    if (assessment.id_worksite !== existing.document.id_worksite) {
      throw new BadRequestException(
        'The assessment must belong to the same worksite as the document',
      );
    }

    const correction = this.buildCorrection(existing, body);
    const isCorrected = Object.keys(correction).length > 0;

    if (body.status === ExtractionStatus.ACCEPTED && isCorrected) {
      throw new BadRequestException(
        'Use status CORRECTED to change the values proposed by the AI',
      );
    }

    if (body.status === ExtractionStatus.CORRECTED && !isCorrected) {
      throw new BadRequestException(
        'No value differs from the AI proposal: use status ACCEPTED',
      );
    }

    const label = body.label ?? existing.product_label;
    const quantity = body.quantity ?? existing.quantity;
    const unit = body.unit ?? existing.unit;
    const factorId = body.id_emission_factor ?? existing.id_proposed_factor;

    const missingFields = [
      !label && 'label',
      quantity === null && 'quantity',
      !unit && 'unit',
      !factorId && 'id_emission_factor',
    ].filter(Boolean);

    if (!label || quantity === null || !unit || !factorId) {
      throw new BadRequestException(
        `Missing values to create the activity line: ${missingFields.join(', ')}`,
      );
    }

    const prepared = await this.activityLineService.prepareLine(consultantId, {
      label,
      input_quantity: quantity,
      input_unit: unit,
      conversion_factor: body.conversion_factor,
      conversion_note: body.conversion_note,
      id_emission_factor: factorId,
      id_category:
        body.id_category ?? existing.id_proposed_category ?? undefined,
      data_origin: body.data_origin!,
      data_uncertainty_pct: body.data_uncertainty_pct,
      comment: body.comment,
    });

    const reviewed = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.extraction.updateMany({
        where: { id: existing.id, status: ExtractionStatus.PROPOSED },
        data: {
          status: body.status,
          reviewed_at: new Date(),
          ...(isCorrected && { correction }),
        },
      });

      if (claimed.count === 0) {
        throw new ConflictException('Extraction has already been reviewed');
      }

      await tx.activity_line.create({
        data: {
          ...prepared,
          id_assessment: assessmentId,
          id_extraction: existing.id,
          entry_mode: EntryMode.AI_EXTRACTED,
        },
      });

      await this.activityLineService.recomputeTotals(tx, assessmentId);

      return await tx.extraction.findUniqueOrThrow({
        where: { id: existing.id },
        include: EXTRACTION_DETAIL_INCLUDE,
      });
    });

    this.logger.log(
      `Extraction ${existing.id} ${body.status.toLowerCase()} into assessment ${assessmentId} by consultant ${consultantId}`,
    );

    return reviewed;
  }

  private buildCorrection(
    existing: extraction,
    body: ReviewExtractionDto,
  ): Correction {
    const proposed: Record<CorrectableField, string | null> = {
      label: existing.product_label,
      quantity: existing.quantity?.toString() ?? null,
      unit: existing.unit,
      id_category: existing.id_proposed_category,
      id_emission_factor: existing.id_proposed_factor,
    };

    const correction: Correction = {};

    for (const field of CORRECTABLE_FIELDS) {
      const value = body[field];
      if (value === undefined) {
        continue;
      }

      const corrected =
        field === 'quantity'
          ? new Prisma.Decimal(value).toString()
          : String(value);
      const original = proposed[field];

      const isSameQuantity =
        field === 'quantity' &&
        original !== null &&
        new Prisma.Decimal(original).equals(corrected);

      if (corrected !== original && !isSameQuantity) {
        correction[field] = { from: original, to: corrected };
      }
    }

    return correction;
  }

  private async getOwnedExtraction(
    id: string,
    consultantId: string,
  ): Promise<ExtractionWithOwner> {
    const found = await this.prisma.extraction.findUnique({
      where: { id },
      include: {
        document: { include: { worksite: { include: { client: true } } } },
      },
    });

    if (!found) {
      throw new NotFoundException('Extraction not found');
    }

    if (found.document.worksite.client.id_consultant !== consultantId) {
      throw new ForbiddenException(
        'You do not have permission to access this extraction',
      );
    }

    return found;
  }
}
