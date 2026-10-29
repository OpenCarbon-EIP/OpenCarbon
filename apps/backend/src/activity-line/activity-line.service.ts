import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExtractionStatus, Prisma } from 'src/generated/prisma/client';
import type {
  activity_line,
  DataOrigin,
  emission_factor,
  Unit,
} from 'src/generated/prisma/client';
import { ConsultantService } from 'src/consultant/consultant.service';
import { AssessmentService } from 'src/assessment/assessment.service';
import { EmissionFactorService } from 'src/emission-factor/emission-factor.service';
import { EmissionCategoryService } from 'src/emission-category/emission-category.service';
import {
  CreateActivityLineDto,
  UpdateActivityLineDto,
} from 'src/dtos/activity-line.dto';
import {
  ACTIVITY_LINE_DETAIL_INCLUDE,
  ActivityLineWithDetails,
} from 'src/types/carbon.types';
import {
  computeAssessmentTotals,
  computeLine,
  DEFAULT_DATA_UNCERTAINTY_PCT,
} from 'src/utils/carbon-calculation';

export type ActivityLineInput = Omit<
  CreateActivityLineDto,
  'id_assessment' | 'input_quantity'
> & { input_quantity: Prisma.Decimal | number };

export type PreparedActivityLine = Omit<
  Prisma.activity_lineUncheckedCreateInput,
  'id_assessment'
>;

interface FactorSnapshot {
  id: string;
  valueKgco2e: Prisma.Decimal;
  label: string;
  uncertaintyPct: Prisma.Decimal | null;
  databaseVersion: string | null;
  perUnit: Unit;
}

interface ComputationInput {
  inputQuantity: Prisma.Decimal | number;
  inputUnit: Unit;
  conversionFactor?: Prisma.Decimal | number | null;
  dataOrigin: DataOrigin;
  dataUncertaintyPct?: Prisma.Decimal | number | null;
}

type ActivityLineWithOwner = Prisma.activity_lineGetPayload<{
  include: {
    assessment: { include: { worksite: { include: { client: true } } } };
  };
}>;

const CALCULATION_FIELDS: (keyof UpdateActivityLineDto)[] = [
  'input_quantity',
  'input_unit',
  'conversion_factor',
  'id_emission_factor',
  'data_origin',
  'data_uncertainty_pct',
];

@Injectable()
export class ActivityLineService {
  private readonly logger = new Logger(ActivityLineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly consultantService: ConsultantService,
    private readonly assessmentService: AssessmentService,
    private readonly emissionFactorService: EmissionFactorService,
    private readonly emissionCategoryService: EmissionCategoryService,
  ) {}

  async prepareLine(
    consultantId: string,
    input: ActivityLineInput,
  ): Promise<PreparedActivityLine> {
    const factor = await this.emissionFactorService.getUsableFactor(
      input.id_emission_factor,
      consultantId,
    );

    const categoryId = input.id_category ?? factor.id_default_category;
    if (!categoryId) {
      throw new BadRequestException(
        'id_category is required: this emission factor has no default category',
      );
    }
    await this.emissionCategoryService.getCategoryById(categoryId);

    return {
      label: input.label,
      conversion_note: input.conversion_note,
      comment: input.comment,
      id_category: categoryId,
      ...this.computeFields(
        {
          inputQuantity: input.input_quantity,
          inputUnit: input.input_unit,
          conversionFactor: input.conversion_factor,
          dataOrigin: input.data_origin,
          dataUncertaintyPct: input.data_uncertainty_pct,
        },
        this.snapshotFactor(factor),
      ),
    };
  }

  async createLine(
    userId: string,
    body: CreateActivityLineDto,
  ): Promise<ActivityLineWithDetails> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    const assessment = await this.assessmentService.getOwnedAssessment(
      body.id_assessment,
      consultant.id,
    );
    this.assessmentService.assertDraft(assessment);

    const { id_assessment, ...input } = body;
    const prepared = await this.prepareLine(consultant.id, input);

    const created = await this.prisma.$transaction(async (tx) => {
      const line = await tx.activity_line.create({
        data: { ...prepared, id_assessment },
        include: ACTIVITY_LINE_DETAIL_INCLUDE,
      });
      await this.recomputeTotals(tx, id_assessment);
      return line;
    });

    this.logger.log(
      `Activity line ${created.id} (${created.result_kgco2e.toString()} kgCO2e) added to assessment ${id_assessment} by consultant ${consultant.id}`,
    );

