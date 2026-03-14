import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationService } from '../application/application.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ConsultantService } from '../consultant/consultant.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { application } from 'src/generated/prisma/client';
import {
  createMockApplication,
  createMockApplicationList,
  createMockConsultant,
  createMockUserConsultant,
} from 'src/utils/mock-creator';

describe('ApplicationService', () => {
  let service: ApplicationService;
  let prismaService: PrismaService;
  let usersService: UsersService;
  let consultantService: ConsultantService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationService,
        {
          provide: PrismaService,
          useValue: {
            application: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUserById: jest.fn(),
          },
        },
        {
          provide: ConsultantService,
          useValue: {
            getConsultantByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ApplicationService>(ApplicationService);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
    consultantService = module.get<ConsultantService>(ConsultantService);
  });

  describe('createApplication', () => {
    it('should create a new application with authenticated user id', async () => {
      const createDto = createMockApplication();

      const userId = 'consul-123';

      const mockUser = createMockUserConsultant();

      const mockConsultant = createMockConsultant();

      const mockApp = createMockApplication();

      jest.spyOn(usersService, 'getUserById').mockResolvedValue(mockUser);
      jest
        .spyOn(consultantService, 'getConsultantByUserId')
        .mockResolvedValue(mockConsultant);
      jest
        .spyOn(prismaService.application, 'create')
        .mockResolvedValue(mockApp);

      const result = await service.createApplication(createDto, userId);

      expect(result).toEqual(mockApp);

      const createSpy = jest.spyOn(prismaService.application, 'create');
      expect(createSpy).toHaveBeenCalledWith({
        data: {
          id_consultant: 'consul-123',
          id_offer: 'offer-123',
          content: 'I am interested in this offer.',
        },
      });
    });

    it('should throw BadRequestException if creation fails', async () => {
      const invalidDto: Partial<application> = {
        id_offer: 'offre-123',
      };

      const mockUser = createMockUserConsultant();

      const mockConsultant = createMockConsultant();

      jest.spyOn(usersService, 'getUserById').mockResolvedValue(mockUser);
      jest
        .spyOn(consultantService, 'getConsultantByUserId')
        .mockResolvedValue(mockConsultant);

      await expect(
        service.createApplication(invalidDto as application, 'consul-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user is not found', async () => {
      const createDto = createMockApplication();

      jest.spyOn(usersService, 'getUserById').mockResolvedValue(null);

      await expect(
        service.createApplication(createDto, 'consul-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getApplicationById', () => {
    it('should return an application when it exists', async () => {
      const mockApp = createMockApplication();

      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApp);

      const result = await service.getApplicationById('application-123');

      expect(result).toEqual(mockApp);
    });

    it('should throw BadRequestException if id is not provided', async () => {
      await expect(service.getApplicationById('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getAllApplicationsByUserId', () => {
    it('should return all applications for a user', async () => {
      const mockApps = createMockApplicationList(2);

      jest
        .spyOn(prismaService.application, 'findMany')
        .mockResolvedValue(mockApps);

      const result = await service.getAllApplicationsByUserId('consul-123');

      expect(result).toEqual(mockApps);
    });

    it('should throw BadRequestException if userId is not provided', async () => {
      await expect(service.getAllApplicationsByUserId('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteApplication', () => {
    it('should delete an application by id', async () => {
      const mockApp = createMockApplication();

      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApp);
      jest
        .spyOn(prismaService.application, 'delete')
        .mockResolvedValue(mockApp);

      await service.deleteApplication('application-123', 'consul-123');

      const findUniqueSpy = jest.spyOn(prismaService.application, 'findUnique');
      expect(findUniqueSpy).toHaveBeenCalledWith({
        where: { id: 'application-123' },
      });

      const deleteSpy = jest.spyOn(prismaService.application, 'delete');
      expect(deleteSpy).toHaveBeenCalledWith({
        where: { id: 'application-123' },
      });
    });

    it('should throw BadRequestException if id is not provided', async () => {
      await expect(service.deleteApplication('', 'consul-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw not found exception if application does not exist', async () => {
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(null);

      await expect(
        service.deleteApplication('nonexistent-id', 'consul-123'),
      ).rejects.toThrow('Application not found');
    });

    it('should throw ForbiddenException if user does not own the application', async () => {
      const mockApp = createMockApplication();

      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApp);
      jest
        .spyOn(prismaService.application, 'delete')
        .mockResolvedValue(mockApp);

      await expect(
        service.deleteApplication('app-123', 'other-user'),
      ).rejects.toThrow(
        'You do not have permission to delete this application',
      );
    });
  });
});
