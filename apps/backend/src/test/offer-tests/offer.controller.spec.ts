import { Test, TestingModule } from '@nestjs/testing';
import { OfferController } from '../../offer/offer.controller';
import { OfferService } from '../../offer/offer.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import {
  createMockUserCompany,
  createMockOffer,
  createMockOfferWithRelations,
  createMockOfferWithRelationsList,
  createMockUserConsultant,
} from 'src/utils/mock-creator';

describe('OfferController', () => {
  let controller: OfferController;
  let offerService: OfferService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OfferController],
      providers: [
        {
          provide: OfferService,
          useValue: {
            createOffer: jest.fn(),
            listOffers: jest.fn(),
            listMyOffers: jest.fn(),
            getOfferById: jest.fn(),
            updateOffer: jest.fn(),
            deleteOffer: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OfferController>(OfferController);
    offerService = module.get<OfferService>(OfferService);
  });

  describe('POST /offers/create', () => {
    it('should create a new offer', async () => {
      const user = createMockUserCompany();
      const createDto = createMockOffer();

      const mockOffer = createMockOffer();

      jest.spyOn(offerService, 'createOffer').mockResolvedValueOnce(mockOffer);

      const result = await controller.createOffer(user, createDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOffer);
      expect(result.message).toContain('Offer created successfully');
    });

    it('should throw error if user is not authenticated', async () => {
      const createDto = createMockOffer();

      await expect(
        controller.createOffer(undefined as unknown as Express.User, createDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('GET /offers/list', () => {
    it('should return all offers', async () => {
      const mockOffers = createMockOfferWithRelationsList(2);

      const mockUser = createMockUserConsultant();

      jest.spyOn(offerService, 'listOffers').mockResolvedValueOnce(mockOffers);

      const result = await controller.listOffers(mockUser);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOffers);
      expect(result.message).toContain('Offers retrieved successfully');
    });

    it('should return empty array if no offers exist', async () => {
      const mockUser = createMockUserCompany();

      jest.spyOn(offerService, 'listOffers').mockResolvedValueOnce([]);

      const result = await controller.listOffers(mockUser);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.message).toContain('Offers retrieved successfully');
    });

    it('should throw error if user is not authenticated', async () => {
      jest
        .spyOn(offerService, 'listOffers')
        .mockRejectedValueOnce(
          new BadRequestException('User not authenticated'),
        );

      await expect(
        controller.listOffers(undefined as unknown as Express.User),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('GET /offers/my-offers', () => {
    it('should return offers for authenticated user', async () => {
      const mockUser = createMockUserCompany();

      const mockOffers = createMockOfferWithRelationsList(2);

      jest
        .spyOn(offerService, 'listMyOffers')
        .mockResolvedValueOnce(mockOffers);

      const result = await controller.listMyOffers(mockUser);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOffers);
      expect(result.message).toContain('My offers retrieved successfully');
    });

    it('should throw error if user is not authenticated', async () => {
      jest
        .spyOn(offerService, 'listMyOffers')
        .mockRejectedValueOnce(
          new BadRequestException('User not authenticated'),
        );

      await expect(
        controller.listMyOffers(undefined as unknown as Express.User),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('GET /offers/:id', () => {
    it('should return an offer by id', async () => {
      const offerId = 'offer-123';

      const mockUser = createMockUserCompany();

      const mockOffer = createMockOfferWithRelations();

      jest.spyOn(offerService, 'getOfferById').mockResolvedValueOnce(mockOffer);

      const result = await controller.getOfferById(mockUser, offerId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOffer);
      expect(result.message).toContain('Offer retrieved successfully');
    });

    it('should throw error if user is not authenticated', async () => {
      const offerId = 'offer-123';

      await expect(
        controller.getOfferById(undefined as unknown as Express.User, offerId),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('PUT /offers/:id/update', () => {
    it('should update an offer', async () => {
      const offerId = 'offer-123';

      const mockUser = createMockUserCompany();

      const updateDto = createMockOffer({
        title: 'Updated Title',
        budget: 20000,
      });

      const updatedOffer = createMockOfferWithRelations({
        id: offerId,
        title: 'Updated Title',
        budget: 20000,
      });

      jest
        .spyOn(offerService, 'updateOffer')
        .mockResolvedValueOnce(updatedOffer);

      const result = await controller.updateOffer(mockUser, offerId, updateDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedOffer);
      expect(result.message).toContain('Offer updated successfully');
    });

    it('should throw error if user is not authenticated', async () => {
      const offerId = 'offer-123';
      const updateDto = createMockOffer();

      await expect(
        controller.updateOffer(
          undefined as unknown as Express.User,
          offerId,
          updateDto,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('DELETE /offers/:id/delete', () => {
    it('should delete an offer', async () => {
      const offerId = 'offer-123';
      const mockOffers = createMockOfferWithRelationsList(1);

      const mockUser = createMockUserCompany();

      jest.spyOn(offerService, 'deleteOffer').mockResolvedValueOnce(mockOffers);

      const result = await controller.deleteOffer(mockUser, offerId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOffers);
      expect(result.message).toContain('Offer deleted successfully');
    });

    it('should throw error if user is not authenticated', async () => {
      const offerId = 'offer-123';

      await expect(
        controller.deleteOffer(undefined as unknown as Express.User, offerId),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
