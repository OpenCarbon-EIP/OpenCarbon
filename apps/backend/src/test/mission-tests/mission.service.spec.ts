import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MissionService } from 'src/mission/mission.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConsultantService } from 'src/consultant/consultant.service';
import { CompanyService } from 'src/company/company.service';
import { Prisma } from 'src/generated/prisma/client';
import type { application } from 'src/generated/prisma/client';
import { CreateMissionDto } from 'src/dtos/mission.dto';
import {
  createMockApplication,
  createMockCompany,
  createMockConsultant,
  createMockMission,
  createMockOffer,
  createMockUserCompany,
  createMockUserConsultant,
} from 'src/utils/mock-creator';
import { createPrismaMock, PrismaMock } from '../helpers/prisma-mock';

const createMockApplicationWithOffer = (
  overrides?: Partial<application>,
  offerCompanyId = 'company-uuid',
  existingMissionId: string | null = null,
) => ({
  ...createMockApplication(overrides),
  offer: createMockOffer({ id_company: offerCompanyId }),
  mission: existingMissionId ? { id: existingMissionId } : null,
});

describe('MissionService', () => {
  let service: MissionService;
  let prisma: PrismaMock;
  const consultantService = { getConsultantByUserIdOrThrow: jest.fn() };
  const companyService = { getCompanyByUserIdOrThrow: jest.fn() };
  const companyUser = createMockUserCompany();
  const consultantUser = createMockUserConsultant();
  const createDto: CreateMissionDto = {
    id_application: 'application-123',
    start_date: new Date('2026-11-01'),
    estimated_end_date: new Date('2027-02-28'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    consultantService.getConsultantByUserIdOrThrow.mockResolvedValue(
      createMockConsultant(),
    );
    companyService.getCompanyByUserIdOrThrow.mockResolvedValue(
      createMockCompany(),
    );
    prisma.mission.update.mockResolvedValue(createMockMission());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MissionService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConsultantService, useValue: consultantService },
        { provide: CompanyService, useValue: companyService },
      ],
    }).compile();

    service = module.get<MissionService>(MissionService);
  });

  describe('createMission', () => {
    it('should accept the application and create the mission in a transaction', async () => {
      prisma.application.findUnique.mockResolvedValue(
        createMockApplicationWithOffer(),
      );
      prisma.mission.create.mockResolvedValue(createMockMission());

      const result = await service.createMission('user-123', createDto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.application.update).toHaveBeenCalledWith({
        where: { id: 'application-123' },
        data: { status: 'ACCEPTED' },
      });
      expect(prisma.mission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            start_date: createDto.start_date,
            estimated_end_date: createDto.estimated_end_date,
            id_application: 'application-123',
            id_company: 'company-uuid',
            id_consultant: 'consul-123',
          },
        }),
      );
      expect(result).toEqual(createMockMission());
    });

    it('should throw NotFoundException when the application does not exist', async () => {
      prisma.application.findUnique.mockResolvedValue(null);

      await expect(
        service.createMission('user-123', createDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should refuse an application to the offer of another company', async () => {
      prisma.application.findUnique.mockResolvedValue(
        createMockApplicationWithOffer({}, 'other-company'),
      );

      await expect(
        service.createMission('user-123', createDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should refuse a rejected application', async () => {
      prisma.application.findUnique.mockResolvedValue(
        createMockApplicationWithOffer({ status: 'REJECTED' }),
      );

      await expect(
        service.createMission('user-123', createDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should refuse an application that already has a mission', async () => {
      prisma.application.findUnique.mockResolvedValue(
        createMockApplicationWithOffer({}, 'company-uuid', 'mission-123'),
      );

      await expect(
        service.createMission('user-123', createDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should refuse an estimated end date before the start date', async () => {
      prisma.application.findUnique.mockResolvedValue(
        createMockApplicationWithOffer(),
      );

      await expect(
        service.createMission('user-123', {
          ...createDto,
          estimated_end_date: new Date('2026-01-01'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should map a concurrent creation to a ConflictException', async () => {
      prisma.application.findUnique.mockResolvedValue(
        createMockApplicationWithOffer(),
      );
      prisma.mission.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '7.9.0',
        }),
      );

      await expect(
        service.createMission('user-123', createDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('listMissions', () => {
    it('should list the missions of a consultant', async () => {
      prisma.mission.findMany.mockResolvedValue([]);

      await service.listMissions(consultantUser);

      expect(prisma.mission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id_consultant: 'consul-123' } }),
      );
    });

    it('should list the missions of a company', async () => {
      prisma.mission.findMany.mockResolvedValue([]);

      await service.listMissions(companyUser);

      expect(prisma.mission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id_company: 'company-uuid' } }),
      );
    });
  });

  describe('getMissionById', () => {
    it.each([
      ['consultant', consultantUser],
      ['company', companyUser],
    ])('should return the mission to its %s', async (_role, user) => {
      prisma.mission.findUnique.mockResolvedValue(createMockMission());

      await expect(
        service.getMissionById('mission-123', user),
      ).resolves.toEqual(createMockMission());
    });

    it('should throw NotFoundException when the mission does not exist', async () => {
      prisma.mission.findUnique.mockResolvedValue(null);

      await expect(
        service.getMissionById('mission-123', consultantUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should refuse a user who is not a participant', async () => {
      prisma.mission.findUnique.mockResolvedValue(
        createMockMission({ id_consultant: 'other-consultant' }),
      );

      await expect(
        service.getMissionById('mission-123', consultantUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateMission', () => {
    beforeEach(() => {
      prisma.mission.findUnique.mockResolvedValue(createMockMission());
    });

    it('should let the consultant update the progress', async () => {
      await service.updateMission(consultantUser, 'mission-123', {
        progress: 40,
      });

      expect(prisma.mission.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { progress: 40 } }),
      );
    });

    it('should refuse company fields from the consultant', async () => {
      await expect(
        service.updateMission(consultantUser, 'mission-123', {
          payment_status: 'PAID',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should refuse a progress update from the company', async () => {
      await expect(
        service.updateMission(companyUser, 'mission-123', { progress: 40 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should refuse a progress update on a finished mission', async () => {
      prisma.mission.findUnique.mockResolvedValue(
        createMockMission({ status: 'COMPLETED' }),
      );

      await expect(
        service.updateMission(consultantUser, 'mission-123', { progress: 90 }),
      ).rejects.toThrow(ConflictException);
    });

    it('should set the end date when the company completes the mission', async () => {
      await service.updateMission(companyUser, 'mission-123', {
        status: 'COMPLETED',
      });

      expect(prisma.mission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'COMPLETED', end_date: expect.any(Date) },
        }),
      );
    });

    it('should refuse an estimated end date before the start date', async () => {
      await expect(
        service.updateMission(companyUser, 'mission-123', {
          estimated_end_date: new Date('2026-01-01'),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteMission', () => {
    it('should delete the mission and set the application back to PENDING', async () => {
      prisma.mission.findUnique.mockResolvedValue(createMockMission());
      prisma.mission.findMany.mockResolvedValue([]);

      const result = await service.deleteMission(companyUser, 'mission-123');

      expect(prisma.mission.delete).toHaveBeenCalledWith({
        where: { id: 'mission-123' },
      });
      expect(prisma.application.update).toHaveBeenCalledWith({
        where: { id: 'application-123' },
        data: { status: 'PENDING' },
      });
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when the mission does not exist', async () => {
      prisma.mission.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteMission(companyUser, 'mission-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should refuse to delete the mission of another company', async () => {
      prisma.mission.findUnique.mockResolvedValue(
        createMockMission({ id_company: 'other-company' }),
      );

      await expect(
        service.deleteMission(companyUser, 'mission-123'),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.mission.delete).not.toHaveBeenCalled();
    });
  });
});
