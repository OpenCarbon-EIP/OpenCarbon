import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmissionCategoryService } from 'src/emission-category/emission-category.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { createMockEmissionCategory } from 'src/utils/mock-creator';
import { createPrismaMock, PrismaMock } from '../helpers/prisma-mock';

describe('EmissionCategoryService', () => {
  let service: EmissionCategoryService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmissionCategoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<EmissionCategoryService>(EmissionCategoryService);
  });

  describe('listCategories', () => {
    it('should list categories in display order', async () => {
      const mockCategories = [createMockEmissionCategory()];
      prisma.emission_category.findMany.mockResolvedValue(mockCategories);

      const result = await service.listCategories();

      expect(result).toEqual(mockCategories);
      expect(prisma.emission_category.findMany).toHaveBeenCalledWith({
        orderBy: [{ sort_order: 'asc' }, { label: 'asc' }],
      });
    });
  });

  describe('getCategoryById', () => {
    it('should return a category', async () => {
      const mockCategory = createMockEmissionCategory();
      prisma.emission_category.findUnique.mockResolvedValue(mockCategory);

      await expect(service.getCategoryById('category-123')).resolves.toEqual(
        mockCategory,
      );
    });

    it('should throw NotFoundException when the category does not exist', async () => {
      prisma.emission_category.findUnique.mockResolvedValue(null);

      await expect(service.getCategoryById('category-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
