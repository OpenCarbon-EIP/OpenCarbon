import { Test, TestingModule } from '@nestjs/testing';
import { OfferService } from '../../offer/offer.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import {
  createMockUserCompany,
  createMockCompany,
  createMockOfferList,
  createMockOffer,
  createMockOfferWithRelations,
} from 'src/utils/mock-creator';
import {
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

describe('OfferService', () => {
  let service: OfferService;
  let prismaService: PrismaService;
  let usersService: UsersService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfferService,
        {
          provide: PrismaService,
          useValue: {
            offer: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              delete: jest.fn(),
              update: jest.fn(),
            },
            company: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUserById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OfferService>(OfferService);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('createOffer', () => {
    it('should create a new offer with authenticated user', async () => {
      const createDto = createMockOffer();

      const userId = 'user-123';

      const mockUser = createMockUserCompany();

      const mockCompany = createMockCompany();

      const mockOffer = createMockOffer();

      jest.spyOn(usersService, 'getUserById').mockResolvedValue(mockUser);
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany);
      jest.spyOn(prismaService.offer, 'create').mockResolvedValue(mockOffer);

      const result = await service.createOffer(userId, createDto);

      expect(result).toEqual(mockOffer);
    });

    it('should throw NotFoundException if user not found', async () => {
      const createDto = createMockOffer();

      jest.spyOn(usersService, 'getUserById').mockResolvedValue(null);

      await expect(service.createOffer('user-123', createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if company not found', async () => {
      const createDto = createMockOffer();

      const mockUser = createMockUserCompany();

      jest.spyOn(usersService, 'getUserById').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.company, 'findUnique').mockResolvedValue(null);

      await expect(service.createOffer('user-123', createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listOffers', () => {
    it('should return all offers', async () => {
      const mockOffers = createMockOfferList(2);

      jest.spyOn(prismaService.offer, 'findMany').mockResolvedValue(mockOffers);

      const result = await service.listOffers();

      expect(result).toEqual(mockOffers);
    });
  });

  describe('listMyOffers', () => {
    it('should return offers for a company', async () => {
      const userId = 'user-123';
      const mockCompany = createMockCompany();

      const mockOffers = createMockOfferList(2);

      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany);
      jest.spyOn(prismaService.offer, 'findMany').mockResolvedValue(mockOffers);

      const result = await service.listMyOffers(userId);

      expect(result).toEqual(mockOffers);
    });

    it('should throw NotFoundException if company not found', async () => {
      jest.spyOn(prismaService.company, 'findUnique').mockResolvedValue(null);

      await expect(service.listMyOffers('user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getOfferById', () => {
    it('should return an offer with company and user when it exists', async () => {
      const mockOfferWithRelations = createMockOfferWithRelations();

      jest
        .spyOn(prismaService.offer, 'findUnique')
        .mockResolvedValue(mockOfferWithRelations);

      const result = await service.getOfferById('offer-123');

      expect(result).toEqual(mockOfferWithRelations);
      expect(result.company).toBeDefined();
      expect(result.company.user).toBeDefined();
    });

    it('should throw NotFoundException if offer not found', async () => {
      jest.spyOn(prismaService.offer, 'findUnique').mockResolvedValue(null);

      await expect(service.getOfferById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateOffer', () => {
    it('should update an offer owned by the user', async () => {
      const userId = 'user-123';
      const offerId = 'offer-123';

      const updateDto = createMockOffer({
        title: 'Updated Title',
        description: 'Updated description',
        budget: 20000,
        deadline: new Date('2025-12-31'),
        location: 'Paris, France',
      });

      const mockOfferWithRelations = createMockOfferWithRelations();

      const updatedOffer = createMockOffer({
        id: offerId,
        title: 'Updated Title',
        description: 'Updated description',
        budget: 20000,
        location: 'Paris, France',
        deadline: new Date('2025-12-31'),
      });

      jest
        .spyOn(prismaService.offer, 'findUnique')
        .mockResolvedValueOnce(mockOfferWithRelations);
      jest
        .spyOn(prismaService.offer, 'update')
        .mockResolvedValueOnce(updatedOffer);

      const result = await service.updateOffer(userId, offerId, updateDto);

      expect(result).toEqual(updatedOffer);
    });

    it('should throw ForbiddenException if user does not own the offer', async () => {
      const userId = 'other-user-123';
      const offerId = 'offer-123';
      const updateDto = createMockOffer();

      const mockOfferWithRelations = createMockOfferWithRelations();

      jest
        .spyOn(prismaService.offer, 'findUnique')
        .mockResolvedValueOnce(mockOfferWithRelations);

      await expect(
        service.updateOffer(userId, offerId, updateDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteOffer', () => {
    it('should delete an offer owned by the user', async () => {
      const userId = 'user-123';
      const offerId = 'offer-123';

      const mockCompany = createMockCompany();

      const mockOfferWithRelations = createMockOfferWithRelations();

      const mockOffers = createMockOfferList(1);

      jest
        .spyOn(prismaService.offer, 'findUnique')
        .mockResolvedValueOnce(mockOfferWithRelations);
      jest
        .spyOn(prismaService.offer, 'delete')
        .mockResolvedValueOnce(mockOfferWithRelations);
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValueOnce(mockCompany);
      jest
        .spyOn(prismaService.offer, 'findMany')
        .mockResolvedValueOnce(mockOffers);

      const result = await service.deleteOffer(userId, offerId);

      expect(result).toEqual(mockOffers);
    });

    it('should throw NotFoundException if offer does not exist', async () => {
      const userId = 'user-123';
      const offerId = 'nonexistent-offer';

      jest.spyOn(prismaService.offer, 'findUnique').mockResolvedValue(null);

      await expect(service.deleteOffer(userId, offerId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException if user does not own the offer', async () => {
      const userId = 'other-user-123';
      const offerId = 'offer-123';

      const mockOfferWithRelations = createMockOfferWithRelations();

      jest
        .spyOn(prismaService.offer, 'findUnique')
        .mockResolvedValueOnce(mockOfferWithRelations);

      await expect(service.deleteOffer(userId, offerId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
