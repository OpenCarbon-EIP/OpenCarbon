import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ExtractionService } from 'src/extraction/extraction.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConsultantService } from 'src/consultant/consultant.service';
import { DocumentService } from 'src/document/document.service';
import { AssessmentService } from 'src/assessment/assessment.service';
import { ActivityLineService } from 'src/activity-line/activity-line.service';
import { EmissionFactorService } from 'src/emission-factor/emission-factor.service';
import { EmissionCategoryService } from 'src/emission-category/emission-category.service';
import type { client, extraction } from 'src/generated/prisma/client';
import {
  createMockAssessmentWithOwner,
  createMockConsultant,
  createMockDocumentWithOwner,
  createMockExtraction,
} from 'src/utils/mock-creator';
import { createPrismaMock, PrismaMock } from '../helpers/prisma-mock';

const createMockExtractionWithOwner = (
  overrides?: Partial<extraction>,
  clientOverrides?: Partial<client>,
) => ({
  ...createMockExtraction(overrides),
  document: createMockDocumentWithOwner({}, clientOverrides),
});

const PREPARED_LINE = { label: 'Gazole non routier', result_kgco2e: 3170 };

describe('ExtractionService', () => {
  let service: ExtractionService;
  let prisma: PrismaMock;
  const consultantService = { getConsultantByUserIdOrThrow: jest.fn() };
  const documentService = { getOwnedDocument: jest.fn() };
  const assessmentService = {
    getOwnedAssessment: jest.fn(),
    assertDraft: jest.fn(),
  };
  const activityLineService = {
    prepareLine: jest.fn(),
    recomputeTotals: jest.fn(),
  };
  const emissionFactorService = { getUsableFactor: jest.fn() };
  const emissionCategoryService = { getCategoryById: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    consultantService.getConsultantByUserIdOrThrow.mockResolvedValue(
      createMockConsultant(),
    );
    documentService.getOwnedDocument.mockResolvedValue(
      createMockDocumentWithOwner(),
    );
    assessmentService.getOwnedAssessment.mockResolvedValue(
      createMockAssessmentWithOwner(),
    );
    assessmentService.assertDraft.mockImplementation(() => undefined);
    activityLineService.prepareLine.mockResolvedValue(PREPARED_LINE);
    prisma.extraction.findUnique.mockResolvedValue(
      createMockExtractionWithOwner(),
    );
    prisma.extraction.updateMany.mockResolvedValue({ count: 1 });
    prisma.extraction.findUniqueOrThrow.mockResolvedValue(
      createMockExtraction({ status: 'ACCEPTED' }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtractionService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConsultantService, useValue: consultantService },
        { provide: DocumentService, useValue: documentService },
        { provide: AssessmentService, useValue: assessmentService },
        { provide: ActivityLineService, useValue: activityLineService },
        { provide: EmissionFactorService, useValue: emissionFactorService },
        { provide: EmissionCategoryService, useValue: emissionCategoryService },
      ],
    }).compile();

    service = module.get<ExtractionService>(ExtractionService);
  });

  describe('createExtraction', () => {
    it('should validate the proposals and create the extraction', async () => {
      prisma.extraction.create.mockResolvedValue(createMockExtraction());

      await service.createExtraction('user-123', {
        id_document: 'document-123',
        raw_values: { designation: 'GNR' },
        confidence: 0.92,
        id_proposed_factor: 'factor-123',
        id_proposed_category: 'category-123',
      });

      expect(documentService.getOwnedDocument).toHaveBeenCalledWith(
        'document-123',
        'consul-123',
      );
      expect(emissionFactorService.getUsableFactor).toHaveBeenCalledWith(
        'factor-123',
        'consul-123',
      );
      expect(emissionCategoryService.getCategoryById).toHaveBeenCalledWith(
        'category-123',
      );
      expect(prisma.extraction.create).toHaveBeenCalled();
    });

    it('should refuse a proposed factor the consultant cannot use', async () => {
      emissionFactorService.getUsableFactor.mockRejectedValueOnce(
        new ForbiddenException(),
      );

      await expect(
        service.createExtraction('user-123', {
          id_document: 'document-123',
          raw_values: {},
          confidence: 0.5,
          id_proposed_factor: 'factor-of-someone-else',
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.extraction.create).not.toHaveBeenCalled();
    });
  });

  describe('listExtractions', () => {
    it('should list the extractions of an owned document', async () => {
      prisma.extraction.findMany.mockResolvedValue([createMockExtraction()]);

      await service.listExtractions('user-123', {
        id_document: 'document-123',
        status: 'PROPOSED',
      });

      expect(prisma.extraction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id_document: 'document-123', status: 'PROPOSED' },
        }),
      );
    });
  });

  describe('getExtractionById', () => {
    it('should return an owned extraction', async () => {
      await expect(
        service.getExtractionById('extraction-123', 'user-123'),
      ).resolves.toEqual(createMockExtraction({ status: 'ACCEPTED' }));
    });

    it('should throw NotFoundException when the extraction does not exist', async () => {
      prisma.extraction.findUnique.mockResolvedValue(null);

      await expect(
        service.getExtractionById('extraction-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for an extraction of another consultant', async () => {
      prisma.extraction.findUnique.mockResolvedValue(
        createMockExtractionWithOwner({}, { id_consultant: 'other' }),
      );

      await expect(
        service.getExtractionById('extraction-123', 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('reviewExtraction', () => {
    it('should refuse an extraction that was already reviewed', async () => {
      prisma.extraction.findUnique.mockResolvedValue(
        createMockExtractionWithOwner({ status: 'ACCEPTED' }),
      );

      await expect(
        service.reviewExtraction('user-123', 'extraction-123', {
          status: 'REJECTED',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject an extraction with the comment', async () => {
      await service.reviewExtraction('user-123', 'extraction-123', {
        status: 'REJECTED',
        comment: 'Doublon',
      });

      expect(prisma.extraction.updateMany).toHaveBeenCalledWith({
        where: { id: 'extraction-123', status: 'PROPOSED' },
        data: {
          status: 'REJECTED',
          reviewed_at: expect.any(Date),
          correction: { comment: 'Doublon' },
        },
      });
      expect(prisma.activity_line.create).not.toHaveBeenCalled();
    });

    it('should not reject an extraction accepted concurrently', async () => {
      prisma.extraction.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.reviewExtraction('user-123', 'extraction-123', {
          status: 'REJECTED',
        }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.extraction.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it('should accept an extraction and create the AI activity line', async () => {
      await service.reviewExtraction('user-123', 'extraction-123', {
        status: 'ACCEPTED',
        id_assessment: 'assessment-123',
        data_origin: 'MEASURED',
      });

      expect(activityLineService.prepareLine).toHaveBeenCalledWith(
        'consul-123',
        expect.objectContaining({
          label: 'Gazole non routier',
          input_unit: 'LITRE',
          id_emission_factor: 'factor-123',
          id_category: 'category-123',
        }),
      );
      expect(prisma.activity_line.create).toHaveBeenCalledWith({
        data: {
          ...PREPARED_LINE,
          id_assessment: 'assessment-123',
          id_extraction: 'extraction-123',
          entry_mode: 'AI_EXTRACTED',
        },
      });
      expect(activityLineService.recomputeTotals).toHaveBeenCalledWith(
        prisma,
        'assessment-123',
      );
    });

    it('should store the correction when values are corrected', async () => {
      await service.reviewExtraction('user-123', 'extraction-123', {
        status: 'CORRECTED',
        id_assessment: 'assessment-123',
        data_origin: 'MEASURED',
        quantity: 1200,
      });

      expect(prisma.extraction.updateMany).toHaveBeenCalledWith({
        where: { id: 'extraction-123', status: 'PROPOSED' },
        data: {
          status: 'CORRECTED',
          reviewed_at: expect.any(Date),
          correction: { quantity: { from: '1000', to: '1200' } },
        },
      });
    });

    it('should require CORRECTED when values differ from the proposal', async () => {
      await expect(
        service.reviewExtraction('user-123', 'extraction-123', {
          status: 'ACCEPTED',
          id_assessment: 'assessment-123',
          data_origin: 'MEASURED',
          quantity: 1200,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should require ACCEPTED when nothing was corrected', async () => {
      await expect(
        service.reviewExtraction('user-123', 'extraction-123', {
          status: 'CORRECTED',
          id_assessment: 'assessment-123',
          data_origin: 'MEASURED',
          quantity: 1000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should refuse an assessment from another worksite', async () => {
      assessmentService.getOwnedAssessment.mockResolvedValue(
        createMockAssessmentWithOwner({ id_worksite: 'other-worksite' }),
      );

      await expect(
        service.reviewExtraction('user-123', 'extraction-123', {
          status: 'ACCEPTED',
          id_assessment: 'assessment-123',
          data_origin: 'MEASURED',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should list the missing values needed to create the line', async () => {
      prisma.extraction.findUnique.mockResolvedValue(
        createMockExtractionWithOwner({
          quantity: null,
          id_proposed_factor: null,
        }),
      );

      await expect(
        service.reviewExtraction('user-123', 'extraction-123', {
          status: 'ACCEPTED',
          id_assessment: 'assessment-123',
          data_origin: 'MEASURED',
        }),
      ).rejects.toThrow('quantity, id_emission_factor');
    });

    it('should not create a line when another review won the race', async () => {
      prisma.extraction.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.reviewExtraction('user-123', 'extraction-123', {
          status: 'ACCEPTED',
          id_assessment: 'assessment-123',
          data_origin: 'MEASURED',
        }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.activity_line.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteExtraction', () => {
    it('should delete an extraction not used by any line', async () => {
      prisma.activity_line.findUnique.mockResolvedValue(null);
      prisma.extraction.findMany.mockResolvedValue([]);

      const result = await service.deleteExtraction(
        'user-123',
        'extraction-123',
      );

      expect(prisma.extraction.delete).toHaveBeenCalledWith({
        where: { id: 'extraction-123' },
      });
      expect(result).toEqual([]);
    });

    it('should refuse to delete an extraction used by a line', async () => {
      prisma.activity_line.findUnique.mockResolvedValue({ id: 'line-123' });

      await expect(
        service.deleteExtraction('user-123', 'extraction-123'),
      ).rejects.toThrow(ConflictException);
      expect(prisma.extraction.delete).not.toHaveBeenCalled();
    });
  });
});
