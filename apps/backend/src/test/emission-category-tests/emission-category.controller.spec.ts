import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { EmissionCategoryController } from 'src/emission-category/emission-category.controller';
import { EmissionCategoryService } from 'src/emission-category/emission-category.service';
import {
  createMockEmissionCategory,
  createMockUserCompany,
  createMockUserConsultant,
} from 'src/utils/mock-creator';

describe('EmissionCategoryController', () => {
  let controller: EmissionCategoryController;
  const emissionCategoryService = {
    listCategories: jest.fn(),
    getCategoryById: jest.fn(),
  };
  const anonymous = undefined as unknown as Express.User;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmissionCategoryController],
      providers: [
        { provide: EmissionCategoryService, useValue: emissionCategoryService },
      ],
    }).compile();

    controller = module.get<EmissionCategoryController>(
      EmissionCategoryController,
    );
  });

  beforeEach(() => jest.clearAllMocks());

  describe('GET /emission-categories', () => {
    it.each([
      ['consultant', createMockUserConsultant()],
      ['company', createMockUserCompany()],
    ])('should list categories for a %s', async (_role, user) => {
      const mockCategories = [createMockEmissionCategory()];
      emissionCategoryService.listCategories.mockResolvedValueOnce(
        mockCategories,
      );

      const result = await controller.listCategories(user);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCategories);
      expect(result.message).toContain(
        'Emission categories retrieved successfully',
      );
    });

    it('should throw if user is not authenticated', async () => {
      await expect(controller.listCategories(anonymous)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('GET /emission-categories/:id', () => {
    it('should return a category', async () => {
      const mockCategory = createMockEmissionCategory();
      emissionCategoryService.getCategoryById.mockResolvedValueOnce(
        mockCategory,
      );

      const result = await controller.getCategoryById(
        createMockUserConsultant(),
        'category-123',
      );

      expect(emissionCategoryService.getCategoryById).toHaveBeenCalledWith(
        'category-123',
      );
      expect(result.data).toEqual(mockCategory);
      expect(result.message).toContain(
        'Emission category retrieved successfully',
      );
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.getCategoryById(anonymous, 'category-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
