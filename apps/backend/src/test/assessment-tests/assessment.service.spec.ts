import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AssessmentService } from 'src/assessment/assessment.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConsultantService } from 'src/consultant/consultant.service';
import { WorksiteService } from 'src/worksite/worksite.service';
import {
  createMockAssessment,
  createMockAssessmentWithOwner,
  createMockConsultant,
  createMockWorksiteWithClient,
} from 'src/utils/mock-creator';
import { createPrismaMock, PrismaMock } from '../helpers/prisma-mock';

describe('AssessmentService', () => {
  let service: AssessmentService;
  let prisma: PrismaMock;
  const consultantService = { getConsultantByUserIdOrThrow: jest.fn() };
  const worksiteService = { getOwnedWorksite: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    consultantService.getConsultantByUserIdOrThrow.mockResolvedValue(
      createMockConsultant(),
    );
    worksiteService.getOwnedWorksite.mockResolvedValue(
      createMockWorksiteWithClient(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConsultantService, useValue: consultantService },
        { provide: WorksiteService, useValue: worksiteService },
      ],
    }).compile();

    service = module.get<AssessmentService>(AssessmentService);
  });

  const mockOwnedAssessment = (
    overrides?: Parameters<typeof createMockAssessmentWithOwner>[0],
  ): void => {
    prisma.assessment.findUnique.mockResolvedValue(
      createMockAssessmentWithOwner(overrides),
    );
  };

  describe('createAssessment', () => {
    it('should create an assessment with an initialized total', async () => {
      const mockAssessment = createMockAssessment();
      prisma.assessment.create.mockResolvedValue(mockAssessment);

      const result = await service.createAssessment('user-123', {
        id_worksite: 'worksite-123',
        type: 'FORECAST',
      });

      expect(worksiteService.getOwnedWorksite).toHaveBeenCalledWith(
        'worksite-123',
        'consul-123',
      );
      expect(prisma.assessment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_worksite: 'worksite-123',
          type: 'FORECAST',
          total_kgco2e: 0,
        }),
      });
      expect(result).toEqual(mockAssessment);
    });
  });

  describe('listAssessments', () => {
    it('should scope the list to the consultant', async () => {
      prisma.assessment.findMany.mockResolvedValue([]);

      await service.listAssessments('user-123', {
        id_worksite: 'worksite-123',
      });

      expect(prisma.assessment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            worksite: { client: { id_consultant: 'consul-123' } },
            id_worksite: 'worksite-123',
          },
        }),
      );
    });
  });

  describe('getAssessmentById / getOwnedAssessment', () => {
    it('should return the assessment with its details', async () => {
      mockOwnedAssessment();
      const detailed = createMockAssessment();
      prisma.assessment.findUniqueOrThrow.mockResolvedValue(detailed);

      await expect(
        service.getAssessmentById('assessment-123', 'user-123'),
      ).resolves.toEqual(detailed);
    });

    it('should throw NotFoundException when the assessment does not exist', async () => {
      prisma.assessment.findUnique.mockResolvedValue(null);

      await expect(
        service.getOwnedAssessment('assessment-123', 'consul-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for an assessment of another consultant', async () => {
      prisma.assessment.findUnique.mockResolvedValue(
        createMockAssessmentWithOwner({}, { id_consultant: 'other' }),
      );

      await expect(
        service.getOwnedAssessment('assessment-123', 'consul-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateAssessment', () => {
    it('should update the title of a validated assessment', async () => {
      mockOwnedAssessment({ status: 'VALIDATED' });
      prisma.assessment.update.mockResolvedValue(
        createMockAssessment({ title: 'Nouveau titre' }),
      );

      const result = await service.updateAssessment(
        'user-123',
        'assessment-123',
        { title: 'Nouveau titre' },
      );

      expect(result.title).toBe('Nouveau titre');
    });

    it('should refuse methodology changes outside DRAFT', async () => {
      mockOwnedAssessment({ status: 'VALIDATED' });

      await expect(
        service.updateAssessment('user-123', 'assessment-123', {
          type: 'FORECAST',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should refuse any change on a sent assessment', async () => {
      mockOwnedAssessment({ status: 'SENT' });

      await expect(
        service.updateAssessment('user-123', 'assessment-123', {
          title: 'X',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateAssessmentStatus', () => {
    it('should validate a draft whose lines are all validated', async () => {
      mockOwnedAssessment({ status: 'DRAFT' });
      prisma.activity_line.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(0);
      prisma.assessment.update.mockResolvedValue(
        createMockAssessment({ status: 'VALIDATED' }),
      );

      const result = await service.updateAssessmentStatus(
        'user-123',
        'assessment-123',
        'VALIDATED',
      );

      expect(result.status).toBe('VALIDATED');
      expect(prisma.assessment.update).toHaveBeenCalledWith({
        where: { id: 'assessment-123' },
        data: { status: 'VALIDATED', validated_at: expect.any(Date) },
      });
    });

    it('should refuse to validate an assessment without lines', async () => {
      mockOwnedAssessment({ status: 'DRAFT' });
      prisma.activity_line.count.mockResolvedValue(0);

      await expect(
        service.updateAssessmentStatus(
          'user-123',
          'assessment-123',
          'VALIDATED',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should refuse to validate while some lines are not validated', async () => {
      mockOwnedAssessment({ status: 'DRAFT' });
      prisma.activity_line.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);

      await expect(
        service.updateAssessmentStatus(
          'user-123',
          'assessment-123',
          'VALIDATED',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should mark a validated assessment as sent', async () => {
      mockOwnedAssessment({ status: 'VALIDATED' });
      prisma.assessment.update.mockResolvedValue(
        createMockAssessment({ status: 'SENT' }),
      );

      await service.updateAssessmentStatus(
        'user-123',
        'assessment-123',
        'SENT',
      );

      expect(prisma.assessment.update).toHaveBeenCalledWith({
        where: { id: 'assessment-123' },
        data: { status: 'SENT', sent_at: expect.any(Date) },
      });
    });

    it('should reopen a validated assessment and clear validated_at', async () => {
      mockOwnedAssessment({ status: 'VALIDATED' });
      prisma.assessment.update.mockResolvedValue(createMockAssessment());

      await service.updateAssessmentStatus(
        'user-123',
        'assessment-123',
        'DRAFT',
      );

      expect(prisma.assessment.update).toHaveBeenCalledWith({
        where: { id: 'assessment-123' },
        data: { status: 'DRAFT', validated_at: null },
      });
    });

    it.each([
      ['DRAFT', 'SENT'],
      ['SENT', 'DRAFT'],
      ['DRAFT', 'DRAFT'],
    ] as const)('should refuse the transition %s → %s', async (from, to) => {
      mockOwnedAssessment({ status: from });

      await expect(
        service.updateAssessmentStatus('user-123', 'assessment-123', to),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteAssessment', () => {
    it('should delete a draft and release its extractions', async () => {
      mockOwnedAssessment({ status: 'DRAFT' });
      prisma.assessment.findMany.mockResolvedValue([]);

      const result = await service.deleteAssessment(
        'user-123',
        'assessment-123',
      );

      expect(prisma.extraction.updateMany).toHaveBeenCalledWith({
        where: { activity_line: { id_assessment: 'assessment-123' } },
        data: expect.objectContaining({ status: 'PROPOSED' }),
      });
      expect(prisma.assessment.delete).toHaveBeenCalledWith({
        where: { id: 'assessment-123' },
      });
      expect(result).toEqual([]);
    });

    it('should refuse to delete a non-draft assessment', async () => {
      mockOwnedAssessment({ status: 'VALIDATED' });

      await expect(
        service.deleteAssessment('user-123', 'assessment-123'),
      ).rejects.toThrow(ConflictException);
      expect(prisma.assessment.delete).not.toHaveBeenCalled();
    });
  });
});
