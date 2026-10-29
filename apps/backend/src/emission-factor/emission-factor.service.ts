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
  EmissionFactorSource,
  EmissionFactorStatus,
} from 'src/generated/prisma/client';
import type { emission_factor } from 'src/generated/prisma/client';
import { ConsultantService } from 'src/consultant/consultant.service';
import { EmissionCategoryService } from 'src/emission-category/emission-category.service';
import {
  CreateEmissionFactorDto,
  ListEmissionFactorsQueryDto,
  UpdateEmissionFactorDto,
} from 'src/dtos/emission-factor.dto';
import {
  EMISSION_FACTOR_DETAIL_INCLUDE,
  EmissionFactorWithCategory,
} from 'src/types/carbon.types';

const DEFAULT_PAGE_SIZE = 50;

@Injectable()
export class EmissionFactorService {
  private readonly logger = new Logger(EmissionFactorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly consultantService: ConsultantService,
    private readonly emissionCategoryService: EmissionCategoryService,
  ) {}

  async listFactors(
    userId: string,
    query: ListEmissionFactorsQueryDto,
  ): Promise<EmissionFactorWithCategory[]> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);

    return await this.prisma.emission_factor.findMany({
      where: {
        OR: [{ id_consultant: null }, { id_consultant: consultant.id }],
        status: { not: EmissionFactorStatus.ARCHIVED },
        ...(query.search && {
          name: { contains: query.search, mode: 'insensitive' },
        }),
        ...(query.id_category && { id_default_category: query.id_category }),
        ...(query.per_unit && { per_unit: query.per_unit }),
        ...(query.source && { source: query.source }),
      },
      include: EMISSION_FACTOR_DETAIL_INCLUDE,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: query.take ?? DEFAULT_PAGE_SIZE,
      skip: query.skip ?? 0,
    });
  }

  async getFactorById(
    id: string,
    userId: string,
  ): Promise<EmissionFactorWithCategory> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);

    const factor = await this.prisma.emission_factor.findUnique({
      where: { id },
      include: EMISSION_FACTOR_DETAIL_INCLUDE,
    });

    if (!factor) {
      throw new NotFoundException('Emission factor not found');
    }

    if (factor.id_consultant && factor.id_consultant !== consultant.id) {
      throw new ForbiddenException(
        'You do not have permission to access this emission factor',
      );
    }

    return factor;
  }

  async getUsableFactor(
    id: string,
    consultantId: string,
  ): Promise<emission_factor> {
    const factor = await this.prisma.emission_factor.findUnique({
      where: { id },
    });

    if (!factor) {
      throw new NotFoundException('Emission factor not found');
    }

    if (factor.id_consultant && factor.id_consultant !== consultantId) {
      throw new ForbiddenException(
        'You do not have permission to use this emission factor',
      );
    }

    if (factor.status === EmissionFactorStatus.ARCHIVED) {
      throw new BadRequestException(
        'This emission factor is archived and cannot be used anymore',
      );
    }

    return factor;
  }

  async createFactor(
    userId: string,
    body: CreateEmissionFactorDto,
  ): Promise<EmissionFactorWithCategory> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);

    if (body.id_default_category) {
      await this.emissionCategoryService.getCategoryById(
        body.id_default_category,
      );
    }

    const factor = await this.prisma.emission_factor.create({
      data: {
        ...body,
        status: EmissionFactorStatus.VALID_SPECIFIC,
        id_consultant: consultant.id,
      },
      include: EMISSION_FACTOR_DETAIL_INCLUDE,
    });

    this.logger.log(
      `Custom emission factor ${factor.id} ("${factor.name}") created by consultant ${consultant.id}`,
    );

    return factor;
  }

  async updateFactor(
    userId: string,
    id: string,
    body: UpdateEmissionFactorDto,
  ): Promise<EmissionFactorWithCategory> {
    const factor = await this.getOwnedCustomFactor(id, userId);

    const nextSource = body.source ?? factor.source;
    const nextReference = body.source_reference ?? factor.source_reference;
    if (nextSource === EmissionFactorSource.CUSTOM && !nextReference) {
      throw new BadRequestException(
        'source_reference is required for a CUSTOM emission factor',
      );
    }

    if (body.id_default_category) {
      await this.emissionCategoryService.getCategoryById(
        body.id_default_category,
      );
    }

    const updated = await this.prisma.emission_factor.update({
      where: { id },
      data: body,
      include: EMISSION_FACTOR_DETAIL_INCLUDE,
    });

    this.logger.log(
      `Custom emission factor ${id} updated by user ${userId} (fields: ${Object.keys(body).join(', ')})`,
    );

    return updated;
  }

  async deleteFactor(userId: string, id: string): Promise<emission_factor> {
    await this.getOwnedCustomFactor(id, userId);

    const usage = await this.prisma.emission_factor.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            activity_lines: true,
            proposed_in: true,
            alternative_in: true,
          },
        },
      },
    });

    const usageCount = usage
      ? usage._count.activity_lines +
        usage._count.proposed_in +
        usage._count.alternative_in
      : 0;

    if (usageCount > 0) {
      throw new ConflictException(
        'This emission factor is used by existing data. Archive it instead (status ARCHIVED)',
      );
    }

    const deleted = await this.prisma.emission_factor.delete({ where: { id } });

    this.logger.log(`Custom emission factor ${id} deleted by user ${userId}`);

    return deleted;
  }

  private async getOwnedCustomFactor(
    id: string,
    userId: string,
  ): Promise<emission_factor> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);

    const factor = await this.prisma.emission_factor.findUnique({
      where: { id },
    });

    if (!factor) {
      throw new NotFoundException('Emission factor not found');
    }

    if (!factor.id_consultant) {
      throw new ForbiddenException('Reference emission factors are read-only');
    }

    if (factor.id_consultant !== consultant.id) {
      throw new ForbiddenException(
        'You do not have permission to modify this emission factor',
      );
    }

    return factor;
  }
}
