import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Prisma } from 'src/generated/prisma/client';
import { ConsultantService } from 'src/consultant/consultant.service';
import { AssessmentService } from 'src/assessment/assessment.service';
import { EmissionFactorService } from 'src/emission-factor/emission-factor.service';
import {
  CreateReductionActionDto,
  UpdateReductionActionDto,
} from 'src/dtos/reduction-action.dto';
import {
  REDUCTION_ACTION_DETAIL_INCLUDE,
  ReductionActionWithDetails,
} from 'src/types/carbon.types';
import { computeReductionKgco2e } from 'src/utils/carbon-calculation';

type ReductionActionWithOwner = Prisma.reduction_actionGetPayload<{
  include: {
    assessment: { include: { worksite: { include: { client: true } } } };
  };
}>;

interface ReductionTarget {
  assessmentId: string;
  consultantId: string;
  activityLineId?: string | null;
  alternativeFactorId?: string | null;
}

@Injectable()
export class ReductionActionService {
  private readonly logger = new Logger(ReductionActionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly consultantService: ConsultantService,
    private readonly assessmentService: AssessmentService,
    private readonly emissionFactorService: EmissionFactorService,
  ) {}

  async createAction(
    userId: string,
    body: CreateReductionActionDto,
  ): Promise<ReductionActionWithDetails> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    const assessment = await this.assessmentService.getOwnedAssessment(
      body.id_assessment,
      consultant.id,
    );
    this.assessmentService.assertNotSent(assessment);

    const computedReduction = await this.resolveEstimatedReduction({
      assessmentId: body.id_assessment,
      consultantId: consultant.id,
      activityLineId: body.id_activity_line,
      alternativeFactorId: body.id_alternative_factor,
    });

    const created = await this.prisma.reduction_action.create({
      data: {
        ...body,
        estimated_reduction_kgco2e:
          body.estimated_reduction_kgco2e ?? computedReduction,
      },
      include: REDUCTION_ACTION_DETAIL_INCLUDE,
    });

    this.logger.log(
      `Reduction action ${created.id} ("${created.label}") added to assessment ${body.id_assessment} by consultant ${consultant.id}`,
    );

    return created;
  }

  async listActions(
    userId: string,
    assessmentId: string,
  ): Promise<ReductionActionWithDetails[]> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    await this.assessmentService.getOwnedAssessment(
      assessmentId,
      consultant.id,
    );

    return await this.prisma.reduction_action.findMany({
      where: { id_assessment: assessmentId },
      include: REDUCTION_ACTION_DETAIL_INCLUDE,
      orderBy: { created_at: 'asc' },
    });
  }

  async getActionById(
    id: string,
    userId: string,
  ): Promise<ReductionActionWithDetails> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    await this.getOwnedAction(id, consultant.id);

    return await this.prisma.reduction_action.findUniqueOrThrow({
      where: { id },
      include: REDUCTION_ACTION_DETAIL_INCLUDE,
    });
  }

  async updateAction(
    userId: string,
    id: string,
    body: UpdateReductionActionDto,
  ): Promise<ReductionActionWithDetails> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    const existing = await this.getOwnedAction(id, consultant.id);
    this.assessmentService.assertNotSent(existing.assessment);

    const targetChanged =
      body.id_activity_line !== undefined ||
      body.id_alternative_factor !== undefined;

    const computedReduction = targetChanged
      ? await this.resolveEstimatedReduction({
          assessmentId: existing.id_assessment,
          consultantId: consultant.id,
          activityLineId: body.id_activity_line ?? existing.id_activity_line,
          alternativeFactorId:
            body.id_alternative_factor ?? existing.id_alternative_factor,
        })
      : undefined;

    const updated = await this.prisma.reduction_action.update({
      where: { id },
      data: {
        ...body,
        estimated_reduction_kgco2e:
          body.estimated_reduction_kgco2e ?? computedReduction ?? undefined,
      },
      include: REDUCTION_ACTION_DETAIL_INCLUDE,
    });

    this.logger.log(
      `Reduction action ${id} updated by consultant ${consultant.id}`,
    );

    return updated;
  }

  async deleteAction(
    userId: string,
    id: string,
  ): Promise<ReductionActionWithDetails[]> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    const existing = await this.getOwnedAction(id, consultant.id);
    this.assessmentService.assertNotSent(existing.assessment);

    await this.prisma.reduction_action.delete({ where: { id } });

    this.logger.log(
      `Reduction action ${id} deleted by consultant ${consultant.id}`,
    );

    return this.listActions(userId, existing.id_assessment);
  }

  private async getOwnedAction(
    id: string,
    consultantId: string,
  ): Promise<ReductionActionWithOwner> {
    const found = await this.prisma.reduction_action.findUnique({
      where: { id },
      include: {
        assessment: { include: { worksite: { include: { client: true } } } },
      },
    });

    if (!found) {
      throw new NotFoundException('Reduction action not found');
    }

    if (found.assessment.worksite.client.id_consultant !== consultantId) {
      throw new ForbiddenException(
        'You do not have permission to access this reduction action',
      );
    }

    return found;
  }

  // Validates the targeted line / factor and, when both are set with compatible units, estimates the saving.
  private async resolveEstimatedReduction(
    target: ReductionTarget,
  ): Promise<Prisma.Decimal | null> {
    const line = target.activityLineId
      ? await this.prisma.activity_line.findUnique({
          where: { id: target.activityLineId },
        })
      : null;

    if (target.activityLineId && !line) {
      throw new NotFoundException('Activity line not found');
    }

    if (line && line.id_assessment !== target.assessmentId) {
      throw new BadRequestException(
        'The activity line must belong to the same assessment',
      );
    }

    const alternativeFactor = target.alternativeFactorId
      ? await this.emissionFactorService.getUsableFactor(
          target.alternativeFactorId,
          target.consultantId,
        )
      : null;

    if (!line || !alternativeFactor) {
      return null;
    }

    if (alternativeFactor.per_unit !== line.calc_unit) {
      throw new BadRequestException(
        `The alternative factor unit (${alternativeFactor.per_unit}) must match the activity line unit (${line.calc_unit})`,
      );
    }

    return computeReductionKgco2e(
      line.calc_quantity,
      line.fe_value_kgco2e,
      alternativeFactor.value_kgco2e,
    );
  }
}
