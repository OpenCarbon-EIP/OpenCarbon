import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationService } from '../application/application.service';
import { ApplicationController } from '../application/application.controller';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import type { application } from 'src/generated/prisma/browser';
import {
  createMockApplication,
  createMockApplicationList,
} from 'src/utils/mock-creator';

describe('ApplicationController', () => {
  let controller: ApplicationController;
  let service: ApplicationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationController],
      providers: [
        {
          provide: ApplicationService,
          useValue: {
            createApplication: jest.fn(),
            getApplicationById: jest.fn(),
            getAllApplicationsByUserId: jest.fn(),
            deleteApplication: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ApplicationController>(ApplicationController);
    service = module.get<ApplicationService>(ApplicationService);
  });

  describe('createApplication', () => {
    it('should return success response when creating application', async () => {
      const createDto = createMockApplication();

      const mockApp = createMockApplication();

      jest.spyOn(service, 'createApplication').mockResolvedValue(mockApp);

      const result = await controller.createApplication(createDto, {
        id: 'consul-123',
      } as Express.User);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockApp);
      expect(result.message).toContain('created successfully');
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      const createDto = createMockApplication();

      await expect(
        controller.createApplication(
          createDto,
          undefined as unknown as Express.User,
        ),
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('getApplicationById', () => {
    it('should return application when found', async () => {
      const mockApp = createMockApplication();

      jest.spyOn(service, 'getApplicationById').mockResolvedValue(mockApp);

      const result = await controller.getApplicationById('application-123', {
        id: 'consul-123',
      } as Express.User);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockApp);
      expect(result.message).toContain('retrieved successfully');
    });

    it('should throw NotFoundException when application not found', async () => {
      jest.spyOn(service, 'getApplicationById').mockResolvedValue(null);

      await expect(
        controller.getApplicationById('nonexistent-id', {
          id: 'consul-123',
        } as Express.User),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the application', async () => {
      const mockApp = createMockApplication();

      jest.spyOn(service, 'getApplicationById').mockResolvedValue(mockApp);

      await expect(
        controller.getApplicationById('application-123', {
          id: 'other-user',
        } as Express.User),
      ).rejects.toThrow(
        'You do not have permission to access this application',
      );
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      await expect(
        controller.getApplicationById(
          'application-123',
          undefined as unknown as Express.User,
        ),
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('getAllApplicationsByUserId', () => {
    it('should return applications for a user', async () => {
      const mockApps = createMockApplicationList(2);

      jest
        .spyOn(service, 'getAllApplicationsByUserId')
        .mockResolvedValue(mockApps);

      const result = await controller.getAllApplicationsByUserId({
        id: 'consul-123',
      } as Express.User);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockApps);
      expect(result.message).toContain('retrieved successfully');
    });

    it('should return empty array when no applications found', async () => {
      jest.spyOn(service, 'getAllApplicationsByUserId').mockResolvedValue([]);

      const result = await controller.getAllApplicationsByUserId({
        id: 'consul-123',
      } as Express.User);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.message).toContain('retrieved successfully');
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      await expect(
        controller.getAllApplicationsByUserId(
          undefined as unknown as Express.User,
        ),
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('deleteApplication', () => {
    it('should return deleted application', async () => {
      const mockApp = createMockApplicationList(1);

      jest.spyOn(service, 'deleteApplication').mockResolvedValue(mockApp);

      const result = await controller.deleteApplication('application-123', {
        id: 'consul-123',
      } as Express.User);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockApp);
      expect(result.message).toContain('deleted successfully');
    });

    it('should throw NotFoundException when application to delete is not found', async () => {
      jest
        .spyOn(service, 'deleteApplication')
        .mockResolvedValue(null as unknown as application[]);

      await expect(
        controller.deleteApplication('nonexistent-id', {
          id: 'consul-123',
        } as Express.User),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the application', async () => {
      jest
        .spyOn(service, 'deleteApplication')
        .mockRejectedValue(
          new ForbiddenException(
            'You do not have permission to delete this application',
          ),
        );

      await expect(
        controller.deleteApplication('app-uuid', {
          id: 'other-user',
        } as Express.User),
      ).rejects.toThrow(
        'You do not have permission to delete this application',
      );
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      await expect(
        controller.deleteApplication(
          'app-uuid',
          undefined as unknown as Express.User,
        ),
      ).rejects.toThrow('User not authenticated');
    });
  });
});
