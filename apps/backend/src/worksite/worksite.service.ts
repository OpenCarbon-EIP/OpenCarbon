import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AssessmentStatus } from 'src/generated/prisma/client';
import type { worksite } from 'src/generated/prisma/client';
import { ConsultantService } from 'src/consultant/consultant.service';
import { ClientService } from 'src/client/client.service';
import {
  CreateWorksiteDto,
  ListWorksitesQueryDto,
  UpdateWorksiteDto,
} from 'src/dtos/worksite.dto';
import {
  WORKSITE_DETAIL_INCLUDE,
  WorksiteWithClient,
  WorksiteWithDetails,
} from 'src/types/carbon.types';

@Injectable()
export class WorksiteService {
  private readonly logger = new Logger(WorksiteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly consultantService: ConsultantService,
    private readonly clientService: ClientService,
  ) {}

  async createWorksite(
    userId: string,
    body: CreateWorksiteDto,
  ): Promise<worksite> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    await this.clientService.getOwnedClient(body.id_client, consultant.id);

    if (body.id_mission) {
      await this.assertMissionBelongsToConsultant(
        body.id_mission,
        consultant.id,
      );
    }

    this.assertDateRange(body.start_date, body.end_date);

    const created = await this.prisma.worksite.create({ data: body });

    this.logger.log(
      `Worksite ${created.id} ("${created.name}") created for client ${body.id_client} by consultant ${consultant.id}`,
    );

    return created;
  }

  async listWorksites(
    userId: string,
    query: ListWorksitesQueryDto,
  ): Promise<worksite[]> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);

    return await this.prisma.worksite.findMany({
      where: {
        client: { id_consultant: consultant.id },
        ...(query.id_client && { id_client: query.id_client }),
        ...(query.id_mission && { id_mission: query.id_mission }),
      },
      orderBy: { start_date: 'desc' },
    });
  }

  async getWorksiteById(
    id: string,
    userId: string,
  ): Promise<WorksiteWithDetails> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);

    const found = await this.prisma.worksite.findUnique({
      where: { id },
      include: WORKSITE_DETAIL_INCLUDE,
    });

    if (!found) {
      throw new NotFoundException('Worksite not found');
    }

    this.assertOwnership(found, consultant.id);

    return found;
  }

  async getOwnedWorksite(
    id: string,
    consultantId: string,
  ): Promise<WorksiteWithClient> {
    const found = await this.prisma.worksite.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!found) {
      throw new NotFoundException('Worksite not found');
    }

    this.assertOwnership(found, consultantId);

    return found;
  }

  async updateWorksite(
    userId: string,
    id: string,
    body: UpdateWorksiteDto,
  ): Promise<worksite> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    const existing = await this.getOwnedWorksite(id, consultant.id);

    if (body.id_mission) {
      await this.assertMissionBelongsToConsultant(
        body.id_mission,
        consultant.id,
      );
    }

    this.assertDateRange(
      body.start_date ?? existing.start_date,
      body.end_date ?? existing.end_date,
    );

    const updated = await this.prisma.worksite.update({
      where: { id },
      data: body,
    });

    this.logger.log(`Worksite ${id} updated by consultant ${consultant.id}`);

    return updated;
  }

  async deleteWorksite(userId: string, id: string): Promise<worksite[]> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    const existing = await this.getOwnedWorksite(id, consultant.id);

    const lockedAssessments = await this.prisma.assessment.count({
      where: { id_worksite: id, status: { not: AssessmentStatus.DRAFT } },
    });

    if (lockedAssessments > 0) {
      throw new ConflictException(
        'This worksite has validated or sent assessments and cannot be deleted',
      );
    }

    await this.prisma.worksite.delete({ where: { id } });

    this.logger.log(
      `Worksite ${id} deleted (with its documents and draft assessments) by consultant ${consultant.id}`,
    );

    return this.listWorksites(userId, { id_client: existing.id_client });
  }

  private assertOwnership(
    found: WorksiteWithClient,
    consultantId: string,
  ): void {
    if (found.client.id_consultant !== consultantId) {
      throw new ForbiddenException(
        'You do not have permission to access this worksite',
      );
    }
  }

  private assertDateRange(startDate: Date, endDate?: Date | null): void {
    if (endDate && endDate < startDate) {
      throw new BadRequestException('end_date must be after start_date');
    }
  }

  private async assertMissionBelongsToConsultant(
    missionId: string,
    consultantId: string,
  ): Promise<void> {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      select: { id_consultant: true },
    });

    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    if (mission.id_consultant !== consultantId) {
      throw new ForbiddenException(
        'You can only link a worksite to one of your missions',
      );
    }
  }
}
