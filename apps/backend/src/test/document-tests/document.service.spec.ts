import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DocumentService } from 'src/document/document.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConsultantService } from 'src/consultant/consultant.service';
import { WorksiteService } from 'src/worksite/worksite.service';
import { CreateDocumentDto } from 'src/dtos/document.dto';
import {
  createMockConsultant,
  createMockDocument,
  createMockDocumentWithOwner,
  createMockWorksiteWithClient,
} from 'src/utils/mock-creator';
import { createPrismaMock, PrismaMock } from '../helpers/prisma-mock';

describe('DocumentService', () => {
  let service: DocumentService;
  let prisma: PrismaMock;
  const consultantService = { getConsultantByUserIdOrThrow: jest.fn() };
  const worksiteService = { getOwnedWorksite: jest.fn() };
  const createDto: CreateDocumentDto = {
    id_worksite: 'worksite-123',
    file_name: 'facture.pdf',
    storage_url: 'https://storage.example.com/facture.pdf',
    mime_type: 'application/pdf',
    size_bytes: 1024,
    sha256: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    consultantService.getConsultantByUserIdOrThrow.mockResolvedValue(
      createMockConsultant(),
    );
    worksiteService.getOwnedWorksite.mockResolvedValue(
      createMockWorksiteWithClient(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConsultantService, useValue: consultantService },
        { provide: WorksiteService, useValue: worksiteService },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
  });

  describe('createDocument', () => {
    it('should create a document with a lowercased hash', async () => {
      prisma.document.findUnique.mockResolvedValue(null);
      prisma.document.create.mockResolvedValue(createMockDocument());

      await service.createDocument('user-123', createDto);

      expect(prisma.document.create).toHaveBeenCalledWith({
        data: { ...createDto, sha256: createDto.sha256.toLowerCase() },
      });
    });

    it('should refuse a file already uploaded to the worksite', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: 'document-123',
        file_name: 'facture.pdf',
      });

      await expect(
        service.createDocument('user-123', createDto),
      ).rejects.toThrow(ConflictException);
      expect(prisma.document.create).not.toHaveBeenCalled();
    });

    it('should propagate the worksite ownership error', async () => {
      worksiteService.getOwnedWorksite.mockRejectedValueOnce(
        new ForbiddenException(),
      );

      await expect(
        service.createDocument('user-123', createDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listDocuments', () => {
    it('should list the documents of an owned worksite', async () => {
      prisma.document.findMany.mockResolvedValue([createMockDocument()]);

      const result = await service.listDocuments('user-123', 'worksite-123');

      expect(worksiteService.getOwnedWorksite).toHaveBeenCalledWith(
        'worksite-123',
        'consul-123',
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getDocumentById / getOwnedDocument', () => {
    it('should return an owned document', async () => {
      prisma.document.findUnique.mockResolvedValue(
        createMockDocumentWithOwner(),
      );
      prisma.document.findUniqueOrThrow.mockResolvedValue(createMockDocument());

      await expect(
        service.getDocumentById('document-123', 'user-123'),
      ).resolves.toEqual(createMockDocument());
    });

    it('should throw NotFoundException when the document does not exist', async () => {
      prisma.document.findUnique.mockResolvedValue(null);

      await expect(
        service.getOwnedDocument('document-123', 'consul-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for a document of another consultant', async () => {
      prisma.document.findUnique.mockResolvedValue(
        createMockDocumentWithOwner({}, { id_consultant: 'other' }),
      );

      await expect(
        service.getOwnedDocument('document-123', 'consul-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateDocument', () => {
    it('should update an owned document', async () => {
      prisma.document.findUnique.mockResolvedValue(
        createMockDocumentWithOwner(),
      );
      prisma.document.update.mockResolvedValue(
        createMockDocument({ detected_type: 'DELIVERY_NOTE' }),
      );

      const result = await service.updateDocument('user-123', 'document-123', {
        detected_type: 'DELIVERY_NOTE',
      });

      expect(result.detected_type).toBe('DELIVERY_NOTE');
    });
  });

  describe('deleteDocument', () => {
    it('should delete an owned document and return the remaining ones', async () => {
      prisma.document.findUnique.mockResolvedValue(
        createMockDocumentWithOwner(),
      );
      prisma.document.findMany.mockResolvedValue([]);

      const result = await service.deleteDocument('user-123', 'document-123');

      expect(prisma.document.delete).toHaveBeenCalledWith({
        where: { id: 'document-123' },
      });
      expect(result).toEqual([]);
    });

    it('should not delete a document of another consultant', async () => {
      prisma.document.findUnique.mockResolvedValue(
        createMockDocumentWithOwner({}, { id_consultant: 'other' }),
      );

      await expect(
        service.deleteDocument('user-123', 'document-123'),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.document.delete).not.toHaveBeenCalled();
    });
  });
});
