import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ActivityLineService } from 'src/activity-line/activity-line.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConsultantService } from 'src/consultant/consultant.service';
import { AssessmentService } from 'src/assessment/assessment.service';
import { EmissionFactorService } from 'src/emission-factor/emission-factor.service';
import { EmissionCategoryService } from 'src/emission-category/emission-category.service';
import { Prisma } from 'src/generated/prisma/client';
import type { activity_line, client } from 'src/generated/prisma/client';
import { CreateActivityLineDto } from 'src/dtos/activity-line.dto';
import {
  createMockActivityLine,
  createMockAssessmentWithOwner,
  createMockConsultant,
  createMockEmissionFactor,
} from 'src/utils/mock-creator';
import { createPrismaMock, PrismaMock } from '../helpers/prisma-mock';

const createMockLineWithOwner = (
  overrides?: Partial<activity_line>,
  clientOverrides?: Partial<client>,
) => ({
  ...createMockActivityLine(overrides),
  assessment: createMockAssessmentWithOwner({}, clientOverrides),
});

describe('ActivityLineService', () => {
  let service: ActivityLineService;
  let prisma: PrismaMock;
  const consultantService = { getConsultantByUserIdOrThrow: jest.fn() };
  const assessmentService = {
    getOwnedAssessment: jest.fn(),
    assertDraft: jest.fn(),
  };
  const emissionFactorService = { getUsableFactor: jest.fn() };
  const emissionCategoryService = { getCategoryById: jest.fn() };
  const createDto: CreateActivityLineDto = {
    id_assessment: 'assessment-123',
    label: 'GNR pelle',
    input_quantity: 1000,
    input_unit: 'LITRE',
    id_emission_factor: 'factor-123',
    data_origin: 'MEASURED',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    consultantService.getConsultantByUserIdOrThrow.mockResolvedValue(
      createMockConsultant(),
    );
    assessmentService.getOwnedAssessment.mockResolvedValue(
      createMockAssessmentWithOwner(),
    );
    assessmentService.assertDraft.mockImplementation(() => undefined);
    prisma.activity_line.findMany.mockResolvedValue([]);
    emissionFactorService.getUsableFactor.mockResolvedValue(
      createMockEmissionFactor(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLineService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConsultantService, useValue: consultantService },
        { provide: AssessmentService, useValue: assessmentService },
        { provide: EmissionFactorService, useValue: emissionFactorService },
        { provide: EmissionCategoryService, useValue: emissionCategoryService },
      ],
    }).compile();

    service = module.get<ActivityLineService>(ActivityLineService);
  });

  describe('prepareLine', () => {
    const input = {
      label: createDto.label,
      input_quantity: createDto.input_quantity,
      input_unit: createDto.input_unit,
      id_emission_factor: createDto.id_emission_factor,
      data_origin: createDto.data_origin,
    };

    it('should copy the factor and compute the line', async () => {
      const prepared = await service.prepareLine('consul-123', input);

      expect(prepared.id_category).toBe('category-123');
      expect(prepared.calc_unit).toBe('LITRE');
      expect(prepared.fe_label).toBe('Gazole non routier');
      expect(prepared.fe_database_version).toBe('23.6');
      expect(prepared.data_uncertainty_pct).toBe(5);
      expect((prepared.result_kgco2e as Prisma.Decimal).toString()).toBe(
        '3170',
      );
    });

    it('should append the factor attribute to the copied label', async () => {
      emissionFactorService.getUsableFactor.mockResolvedValue(
        createMockEmissionFactor({ attribute: 'B7' }),
      );

      const prepared = await service.prepareLine('consul-123', input);

      expect(prepared.fe_label).toBe('Gazole non routier - B7');
    });

    it('should require a conversion factor when units differ', async () => {
      emissionFactorService.getUsableFactor.mockResolvedValue(
        createMockEmissionFactor({ per_unit: 'TONNE' }),
      );

      await expect(
        service.prepareLine('consul-123', { ...input, input_unit: 'M3' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should convert the quantity when a conversion factor is given', async () => {
      emissionFactorService.getUsableFactor.mockResolvedValue(
        createMockEmissionFactor({
          per_unit: 'TONNE',
          value_kgco2e: new Prisma.Decimal(100),
        }),
      );

      const prepared = await service.prepareLine('consul-123', {
        ...input,
        input_quantity: 10,
        input_unit: 'M3',
        conversion_factor: 2.4,
      });

      expect((prepared.calc_quantity as Prisma.Decimal).toString()).toBe('24');
      expect((prepared.result_kgco2e as Prisma.Decimal).toString()).toBe(
        '2400',
      );
    });

    it('should require a category when the factor has no default one', async () => {
      emissionFactorService.getUsableFactor.mockResolvedValue(
        createMockEmissionFactor({ id_default_category: null }),
      );

      await expect(service.prepareLine('consul-123', input)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should propagate a forbidden custom factor', async () => {
      emissionFactorService.getUsableFactor.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(service.prepareLine('consul-123', input)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createLine', () => {
    it('should create the line and recompute the totals in a transaction', async () => {
      const mockLine = createMockActivityLine();
      prisma.activity_line.create.mockResolvedValue(mockLine);

      const result = await service.createLine('user-123', createDto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.activity_line.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ id_assessment: 'assessment-123' }),
        }),
      );
      expect(prisma.assessment.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'assessment-123' } }),
      );
      expect(result).toEqual(mockLine);
    });

    it('should refuse to add a line to a locked assessment', async () => {
      assessmentService.assertDraft.mockImplementation(() => {
        throw new ConflictException();
      });

      await expect(service.createLine('user-123', createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(emissionFactorService.getUsableFactor).not.toHaveBeenCalled();
    });
  });

  describe('listLines', () => {
    it('should list the lines of an owned assessment', async () => {
      prisma.activity_line.findMany.mockResolvedValue([
        createMockActivityLine(),
      ]);

      const result = await service.listLines('user-123', 'assessment-123');

      expect(assessmentService.getOwnedAssessment).toHaveBeenCalledWith(
        'assessment-123',
        'consul-123',
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getLineById / getOwnedLine', () => {
    it('should return an owned line', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockLineWithOwner(),
      );
      prisma.activity_line.findUniqueOrThrow.mockResolvedValue(
        createMockActivityLine(),
      );

      await expect(
        service.getLineById('line-123', 'user-123'),
      ).resolves.toEqual(createMockActivityLine());
    });

    it('should throw NotFoundException when the line does not exist', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(null);

      await expect(
        service.getOwnedLine('line-123', 'consul-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for a line of another consultant', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockLineWithOwner({}, { id_consultant: 'other' }),
      );

      await expect(
        service.getOwnedLine('line-123', 'consul-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateLine', () => {
    beforeEach(() => {
      prisma.activity_line.update.mockResolvedValue(createMockActivityLine());
    });

    it('should not recompute when only descriptive fields change', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockLineWithOwner({ is_validated: true }),
      );

      await service.updateLine('user-123', 'line-123', { comment: 'OK' });

      const updateArgs = prisma.activity_line.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(updateArgs.data.comment).toBe('OK');
      expect(updateArgs.data.is_validated).toBe(true);
      expect(updateArgs.data.result_kgco2e).toBeUndefined();
      expect(prisma.assessment.update).not.toHaveBeenCalled();
    });

    it('should recompute with the copied factor and reset validation', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockLineWithOwner({
          is_validated: true,
          fe_value_kgco2e: new Prisma.Decimal(2),
        }),
      );

      await service.updateLine('user-123', 'line-123', { input_quantity: 10 });

      const updateArgs = prisma.activity_line.update.mock.calls[0][0] as {
        data: { result_kgco2e: Prisma.Decimal; is_validated: boolean };
      };
      expect(updateArgs.data.result_kgco2e.toString()).toBe('20');
      expect(updateArgs.data.is_validated).toBe(false);
      expect(emissionFactorService.getUsableFactor).not.toHaveBeenCalled();
      expect(prisma.assessment.update).toHaveBeenCalled();
    });

    it('should copy the new factor when the factor changes', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockLineWithOwner(),
      );
      emissionFactorService.getUsableFactor.mockResolvedValue(
        createMockEmissionFactor({
          id: 'factor-456',
          name: 'HVO',
          value_kgco2e: new Prisma.Decimal(0.5),
        }),
      );

      await service.updateLine('user-123', 'line-123', {
        id_emission_factor: 'factor-456',
      });

      const updateArgs = prisma.activity_line.update.mock.calls[0][0] as {
        data: { fe_label: string; id_emission_factor: string };
      };
      expect(updateArgs.data.fe_label).toBe('HVO');
      expect(updateArgs.data.id_emission_factor).toBe('factor-456');
    });

    it('should drop the conversion when the input unit now matches the factor', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockLineWithOwner({
          input_quantity: new Prisma.Decimal(85),
          input_unit: 'M3',
          conversion_factor: new Prisma.Decimal(2.4),
          conversion_note: 'béton 2,4 t/m³',
          calc_unit: 'TONNE',
          fe_value_kgco2e: new Prisma.Decimal(96),
        }),
      );

      await service.updateLine('user-123', 'line-123', {
        input_quantity: 204,
        input_unit: 'TONNE',
      });

      const updateArgs = prisma.activity_line.update.mock.calls[0][0] as {
        data: {
          conversion_factor: unknown;
          conversion_note: unknown;
          calc_quantity: Prisma.Decimal;
          result_kgco2e: Prisma.Decimal;
        };
      };
      expect(updateArgs.data.conversion_factor).toBeNull();
      expect(updateArgs.data.conversion_note).toBeNull();
      expect(updateArgs.data.calc_quantity.toString()).toBe('204');
      expect(updateArgs.data.result_kgco2e.toString()).toBe('19584');
    });

    it('should require a new conversion when the factor unit changes', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockLineWithOwner({
          input_unit: 'M3',
          conversion_factor: new Prisma.Decimal(2.4),
          calc_unit: 'TONNE',
        }),
      );
      emissionFactorService.getUsableFactor.mockResolvedValue(
        createMockEmissionFactor({ id: 'factor-kg', per_unit: 'KG' }),
      );

      await expect(
        service.updateLine('user-123', 'line-123', {
          id_emission_factor: 'factor-kg',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.activity_line.update).not.toHaveBeenCalled();
    });

    it('should keep the conversion when only the quantity changes', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockLineWithOwner({
          input_unit: 'M3',
          conversion_factor: new Prisma.Decimal(2.4),
          calc_unit: 'TONNE',
          fe_value_kgco2e: new Prisma.Decimal(96),
        }),
      );

      await service.updateLine('user-123', 'line-123', { input_quantity: 10 });

      const updateArgs = prisma.activity_line.update.mock.calls[0][0] as {
        data: { conversion_note: unknown; calc_quantity: Prisma.Decimal };
      };
      expect(updateArgs.data.calc_quantity.toString()).toBe('24');
      expect(updateArgs.data.conversion_note).toBeUndefined();
    });

    it('should set validated_at when the line gets validated', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockLineWithOwner({ is_validated: false }),
      );

      await service.updateLine('user-123', 'line-123', { is_validated: true });

      const updateArgs = prisma.activity_line.update.mock.calls[0][0] as {
        data: { is_validated: boolean; validated_at: Date };
      };
      expect(updateArgs.data.is_validated).toBe(true);
      expect(updateArgs.data.validated_at).toBeInstanceOf(Date);
    });

    it('should refuse to update a line of a locked assessment', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockLineWithOwner(),
      );
      assessmentService.assertDraft.mockImplementation(() => {
        throw new ConflictException();
      });

      await expect(
        service.updateLine('user-123', 'line-123', { comment: 'X' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteLine', () => {
    it('should delete the line, release its extraction and recompute', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockLineWithOwner({ id_extraction: 'extraction-123' }),
      );
      prisma.activity_line.findMany.mockResolvedValue([]);

      const result = await service.deleteLine('user-123', 'line-123');

      expect(prisma.activity_line.delete).toHaveBeenCalledWith({
        where: { id: 'line-123' },
      });
      expect(prisma.extraction.update).toHaveBeenCalledWith({
        where: { id: 'extraction-123' },
        data: expect.objectContaining({ status: 'PROPOSED' }),
      });
      expect(prisma.assessment.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'assessment-123' } }),
      );
      expect(result).toEqual([]);
    });

    it('should not touch extractions for a manual line', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(
        createMockLineWithOwner(),
      );
      prisma.activity_line.findMany.mockResolvedValue([]);

      await service.deleteLine('user-123', 'line-123');

      expect(prisma.extraction.update).not.toHaveBeenCalled();
    });
  });

  describe('recomputeTotals', () => {
    it('should store the totals computed from the lines', async () => {
      prisma.activity_line.findMany.mockResolvedValue([
        { result_kgco2e: new Prisma.Decimal(300), line_uncertainty_pct: 10 },
        { result_kgco2e: new Prisma.Decimal(400), line_uncertainty_pct: 7.5 },
      ]);

      await service.recomputeTotals(
        prisma as unknown as Prisma.TransactionClient,
        'assessment-123',
      );

      const updateArgs = prisma.assessment.update.mock.calls[0][0] as {
        where: { id: string };
        data: {
          total_kgco2e: Prisma.Decimal;
          total_uncertainty_pct: Prisma.Decimal;
        };
      };
      expect(updateArgs.where.id).toBe('assessment-123');
      expect(updateArgs.data.total_kgco2e.toString()).toBe('700');
      expect(updateArgs.data.total_uncertainty_pct.toString()).toBe('6.06');
    });
  });
});
