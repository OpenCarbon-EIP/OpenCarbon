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
  ApplicationStatus,
  MissionStatus,
  Prisma,
} from 'src/generated/prisma/client';
import type { mission } from 'src/generated/prisma/client';
import { ConsultantService } from 'src/consultant/consultant.service';
import { CompanyService } from 'src/company/company.service';
import { CreateMissionDto, UpdateMissionDto } from 'src/dtos/mission.dto';
import {
  MISSION_DETAIL_INCLUDE,
  MissionWithDetails,
} from 'src/types/mission.types';
import type { AuthenticatedUser } from 'src/types/user.types';

const COMPANY_ONLY_FIELDS: (keyof UpdateMissionDto)[] = [
  'start_date',
  'estimated_end_date',
  'end_date',
  'payment_status',
  'status',
];

const PRISMA_UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

@Injectable()
export class MissionService {
  private readonly logger = new Logger(MissionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly consultantService: ConsultantService,
    private readonly companyService: CompanyService,
  ) {}

  async createMission(
    userId: string,
    body: CreateMissionDto,
  ): Promise<MissionWithDetails> {
    const company = await this.companyService.getCompanyByUserIdOrThrow(userId);

    const application = await this.prisma.application.findUnique({
      where: { id: body.id_application },
      include: { offer: true, mission: { select: { id: true } } },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.offer.id_company !== company.id) {
      throw new ForbiddenException(
        'You can only create missions from applications to your own offers',
      );
    }

    if (application.status === ApplicationStatus.REJECTED) {
      throw new BadRequestException(
        'Cannot create a mission from a rejected application',
      );
    }

    if (application.mission) {
      throw new ConflictException(
        'A mission already exists for this application',
      );
    }

    this.assertDateRange(body.start_date, body.estimated_end_date);

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        await tx.application.update({
          where: { id: application.id },
          data: { status: ApplicationStatus.ACCEPTED },
        });

        return await tx.mission.create({
          data: {
            start_date: body.start_date,
            estimated_end_date: body.estimated_end_date,
            id_application: application.id,
            id_company: company.id,
            id_consultant: application.id_consultant,
          },
          include: MISSION_DETAIL_INCLUDE,
        });
      });

      this.logger.log(
        `Mission ${created.id} created from application ${application.id} by company ${company.id} for consultant ${application.id_consultant}`,
      );

      return created;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new ConflictException(
          'A mission already exists for this application',
        );
      }
      throw error;
    }
  }

  async listMissions(user: AuthenticatedUser): Promise<MissionWithDetails[]> {
    const where = await this.buildOwnerFilter(user);

    return await this.prisma.mission.findMany({
      where,
      include: MISSION_DETAIL_INCLUDE,
      orderBy: { start_date: 'desc' },
    });
  }

  async getMissionById(
    id: string,
    user: AuthenticatedUser,
  ): Promise<MissionWithDetails> {
    const found = await this.prisma.mission.findUnique({
      where: { id },
      include: MISSION_DETAIL_INCLUDE,
    });

    if (!found) {
      throw new NotFoundException('Mission not found');
    }

    await this.assertParticipant(found, user);

    return found;
  }

  async updateMission(
    user: AuthenticatedUser,
    id: string,
    body: UpdateMissionDto,
  ): Promise<MissionWithDetails> {
    const existing = await this.getMissionById(id, user);

    const touchesCompanyFields = COMPANY_ONLY_FIELDS.some(
      (field) => body[field] !== undefined,
    );

    if (user.role === 'CONSULTANT' && touchesCompanyFields) {
      throw new ForbiddenException(
        'Consultants can only update the mission progress',
      );
    }

    if (user.role === 'COMPANY' && body.progress !== undefined) {
      throw new ForbiddenException(
        'Only the consultant can update the mission progress',
      );
    }

    if (
      body.progress !== undefined &&
      existing.status !== MissionStatus.ONGOING
    ) {
      throw new ConflictException(
        `Cannot update the progress of a ${existing.status} mission`,
      );
    }

    this.assertDateRange(
      body.start_date ?? existing.start_date,
      body.estimated_end_date ?? existing.estimated_end_date,
    );

    const isCompleting =
      body.status === MissionStatus.COMPLETED &&
      existing.status !== MissionStatus.COMPLETED;

    const updated = await this.prisma.mission.update({
      where: { id },
      data: {
        ...body,
        ...(isCompleting && { end_date: body.end_date ?? new Date() }),
      },
      include: MISSION_DETAIL_INCLUDE,
    });

    this.logger.log(
      `Mission ${id} updated by ${user.role.toLowerCase()} user ${user.id} (fields: ${Object.keys(body).join(', ')})`,
    );

    return updated;
  }

  async deleteMission(
    user: AuthenticatedUser,
    id: string,
  ): Promise<MissionWithDetails[]> {
    const company = await this.companyService.getCompanyByUserIdOrThrow(
      user.id,
    );

    const existing = await this.prisma.mission.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Mission not found');
    }

    if (existing.id_company !== company.id) {
      throw new ForbiddenException(
        'You do not have permission to delete this mission',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.mission.delete({ where: { id } });

      if (existing.id_application) {
        await tx.application.update({
          where: { id: existing.id_application },
          data: { status: ApplicationStatus.PENDING },
        });
      }
    });

    this.logger.log(
      `Mission ${id} deleted by company ${company.id}; application ${existing.id_application ?? 'none'} set back to PENDING`,
    );

    return this.listMissions(user);
  }

  private async buildOwnerFilter(
    user: AuthenticatedUser,
  ): Promise<Prisma.missionWhereInput> {
    if (user.role === 'CONSULTANT') {
      const consultant =
        await this.consultantService.getConsultantByUserIdOrThrow(user.id);
      return { id_consultant: consultant.id };
    }

    const company = await this.companyService.getCompanyByUserIdOrThrow(
      user.id,
    );
    return { id_company: company.id };
  }

  private async assertParticipant(
    found: mission,
    user: AuthenticatedUser,
  ): Promise<void> {
    const filter = await this.buildOwnerFilter(user);

    const isParticipant =
      (filter.id_consultant !== undefined &&
        filter.id_consultant === found.id_consultant) ||
      (filter.id_company !== undefined &&
        filter.id_company === found.id_company);

    if (!isParticipant) {
      throw new ForbiddenException(
        'You do not have permission to access this mission',
      );
    }
  }

  private assertDateRange(startDate: Date, estimatedEndDate: Date): void {
    if (estimatedEndDate < startDate) {
      throw new BadRequestException(
        'estimated_end_date must be after start_date',
      );
    }
  }
}
