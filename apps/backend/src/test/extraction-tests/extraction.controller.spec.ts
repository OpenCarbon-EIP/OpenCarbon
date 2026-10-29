import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ExtractionController } from 'src/extraction/extraction.controller';
import { ExtractionService } from 'src/extraction/extraction.service';
import {
  CreateExtractionDto,
  ReviewExtractionDto,
} from 'src/dtos/extraction.dto';
import {
  createMockExtraction,
  createMockUserConsultant,
} from 'src/utils/mock-creator';

describe('ExtractionController', () => {
  let controller: ExtractionController;
  const extractionService = {
    createExtraction: jest.fn(),
    listExtractions: jest.fn(),
    getExtractionById: jest.fn(),
    reviewExtraction: jest.fn(),
    deleteExtraction: jest.fn(),
  };
  const user = createMockUserConsultant();
  const anonymous = undefined as unknown as Express.User;
  const createDto: CreateExtractionDto = {
    id_document: 'document-123',
    raw_values: { designation: 'GNR' },
    confidence: 0.92,
  };
  const reviewDto: ReviewExtractionDto = { status: 'REJECTED' };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExtractionController],
      providers: [{ provide: ExtractionService, useValue: extractionService }],
    }).compile();

    controller = module.get<ExtractionController>(ExtractionController);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('POST /extractions', () => {
    it('should create an extraction', async () => {
      const mockExtraction = createMockExtraction();
      extractionService.createExtraction.mockResolvedValueOnce(mockExtraction);

      const result = await controller.createExtraction(user, createDto);

      expect(extractionService.createExtraction).toHaveBeenCalledWith(
        user.id,
        createDto,
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockExtraction);
      expect(result.message).toContain('Extraction created successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.createExtraction(anonymous, createDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('GET /extractions', () => {
    it('should list the extractions of a document', async () => {
      const query = {
        id_document: 'document-123',
        status: 'PROPOSED' as const,
      };
      extractionService.listExtractions.mockResolvedValueOnce([
        createMockExtraction(),
      ]);

      const result = await controller.listExtractions(user, query);

      expect(extractionService.listExtractions).toHaveBeenCalledWith(
        user.id,
        query,
      );
      expect(result.data).toHaveLength(1);
      expect(result.message).toContain('Extractions retrieved successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.listExtractions(anonymous, { id_document: 'document-123' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('GET /extractions/:id', () => {
    it('should return an extraction', async () => {
      const mockExtraction = createMockExtraction();
      extractionService.getExtractionById.mockResolvedValueOnce(mockExtraction);

      const result = await controller.getExtractionById(user, 'extraction-123');

      expect(extractionService.getExtractionById).toHaveBeenCalledWith(
        'extraction-123',
        user.id,
      );
      expect(result.data).toEqual(mockExtraction);
      expect(result.message).toContain('Extraction retrieved successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.getExtractionById(anonymous, 'extraction-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('PATCH /extractions/:id/review', () => {
    it('should review an extraction', async () => {
      extractionService.reviewExtraction.mockResolvedValueOnce(
        createMockExtraction({ status: 'REJECTED' }),
      );

      const result = await controller.reviewExtraction(
        user,
        'extraction-123',
        reviewDto,
      );

      expect(extractionService.reviewExtraction).toHaveBeenCalledWith(
        user.id,
        'extraction-123',
        reviewDto,
      );
      expect(result.data.status).toBe('REJECTED');
      expect(result.message).toContain('Extraction reviewed successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.reviewExtraction(anonymous, 'extraction-123', reviewDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('DELETE /extractions/:id', () => {
    it('should delete an extraction', async () => {
      extractionService.deleteExtraction.mockResolvedValueOnce([]);

      const result = await controller.deleteExtraction(user, 'extraction-123');

      expect(extractionService.deleteExtraction).toHaveBeenCalledWith(
        user.id,
        'extraction-123',
      );
      expect(result.data).toEqual([]);
      expect(result.message).toContain('Extraction deleted successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.deleteExtraction(anonymous, 'extraction-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
