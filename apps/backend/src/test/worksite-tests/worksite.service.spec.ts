import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WorksiteService } from 'src/worksite/worksite.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConsultantService } from 'src/consultant/consultant.service';
import { ClientService } from 'src/client/client.service';
import { CreateWorksiteDto } from 'src/dtos/worksite.dto';
import {
  createMockClient,
  createMockConsultant,
  createMockMission,
  createMockWorksite,
  createMockWorksiteWithClient,
} from 'src/utils/mock-creator';
import { createPrismaMock, PrismaMock } from '../helpers/prisma-mock';

describe('WorksiteService', () => {
  let service: WorksiteService;
  let prisma: PrismaMock;
  const consultantService = { getConsultantByUserIdOrThrow: jest.fn() };
  const clientService = { getOwnedClient: jest.fn() };
  const createDto: CreateWorksiteDto = {
    id_client: 'client-123',
    name: 'Réfection RD 936',
    work_type: 'ROADWORKS',
    start_date: new Date('2026-03-01'),
    end_date: new Date('2026-09-30'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    consultantService.getConsultantByUserIdOrThrow.mockResolvedValue(
      createMockConsultant(),
    );
    clientService.getOwnedClient.mockResolvedValue(createMockClient());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorksiteService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConsultantService, useValue: consultantService },
        { provide: ClientService, useValue: clientService },
      ],
    }).compile();

    service = module.get<WorksiteService>(WorksiteService);
  });

  describe('createWorksite', () => {
    it('should create a worksite on an owned client', async () => {
      const mockWorksite = createMockWorksite();
      prisma.worksite.create.mockResolvedValue(mockWorksite);

      const result = await service.createWorksite('user-123', createDto);

      expect(clientService.getOwnedClient).toHaveBeenCalledWith(
        'client-123',
        'consul-123',
      );
      expect(prisma.worksite.create).toHaveBeenCalledWith({ data: createDto });
      expect(result).toEqual(mockWorksite);
    });

    it('should propagate the client ownership error', async () => {
      clientService.getOwnedClient.mockRejectedValueOnce(
        new ForbiddenException(),
      );

      await expect(
        service.createWorksite('user-123', createDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject an end date before the start date', async () => {
      await expect(
        service.createWorksite('user-123', {
          ...createDto,
          end_date: new Date('2026-01-01'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject a mission that does not exist', async () => {
      prisma.mission.findUnique.mockResolvedValue(null);

      await expect(
        service.createWorksite('user-123', {
          ...createDto,
          id_mission: 'mission-123',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject a mission of another consultant', async () => {
      prisma.mission.findUnique.mockResolvedValue(
        createMockMission({ id_consultant: 'other-consultant' }),
      );

      await expect(
        service.createWorksite('user-123', {
          ...createDto,
          id_mission: 'mission-123',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listWorksites', () => {
    it('should scope the list to the consultant and apply filters', async () => {
      prisma.worksite.findMany.mockResolvedValue([createMockWorksite()]);

      await service.listWorksites('user-123', { id_client: 'client-123' });

      expect(prisma.worksite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            client: { id_consultant: 'consul-123' },
            id_client: 'client-123',
          },
        }),
      );
    });
  });

  describe('getWorksiteById', () => {
    it('should return an owned worksite', async () => {
      const mockWorksite = createMockWorksiteWithClient();
      prisma.worksite.findUnique.mockResolvedValue(mockWorksite);

      await expect(
        service.getWorksiteById('worksite-123', 'user-123'),
      ).resolves.toEqual(mockWorksite);
    });

    it('should throw NotFoundException when the worksite does not exist', async () => {
      prisma.worksite.findUnique.mockResolvedValue(null);

      await expect(
        service.getWorksiteById('worksite-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for a worksite of another consultant', async () => {
      prisma.worksite.findUnique.mockResolvedValue(
        createMockWorksiteWithClient({}, { id_consultant: 'other-consultant' }),
      );

      await expect(
        service.getWorksiteById('worksite-123', 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateWorksite', () => {
    it('should update an owned worksite', async () => {
      prisma.worksite.findUnique.mockResolvedValue(
        createMockWorksiteWithClient(),
      );
      prisma.worksite.update.mockResolvedValue(
        createMockWorksite({ name: 'Tranche 3' }),
      );

      const result = await service.updateWorksite('user-123', 'worksite-123', {
        name: 'Tranche 3',
      });

      expect(result.name).toBe('Tranche 3');
    });

    it('should check the new end date against the existing start date', async () => {
      prisma.worksite.findUnique.mockResolvedValue(
        createMockWorksiteWithClient({ start_date: new Date('2026-03-01') }),
      );

      await expect(
        service.updateWorksite('user-123', 'worksite-123', {
          end_date: new Date('2026-02-01'),
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.worksite.update).not.toHaveBeenCalled();
    });

    it('should let a null end_date clear the existing one', async () => {
      prisma.worksite.findUnique.mockResolvedValue(
        createMockWorksiteWithClient({ end_date: new Date('2026-09-30') }),
      );
      prisma.worksite.update.mockResolvedValue(
        createMockWorksite({ end_date: null }),
      );

      await service.updateWorksite('user-123', 'worksite-123', {
        start_date: new Date('2026-10-15'),
        end_date: null,
      });

      expect(prisma.worksite.update).toHaveBeenCalledWith({
        where: { id: 'worksite-123' },
        data: { start_date: new Date('2026-10-15'), end_date: null },
      });
    });
  });

  describe('deleteWorksite', () => {
    it('should delete a worksite with only draft assessments', async () => {
      prisma.worksite.findUnique.mockResolvedValue(
        createMockWorksiteWithClient(),
      );
      prisma.assessment.count.mockResolvedValue(0);
      prisma.worksite.findMany.mockResolvedValue([]);

      const result = await service.deleteWorksite('user-123', 'worksite-123');

      expect(prisma.worksite.delete).toHaveBeenCalledWith({
        where: { id: 'worksite-123' },
      });
      expect(result).toEqual([]);
    });

    it('should refuse to delete a worksite with validated or sent assessments', async () => {
      prisma.worksite.findUnique.mockResolvedValue(
        createMockWorksiteWithClient(),
      );
      prisma.assessment.count.mockResolvedValue(1);

      await expect(
        service.deleteWorksite('user-123', 'worksite-123'),
      ).rejects.toThrow(ConflictException);
      expect(prisma.worksite.delete).not.toHaveBeenCalled();
    });
  });
});
