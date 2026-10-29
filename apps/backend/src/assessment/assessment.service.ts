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
  AssessmentStatus,
  ExtractionStatus,
  Prisma,
} from 'src/generated/prisma/client';
import type { assessment } from 'src/generated/prisma/client';
import { ConsultantService } from 'src/consultant/consultant.service';
import { WorksiteService } from 'src/worksite/worksite.service';
import {
  CreateAssessmentDto,
  ListAssessmentsQueryDto,
  UpdateAssessmentDto,
} from 'src/dtos/assessment.dto';
import {
  ASSESSMENT_DETAIL_INCLUDE,
  AssessmentWithDetails,
  AssessmentWithOwner,
} from 'src/types/carbon.types';

const ALLOWED_STATUS_TRANSITIONS: Record<AssessmentStatus, AssessmentStatus[]> =
  {
    DRAFT: [AssessmentStatus.VALIDATED],
    VALIDATED: [AssessmentStatus.DRAFT, AssessmentStatus.SENT],
    SENT: [],
  };

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly consultantService: ConsultantService,
    private readonly worksiteService: WorksiteService,
  ) {}

  async createAssessment(
    userId: string,
    body: CreateAssessmentDto,
  ): Promise<assessment> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    await this.worksiteService.getOwnedWorksite(
      body.id_worksite,
      consultant.id,
    );

    const created = await this.prisma.assessment.create({
      data: { ...body, total_kgco2e: 0, computed_at: new Date() },
    });

    this.logger.log(
      `Assessment ${created.id} (${created.type}) created on worksite ${body.id_worksite} by consultant ${consultant.id}`,
    );

    return created;
  }

  async listAssessments(
    userId: string,
    query: ListAssessmentsQueryDto,
  ): Promise<assessment[]> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);

    return await this.prisma.assessment.findMany({
      where: {
        worksite: { client: { id_consultant: consultant.id } },
        ...(query.id_worksite && { id_worksite: query.id_worksite }),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getAssessmentById(
    id: string,
    userId: string,
  ): Promise<AssessmentWithDetails> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    await this.getOwnedAssessment(id, consultant.id);

    return await this.prisma.assessment.findUniqueOrThrow({
      where: { id },
      include: ASSESSMENT_DETAIL_INCLUDE,
    });
  }

  async getOwnedAssessment(
    id: string,
    consultantId: string,
  ): Promise<AssessmentWithOwner> {
    const found = await this.prisma.assessment.findUnique({
      where: { id },
      include: { worksite: { include: { client: true } } },
    });

    if (!found) {
      throw new NotFoundException('Assessment not found');
    }

    if (found.worksite.client.id_consultant !== consultantId) {
      throw new ForbiddenException(
        'You do not have permission to access this assessment',
      );
    }

    return found;
  }

  assertDraft(found: assessment): void {
    if (found.status !== AssessmentStatus.DRAFT) {
      throw new ConflictException(
        `Assessment is ${found.status}: set it back to DRAFT before editing its activity lines`,
      );
    }
  }

  assertNotSent(found: assessment): void {
    if (found.status === AssessmentStatus.SENT) {
      throw new ConflictException(
        'Assessment has already been sent and can no longer be modified',
      );
    }
  }

  async updateAssessment(
    userId: string,
    id: string,
    body: UpdateAssessmentDto,
  ): Promise<assessment> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    const existing = await this.getOwnedAssessment(id, consultant.id);

    this.assertNotSent(existing);

    const changesMethodology =
      body.type !== undefined || body.maturity_level !== undefined;
    if (changesMethodology) {
      this.assertDraft(existing);
    }

    const updated = await this.prisma.assessment.update({
      where: { id },
      data: body,
    });

    this.logger.log(`Assessment ${id} updated by consultant ${consultant.id}`);

    return updated;
  }

  async updateAssessmentStatus(
    userId: string,
    id: string,
    status: AssessmentStatus,
  ): Promise<assessment> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    const existing = await this.getOwnedAssessment(id, consultant.id);

    if (!ALLOWED_STATUS_TRANSITIONS[existing.status].includes(status)) {
      throw new BadRequestException(
        `Cannot change assessment status from ${existing.status} to ${status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (status === AssessmentStatus.VALIDATED) {
        await this.assertReadyForValidation(tx, id);
      }

      return await tx.assessment.update({
        where: { id },
        data: {
          status,
          ...(status === AssessmentStatus.VALIDATED && {
            validated_at: new Date(),
          }),
          ...(status === AssessmentStatus.DRAFT && { validated_at: null }),
          ...(status === AssessmentStatus.SENT && { sent_at: new Date() }),
        },
      });
    });

    this.logger.log(
      `Assessment ${id} status changed from ${existing.status} to ${status} by consultant ${consultant.id}`,
    );

    return updated;
  }

  async deleteAssessment(userId: string, id: string): Promise<assessment[]> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    const existing = await this.getOwnedAssessment(id, consultant.id);

    if (existing.status !== AssessmentStatus.DRAFT) {
      throw new ConflictException('Only DRAFT assessments can be deleted');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.releaseExtractionsOfAssessment(tx, id);
      await tx.assessment.delete({ where: { id } });
    });

    this.logger.log(`Assessment ${id} deleted by consultant ${consultant.id}`);

    return this.listAssessments(userId, { id_worksite: existing.id_worksite });
  }

  // Extractions accepted into this assessment go back to review once their lines disappear.
  async releaseExtractionsOfAssessment(
    tx: Prisma.TransactionClient,
    assessmentId: string,
  ): Promise<void> {
    await tx.extraction.updateMany({
      where: { activity_line: { id_assessment: assessmentId } },
      data: {
        status: ExtractionStatus.PROPOSED,
        reviewed_at: null,
        correction: Prisma.DbNull,
      },
    });
  }

  private async assertReadyForValidation(
    tx: Prisma.TransactionClient,
    assessmentId: string,
  ): Promise<void> {
    const [lineCount, pendingLineCount] = await Promise.all([
      tx.activity_line.count({ where: { id_assessment: assessmentId } }),
      tx.activity_line.count({
        where: { id_assessment: assessmentId, is_validated: false },
      }),
    ]);

    if (lineCount === 0) {
      throw new BadRequestException(
        'Cannot validate an assessment without activity lines',
      );
    }

    if (pendingLineCount > 0) {
      throw new BadRequestException(
        `${pendingLineCount} activity line(s) must be validated before validating the assessment`,
      );
    }
  }
}
