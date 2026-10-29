import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { WorksiteController } from 'src/worksite/worksite.controller';
import { WorksiteService } from 'src/worksite/worksite.service';
import { CreateWorksiteDto } from 'src/dtos/worksite.dto';
import {
  createMockUserConsultant,
  createMockWorksite,
} from 'src/utils/mock-creator';

describe('WorksiteController', () => {
  let controller: WorksiteController;
  const worksiteService = {
    createWorksite: jest.fn(),
    listWorksites: jest.fn(),
    getWorksiteById: jest.fn(),
    updateWorksite: jest.fn(),
    deleteWorksite: jest.fn(),
  };
  const user = createMockUserConsultant();
  const anonymous = undefined as unknown as Express.User;
  const createDto: CreateWorksiteDto = {
    id_client: 'client-123',
    name: 'Réfection RD 936',
    work_type: 'ROADWORKS',
    start_date: new Date('2026-03-01'),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorksiteController],
      providers: [{ provide: WorksiteService, useValue: worksiteService }],
    }).compile();

    controller = module.get<WorksiteController>(WorksiteController);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('POST /worksites', () => {
    it('should create a worksite', async () => {
      const mockWorksite = createMockWorksite();
      worksiteService.createWorksite.mockResolvedValueOnce(mockWorksite);

      const result = await controller.createWorksite(user, createDto);

      expect(worksiteService.createWorksite).toHaveBeenCalledWith(
        user.id,
        createDto,
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWorksite);
      expect(result.message).toContain('Worksite created successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.createWorksite(anonymous, createDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('GET /worksites', () => {
    it('should list worksites with the query filters', async () => {
      const query = { id_client: 'client-123' };
      worksiteService.listWorksites.mockResolvedValueOnce([
        createMockWorksite(),
      ]);

      const result = await controller.listWorksites(user, query);

      expect(worksiteService.listWorksites).toHaveBeenCalledWith(
        user.id,
        query,
      );
      expect(result.data).toHaveLength(1);
      expect(result.message).toContain('Worksites retrieved successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(controller.listWorksites(anonymous, {})).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('GET /worksites/:id', () => {
    it('should return a worksite', async () => {
      const mockWorksite = createMockWorksite();
      worksiteService.getWorksiteById.mockResolvedValueOnce(mockWorksite);

      const result = await controller.getWorksiteById(user, 'worksite-123');

      expect(worksiteService.getWorksiteById).toHaveBeenCalledWith(
        'worksite-123',
        user.id,
      );
      expect(result.data).toEqual(mockWorksite);
      expect(result.message).toContain('Worksite retrieved successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.getWorksiteById(anonymous, 'worksite-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('PUT /worksites/:id', () => {
    it('should update a worksite', async () => {
      const body = { name: 'Tranche 3' };
      worksiteService.updateWorksite.mockResolvedValueOnce(
        createMockWorksite(body),
      );

      const result = await controller.updateWorksite(
        user,
        'worksite-123',
        body,
      );

      expect(worksiteService.updateWorksite).toHaveBeenCalledWith(
        user.id,
        'worksite-123',
        body,
      );
      expect(result.message).toContain('Worksite updated successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.updateWorksite(anonymous, 'worksite-123', {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('DELETE /worksites/:id', () => {
    it('should delete a worksite', async () => {
      worksiteService.deleteWorksite.mockResolvedValueOnce([]);

      const result = await controller.deleteWorksite(user, 'worksite-123');

      expect(worksiteService.deleteWorksite).toHaveBeenCalledWith(
        user.id,
        'worksite-123',
      );
      expect(result.data).toEqual([]);
      expect(result.message).toContain('Worksite deleted successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.deleteWorksite(anonymous, 'worksite-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
