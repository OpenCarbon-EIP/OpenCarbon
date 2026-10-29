import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReductionActionService } from 'src/reduction-action/reduction-action.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConsultantService } from 'src/consultant/consultant.service';
import { AssessmentService } from 'src/assessment/assessment.service';
import { EmissionFactorService } from 'src/emission-factor/emission-factor.service';
import { Prisma } from 'src/generated/prisma/client';
import type { client, reduction_action } from 'src/generated/prisma/client';
import {
  createMockActivityLine,
  createMockAssessmentWithOwner,
  createMockConsultant,
  createMockEmissionFactor,
  createMockReductionAction,
} from 'src/utils/mock-creator';
import { createPrismaMock, PrismaMock } from '../helpers/prisma-mock';

const createMockActionWithOwner = (
  overrides?: Partial<reduction_action>,
  clientOverrides?: Partial<client>,
) => ({
  ...createMockReductionAction(overrides),
  assessment: createMockAssessmentWithOwner({}, clientOverrides),
});

describe('ReductionActionService', () => {
  let service: ReductionActionService;
  let prisma: PrismaMock;
  const consultantService = { getConsultantByUserIdOrThrow: jest.fn() };
  const assessmentService = {
    getOwnedAssessment: jest.fn(),
    assertNotSent: jest.fn(),
  };
  const emissionFactorService = { getUsableFactor: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    consultantService.getConsultantByUserIdOrThrow.mockResolvedValue(
      createMockConsultant(),
    );
    assessmentService.getOwnedAssessment.mockResolvedValue(
      createMockAssessmentWithOwner(),
    );
    assessmentService.assertNotSent.mockImplementation(() => undefined);
    prisma.reduction_action.create.mockResolvedValue(
      createMockReductionAction(),
    );
    prisma.reduction_action.update.mockResolvedValue(
      createMockReductionAction(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReductionActionService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConsultantService, useValue: consultantService },
        { provide: AssessmentService, useValue: assessmentService },
        { provide: EmissionFactorService, useValue: emissionFactorService },
      ],
    }).compile();

    service = module.get<ReductionActionService>(ReductionActionService);
  });

  const createdData = (): {
    estimated_reduction_kgco2e: Prisma.Decimal | number | null;
  } =>
    (
      prisma.reduction_action.create.mock.calls[0][0] as {
        data: { estimated_reduction_kgco2e: Prisma.Decimal | number | null };
      }
    ).data;

  describe('createAction', () => {
    it('should create an action without estimate when no line nor factor is given', async () => {
      await service.createAction('user-123', {
        id_assessment: 'assessment-123',
        label: 'Sensibiliser les conducteurs',
      });

      expect(createdData().estimated_reduction_kgco2e).toBeNull();
    });

    it('should estimate the saving from the line and the alternative factor', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockActivityLine(),
      );
      emissionFactorService.getUsableFactor.mockResolvedValue(
        createMockEmissionFactor({ value_kgco2e: new Prisma.Decimal(0.5) }),
      );

      await service.createAction('user-123', {
        id_assessment: 'assessment-123',
        label: 'HVO',
        id_activity_line: 'line-123',
        id_alternative_factor: 'factor-456',
      });

      // 1000 L × (3.17 - 0.5) kgCO2e/L
      expect(String(createdData().estimated_reduction_kgco2e)).toBe('2670');
    });

    it('should keep an explicit estimate', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockActivityLine(),
      );
      emissionFactorService.getUsableFactor.mockResolvedValue(
        createMockEmissionFactor(),
      );

      await service.createAction('user-123', {
        id_assessment: 'assessment-123',
        label: 'HVO',
        id_activity_line: 'line-123',
        id_alternative_factor: 'factor-456',
        estimated_reduction_kgco2e: 1000,
      });

      expect(createdData().estimated_reduction_kgco2e).toBe(1000);
    });

    it('should reject a line that does not exist', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(null);

      await expect(
        service.createAction('user-123', {
          id_assessment: 'assessment-123',
          label: 'HVO',
          id_activity_line: 'line-123',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject a line from another assessment', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockActivityLine({ id_assessment: 'other-assessment' }),
      );

      await expect(
        service.createAction('user-123', {
          id_assessment: 'assessment-123',
          label: 'HVO',
          id_activity_line: 'line-123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject an alternative factor with another unit', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockActivityLine(),
      );
      emissionFactorService.getUsableFactor.mockResolvedValue(
        createMockEmissionFactor({ per_unit: 'KG' }),
      );

      await expect(
        service.createAction('user-123', {
          id_assessment: 'assessment-123',
          label: 'HVO',
          id_activity_line: 'line-123',
          id_alternative_factor: 'factor-456',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should refuse to add an action to a sent assessment', async () => {
      assessmentService.assertNotSent.mockImplementation(() => {
        throw new ConflictException();
      });

      await expect(
        service.createAction('user-123', {
          id_assessment: 'assessment-123',
          label: 'HVO',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('listActions', () => {
    it('should list the actions of an owned assessment', async () => {
      prisma.reduction_action.findMany.mockResolvedValue([
        createMockReductionAction(),
      ]);

      const result = await service.listActions('user-123', 'assessment-123');

      expect(assessmentService.getOwnedAssessment).toHaveBeenCalledWith(
        'assessment-123',
        'consul-123',
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getActionById', () => {
    it('should return an owned action', async () => {
      prisma.reduction_action.findUnique.mockResolvedValue(
        createMockActionWithOwner(),
      );
      prisma.reduction_action.findUniqueOrThrow.mockResolvedValue(
        createMockReductionAction(),
      );

      await expect(
        service.getActionById('action-123', 'user-123'),
      ).resolves.toEqual(createMockReductionAction());
    });

    it('should throw NotFoundException when the action does not exist', async () => {
      prisma.reduction_action.findUnique.mockResolvedValue(null);

      await expect(
        service.getActionById('action-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for an action of another consultant', async () => {
      prisma.reduction_action.findUnique.mockResolvedValue(
        createMockActionWithOwner({}, { id_consultant: 'other' }),
      );

      await expect(
        service.getActionById('action-123', 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateAction', () => {
    it('should update the status without recomputing the estimate', async () => {
      prisma.reduction_action.findUnique.mockResolvedValue(
        createMockActionWithOwner(),
      );

      await service.updateAction('user-123', 'action-123', {
        status: 'RETAINED',
      });

      expect(prisma.reduction_action.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'RETAINED', estimated_reduction_kgco2e: undefined },
        }),
      );
      expect(prisma.activity_line.findUnique).not.toHaveBeenCalled();
    });

    it('should recompute the estimate when the alternative factor changes', async () => {
      prisma.reduction_action.findUnique.mockResolvedValue(
        createMockActionWithOwner({ id_activity_line: 'line-123' }),
      );
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockActivityLine(),
      );
      emissionFactorService.getUsableFactor.mockResolvedValue(
        createMockEmissionFactor({ value_kgco2e: new Prisma.Decimal(1.17) }),
      );

      await service.updateAction('user-123', 'action-123', {
        id_alternative_factor: 'factor-456',
      });

      const updateArgs = prisma.reduction_action.update.mock.calls[0][0] as {
        data: { estimated_reduction_kgco2e: Prisma.Decimal };
      };
      expect(updateArgs.data.estimated_reduction_kgco2e.toString()).toBe(
        '2000',
      );
    });
  });

  describe('deleteAction', () => {
    it('should delete an owned action', async () => {
      prisma.reduction_action.findUnique.mockResolvedValue(
        createMockActionWithOwner(),
      );
      prisma.reduction_action.findMany.mockResolvedValue([]);

      const result = await service.deleteAction('user-123', 'action-123');

      expect(prisma.reduction_action.delete).toHaveBeenCalledWith({
        where: { id: 'action-123' },
      });
      expect(result).toEqual([]);
    });

    it('should refuse to delete an action of a sent assessment', async () => {
      prisma.reduction_action.findUnique.mockResolvedValue(
        createMockActionWithOwner(),
      );
      assessmentService.assertNotSent.mockImplementation(() => {
        throw new ConflictException();
      });

      await expect(
        service.deleteAction('user-123', 'action-123'),
      ).rejects.toThrow(ConflictException);
      expect(prisma.reduction_action.delete).not.toHaveBeenCalled();
    });
  });
});