    return created;
  }

  async listLines(
    userId: string,
    assessmentId: string,
  ): Promise<ActivityLineWithDetails[]> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    await this.assessmentService.getOwnedAssessment(
      assessmentId,
      consultant.id,
    );

    return await this.prisma.activity_line.findMany({
      where: { id_assessment: assessmentId },
      include: ACTIVITY_LINE_DETAIL_INCLUDE,
      orderBy: { created_at: 'asc' },
    });
  }

  async getLineById(
    id: string,
    userId: string,
  ): Promise<ActivityLineWithDetails> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    await this.getOwnedLine(id, consultant.id);

    return await this.prisma.activity_line.findUniqueOrThrow({
      where: { id },
      include: ACTIVITY_LINE_DETAIL_INCLUDE,
    });
  }

  async getOwnedLine(
    id: string,
    consultantId: string,
  ): Promise<ActivityLineWithOwner> {
    const found = await this.prisma.activity_line.findUnique({
      where: { id },
      include: {
        assessment: { include: { worksite: { include: { client: true } } } },
      },
    });

    if (!found) {
      throw new NotFoundException('Activity line not found');
    }

    if (found.assessment.worksite.client.id_consultant !== consultantId) {
      throw new ForbiddenException(
        'You do not have permission to access this activity line',
      );
    }

    return found;
  }

  async updateLine(
    userId: string,
    id: string,
    body: UpdateActivityLineDto,
  ): Promise<ActivityLineWithDetails> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    const existing = await this.getOwnedLine(id, consultant.id);
    this.assessmentService.assertDraft(existing.assessment);

    const recalculates = CALCULATION_FIELDS.some(
      (field) => body[field] !== undefined,
    );

    let recalculatedFields: Partial<PreparedActivityLine> = {};
    let conversionDropped = false;
    if (recalculates) {
      // Keep the factor values copied at creation unless a new factor is chosen.
      const snapshot = body.id_emission_factor
        ? this.snapshotFactor(
            await this.emissionFactorService.getUsableFactor(
              body.id_emission_factor,
              consultant.id,
            ),
          )
        : this.snapshotFromLine(existing);

      const dataOrigin = body.data_origin ?? existing.data_origin;
      const dataUncertaintyPct =
        body.data_uncertainty_pct ??
        (body.data_origin ? undefined : existing.data_uncertainty_pct);

      // A conversion is only valid for the unit pair it was entered for: drop it when that pair changes,
      // so that computeFields requires a new one instead of silently reusing a wrong factor.
      const inputUnit = body.input_unit ?? existing.input_unit;
      const unitPairChanged =
        inputUnit !== existing.input_unit ||
        snapshot.perUnit !== existing.calc_unit;
      conversionDropped =
        body.conversion_factor === undefined &&
        unitPairChanged &&
        existing.conversion_factor !== null;

      recalculatedFields = this.computeFields(
        {
          inputQuantity: body.input_quantity ?? existing.input_quantity,
          inputUnit,
          conversionFactor:
            body.conversion_factor ??
            (unitPairChanged ? null : existing.conversion_factor),
          dataOrigin,
          dataUncertaintyPct,
        },
        snapshot,
      );
    }

    if (body.id_category) {
      await this.emissionCategoryService.getCategoryById(body.id_category);
    }

    // A recalculated line must be reviewed again unless explicitly validated in the same request.
    const isValidated =
      body.is_validated ?? (recalculates ? false : existing.is_validated);
    const validationChanged = isValidated !== existing.is_validated;

    const updated = await this.prisma.$transaction(async (tx) => {
      const line = await tx.activity_line.update({
        where: { id },
        data: {
          label: body.label,
          conversion_note:
            body.conversion_note ?? (conversionDropped ? null : undefined),
          comment: body.comment,
          id_category: body.id_category,
          ...recalculatedFields,
          is_validated: isValidated,
          ...(validationChanged && {
            validated_at: isValidated ? new Date() : null,
          }),
        },
        include: ACTIVITY_LINE_DETAIL_INCLUDE,
      });

      if (recalculates) {
        await this.recomputeTotals(tx, line.id_assessment);
      }

      return line;
    });

    this.logger.log(
      `Activity line ${id} updated by consultant ${consultant.id}${recalculates ? ' (recalculated)' : ''}`,
    );

    return updated;
  }

  async deleteLine(
    userId: string,
    id: string,
  ): Promise<ActivityLineWithDetails[]> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    const existing = await this.getOwnedLine(id, consultant.id);
    this.assessmentService.assertDraft(existing.assessment);

    await this.prisma.$transaction(async (tx) => {
      await tx.activity_line.delete({ where: { id } });

      if (existing.id_extraction) {
        await tx.extraction.update({
          where: { id: existing.id_extraction },
          data: {
            status: ExtractionStatus.PROPOSED,
            reviewed_at: null,
            correction: Prisma.DbNull,
          },
        });
      }

      await this.recomputeTotals(tx, existing.id_assessment);
    });

    this.logger.log(
      `Activity line ${id} deleted from assessment ${existing.id_assessment} by consultant ${consultant.id}`,
    );

    return this.listLines(userId, existing.id_assessment);
  }

  // Cached assessment totals, refreshed in the same transaction as every line change.
  async recomputeTotals(
    tx: Prisma.TransactionClient,
    assessmentId: string,
  ): Promise<void> {
    const lines = await tx.activity_line.findMany({
      where: { id_assessment: assessmentId },
      select: { result_kgco2e: true, line_uncertainty_pct: true },
    });

    const { totalKgco2e, totalUncertaintyPct } = computeAssessmentTotals(lines);

    await tx.assessment.update({
      where: { id: assessmentId },
      data: {
        total_kgco2e: totalKgco2e,
        total_uncertainty_pct: totalUncertaintyPct,
        computed_at: new Date(),
      },
    });
  }

  private computeFields(
    input: ComputationInput,
    factor: FactorSnapshot,
  ): Pick<
    PreparedActivityLine,
    | 'input_quantity'
    | 'input_unit'
    | 'conversion_factor'
    | 'calc_quantity'
    | 'calc_unit'
    | 'fe_value_kgco2e'
    | 'fe_label'
    | 'fe_uncertainty_pct'
    | 'fe_database_version'
    | 'data_uncertainty_pct'
    | 'data_origin'
    | 'result_kgco2e'
    | 'line_uncertainty_pct'
    | 'id_emission_factor'
  > {
    const conversionFactor = input.conversionFactor ?? null;

    if (input.inputUnit !== factor.perUnit && conversionFactor === null) {
      throw new BadRequestException(
        `input_unit ${input.inputUnit} differs from the emission factor unit ${factor.perUnit}: a conversion_factor is required`,
      );
    }

    const dataUncertaintyPct =
      input.dataUncertaintyPct ??
      DEFAULT_DATA_UNCERTAINTY_PCT[input.dataOrigin];

    const { calcQuantity, resultKgco2e, lineUncertaintyPct } = computeLine({
      inputQuantity: input.inputQuantity,
      conversionFactor,
      feValueKgco2e: factor.valueKgco2e,
      feUncertaintyPct: factor.uncertaintyPct,
      dataUncertaintyPct,
    });

    return {
      input_quantity: input.inputQuantity,
      input_unit: input.inputUnit,
      conversion_factor: conversionFactor,
      calc_quantity: calcQuantity,
      calc_unit: factor.perUnit,
      fe_value_kgco2e: factor.valueKgco2e,
      fe_label: factor.label,
      fe_uncertainty_pct: factor.uncertaintyPct,
      fe_database_version: factor.databaseVersion,
      data_uncertainty_pct: dataUncertaintyPct,
      data_origin: input.dataOrigin,
      result_kgco2e: resultKgco2e,
      line_uncertainty_pct: lineUncertaintyPct,
      id_emission_factor: factor.id,
    };
  }

  private snapshotFactor(factor: emission_factor): FactorSnapshot {
    return {
      id: factor.id,
      valueKgco2e: factor.value_kgco2e,
      label: factor.attribute
        ? `${factor.name} - ${factor.attribute}`
        : factor.name,
      uncertaintyPct: factor.uncertainty_pct,
      databaseVersion: factor.database_version,
      perUnit: factor.per_unit,
    };
  }

  private snapshotFromLine(line: activity_line): FactorSnapshot {
    return {
      id: line.id_emission_factor,
      valueKgco2e: line.fe_value_kgco2e,
      label: line.fe_label,
      uncertaintyPct: line.fe_uncertainty_pct,
      databaseVersion: line.fe_database_version,
      perUnit: line.calc_unit,
    };
  }
}
