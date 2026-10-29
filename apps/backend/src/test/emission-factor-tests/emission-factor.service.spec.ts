import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EmissionFactorService } from 'src/emission-factor/emission-factor.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConsultantService } from 'src/consultant/consultant.service';
import { EmissionCategoryService } from 'src/emission-category/emission-category.service';
import {
  createMockConsultant,
  createMockEmissionFactor,
} from 'src/utils/mock-creator';
import { createPrismaMock, PrismaMock } from '../helpers/prisma-mock';

const customFactor = (overrides = {}) =>
  createMockEmissionFactor({
    source: 'FDES',
    status: 'VALID_SPECIFIC',
    id_consultant: 'consul-123',
    ...overrides,
  });

describe('EmissionFactorService', () => {
  let service: EmissionFactorService;
  let prisma: PrismaMock;
  const consultantService = { getConsultantByUserIdOrThrow: jest.fn() };
  const emissionCategoryService = { getCategoryById: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    consultantService.getConsultantByUserIdOrThrow.mockResolvedValue(
      createMockConsultant(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmissionFactorService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConsultantService, useValue: consultantService },
        { provide: EmissionCategoryService, useValue: emissionCategoryService },
      ],
    }).compile();

    service = module.get<EmissionFactorService>(EmissionFactorService);
  });

  describe('listFactors', () => {
    it('should list reference and own factors, without archived ones', async () => {
      prisma.emission_factor.findMany.mockResolvedValue([]);

      await service.listFactors('user-123', { search: 'gazole' });

      expect(prisma.emission_factor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ id_consultant: null }, { id_consultant: 'consul-123' }],
            status: { not: 'ARCHIVED' },
            name: { contains: 'gazole', mode: 'insensitive' },
          },
          take: 50,
          skip: 0,
        }),
      );
    });

    it('should apply pagination and filters', async () => {
      prisma.emission_factor.findMany.mockResolvedValue([]);

      await service.listFactors('user-123', {
        per_unit: 'LITRE',
        source: 'FDES',
        id_category: 'category-123',
        take: 10,
        skip: 20,
      });

      expect(prisma.emission_factor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            per_unit: 'LITRE',
            source: 'FDES',
            id_default_category: 'category-123',
          }),
          take: 10,
          skip: 20,
        }),
      );
    });
  });

  describe('getFactorById', () => {
    it('should return a reference factor', async () => {
      prisma.emission_factor.findUnique.mockResolvedValue(
        createMockEmissionFactor(),
      );

      await expect(
        service.getFactorById('factor-123', 'user-123'),
      ).resolves.toEqual(createMockEmissionFactor());
    });

    it('should throw NotFoundException when the factor does not exist', async () => {
      prisma.emission_factor.findUnique.mockResolvedValue(null);

      await expect(
        service.getFactorById('factor-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should hide the custom factor of another consultant', async () => {
      prisma.emission_factor.findUnique.mockResolvedValue(
        customFactor({ id_consultant: 'other' }),
      );

      await expect(
        service.getFactorById('factor-123', 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUsableFactor', () => {
    it('should return a usable factor', async () => {
      prisma.emission_factor.findUnique.mockResolvedValue(customFactor());

      await expect(
        service.getUsableFactor('factor-123', 'consul-123'),
      ).resolves.toEqual(customFactor());
    });

    it('should refuse an archived factor', async () => {
      prisma.emission_factor.findUnique.mockResolvedValue(
        createMockEmissionFactor({ status: 'ARCHIVED' }),
      );

      await expect(
        service.getUsableFactor('factor-123', 'consul-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should refuse the custom factor of another consultant', async () => {
      prisma.emission_factor.findUnique.mockResolvedValue(
        customFactor({ id_consultant: 'other' }),
      );

      await expect(
        service.getUsableFactor('factor-123', 'consul-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createFactor', () => {
    it('should create a VALID_SPECIFIC factor owned by the consultant', async () => {
      prisma.emission_factor.create.mockResolvedValue(customFactor());

      await service.createFactor('user-123', {
        source: 'FDES',
        name: 'Enrobé tiède',
        value_kgco2e: 52.4,
        per_unit: 'TONNE',
        id_default_category: 'category-123',
      });

      expect(emissionCategoryService.getCategoryById).toHaveBeenCalledWith(
        'category-123',
      );
      expect(prisma.emission_factor.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'VALID_SPECIFIC',
            id_consultant: 'consul-123',
          }),
        }),
      );
    });
  });

  describe('updateFactor', () => {
    it('should update an owned custom factor', async () => {
      prisma.emission_factor.findUnique.mockResolvedValue(customFactor());
      prisma.emission_factor.update.mockResolvedValue(
        customFactor({ status: 'ARCHIVED' }),
      );

      const result = await service.updateFactor('user-123', 'factor-123', {
        status: 'ARCHIVED',
      });

      expect(result.status).toBe('ARCHIVED');
    });

    it('should refuse to modify a reference factor', async () => {
      prisma.emission_factor.findUnique.mockResolvedValue(
        createMockEmissionFactor(),
      );

      await expect(
        service.updateFactor('user-123', 'factor-123', { name: 'X' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should refuse to modify the factor of another consultant', async () => {
      prisma.emission_factor.findUnique.mockResolvedValue(
        customFactor({ id_consultant: 'other' }),
      );

      await expect(
        service.updateFactor('user-123', 'factor-123', { name: 'X' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should require a source reference for a CUSTOM factor', async () => {
      prisma.emission_factor.findUnique.mockResolvedValue(
        customFactor({ source_reference: null }),
      );

      await expect(
        service.updateFactor('user-123', 'factor-123', { source: 'CUSTOM' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.emission_factor.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteFactor', () => {
    it('should delete an unused custom factor', async () => {
      prisma.emission_factor.findUnique
        .mockResolvedValueOnce(customFactor())
        .mockResolvedValueOnce({
          _count: { activity_lines: 0, proposed_in: 0, alternative_in: 0 },
        });
      prisma.emission_factor.delete.mockResolvedValue(customFactor());

      await service.deleteFactor('user-123', 'factor-123');

      expect(prisma.emission_factor.delete).toHaveBeenCalledWith({
        where: { id: 'factor-123' },
      });
    });

    it('should refuse to delete a factor in use', async () => {
      prisma.emission_factor.findUnique
        .mockResolvedValueOnce(customFactor())
        .mockResolvedValueOnce({
          _count: { activity_lines: 2, proposed_in: 0, alternative_in: 0 },
        });

      await expect(
        service.deleteFactor('user-123', 'factor-123'),
      ).rejects.toThrow(ConflictException);
      expect(prisma.emission_factor.delete).not.toHaveBeenCalled();
    });
  });
});
