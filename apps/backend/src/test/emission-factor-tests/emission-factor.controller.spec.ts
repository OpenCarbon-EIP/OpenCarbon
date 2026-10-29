import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { EmissionFactorController } from 'src/emission-factor/emission-factor.controller';
import { EmissionFactorService } from 'src/emission-factor/emission-factor.service';
import { CreateEmissionFactorDto } from 'src/dtos/emission-factor.dto';
import {
  createMockEmissionFactor,
  createMockUserConsultant,
} from 'src/utils/mock-creator';

describe('EmissionFactorController', () => {
  let controller: EmissionFactorController;
  const emissionFactorService = {
    createFactor: jest.fn(),
    listFactors: jest.fn(),
    getFactorById: jest.fn(),
    updateFactor: jest.fn(),
    deleteFactor: jest.fn(),
  };
  const user = createMockUserConsultant();
  const anonymous = undefined as unknown as Express.User;
  const createDto: CreateEmissionFactorDto = {
    source: 'FDES',
    name: 'Enrobé tiède',
    value_kgco2e: 52.4,
    per_unit: 'TONNE',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmissionFactorController],
      providers: [
        { provide: EmissionFactorService, useValue: emissionFactorService },
      ],
    }).compile();

    controller = module.get<EmissionFactorController>(EmissionFactorController);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('POST /emission-factors', () => {
    it('should create a custom emission factor', async () => {
      const mockFactor = createMockEmissionFactor({ source: 'FDES' });
      emissionFactorService.createFactor.mockResolvedValueOnce(mockFactor);

      const result = await controller.createFactor(user, createDto);

      expect(emissionFactorService.createFactor).toHaveBeenCalledWith(
        user.id,
        createDto,
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockFactor);
      expect(result.message).toContain('Emission factor created successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.createFactor(anonymous, createDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('GET /emission-factors', () => {
    it('should list emission factors with the query', async () => {
      const query = { search: 'gazole', take: 20 };
      emissionFactorService.listFactors.mockResolvedValueOnce([
        createMockEmissionFactor(),
      ]);

      const result = await controller.listFactors(user, query);

      expect(emissionFactorService.listFactors).toHaveBeenCalledWith(
        user.id,
        query,
      );
      expect(result.data).toHaveLength(1);
      expect(result.message).toContain(
        'Emission factors retrieved successfully',
      );
    });

    it('should throw if user is not authenticated', async () => {
      await expect(controller.listFactors(anonymous, {})).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('GET /emission-factors/:id', () => {
    it('should return an emission factor', async () => {
      const mockFactor = createMockEmissionFactor();
      emissionFactorService.getFactorById.mockResolvedValueOnce(mockFactor);

      const result = await controller.getFactorById(user, 'factor-123');

      expect(emissionFactorService.getFactorById).toHaveBeenCalledWith(
        'factor-123',
        user.id,
      );
      expect(result.data).toEqual(mockFactor);
      expect(result.message).toContain(
        'Emission factor retrieved successfully',
      );
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.getFactorById(anonymous, 'factor-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('PUT /emission-factors/:id', () => {
    it('should update a custom emission factor', async () => {
      const body = { status: 'ARCHIVED' as const };
      emissionFactorService.updateFactor.mockResolvedValueOnce(
        createMockEmissionFactor(body),
      );

      const result = await controller.updateFactor(user, 'factor-123', body);

      expect(emissionFactorService.updateFactor).toHaveBeenCalledWith(
        user.id,
        'factor-123',
        body,
      );
      expect(result.message).toContain('Emission factor updated successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.updateFactor(anonymous, 'factor-123', {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('DELETE /emission-factors/:id', () => {
    it('should delete a custom emission factor', async () => {
      const mockFactor = createMockEmissionFactor();
      emissionFactorService.deleteFactor.mockResolvedValueOnce(mockFactor);

      const result = await controller.deleteFactor(user, 'factor-123');

      expect(emissionFactorService.deleteFactor).toHaveBeenCalledWith(
        user.id,
        'factor-123',
      );
      expect(result.data).toEqual(mockFactor);
      expect(result.message).toContain('Emission factor deleted successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.deleteFactor(anonymous, 'factor-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
