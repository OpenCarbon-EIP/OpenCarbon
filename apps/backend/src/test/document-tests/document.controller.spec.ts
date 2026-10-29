import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { DocumentController } from 'src/document/document.controller';
import { DocumentService } from 'src/document/document.service';
import { CreateDocumentDto } from 'src/dtos/document.dto';
import {
  createMockDocument,
  createMockUserConsultant,
} from 'src/utils/mock-creator';

describe('DocumentController', () => {
  let controller: DocumentController;
  const documentService = {
    createDocument: jest.fn(),
    listDocuments: jest.fn(),
    getDocumentById: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
  };
  const user = createMockUserConsultant();
  const anonymous = undefined as unknown as Express.User;
  const createDto: CreateDocumentDto = {
    id_worksite: 'worksite-123',
    file_name: 'facture.pdf',
    storage_url: 'https://storage.example.com/facture.pdf',
    mime_type: 'application/pdf',
    size_bytes: 1024,
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [{ provide: DocumentService, useValue: documentService }],
    }).compile();

    controller = module.get<DocumentController>(DocumentController);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('POST /documents', () => {
    it('should create a document', async () => {
      const mockDocument = createMockDocument();
      documentService.createDocument.mockResolvedValueOnce(mockDocument);

      const result = await controller.createDocument(user, createDto);

      expect(documentService.createDocument).toHaveBeenCalledWith(
        user.id,
        createDto,
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDocument);
      expect(result.message).toContain('Document created successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.createDocument(anonymous, createDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('GET /documents', () => {
    it('should list the documents of a worksite', async () => {
      documentService.listDocuments.mockResolvedValueOnce([
        createMockDocument(),
      ]);

      const result = await controller.listDocuments(user, {
        id_worksite: 'worksite-123',
      });

      expect(documentService.listDocuments).toHaveBeenCalledWith(
        user.id,
        'worksite-123',
      );
      expect(result.data).toHaveLength(1);
      expect(result.message).toContain('Documents retrieved successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.listDocuments(anonymous, { id_worksite: 'worksite-123' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('GET /documents/:id', () => {
    it('should return a document', async () => {
      const mockDocument = { ...createMockDocument(), extractions: [] };
      documentService.getDocumentById.mockResolvedValueOnce(mockDocument);

      const result = await controller.getDocumentById(user, 'document-123');

      expect(documentService.getDocumentById).toHaveBeenCalledWith(
        'document-123',
        user.id,
      );
      expect(result.data).toEqual(mockDocument);
      expect(result.message).toContain('Document retrieved successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.getDocumentById(anonymous, 'document-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('PUT /documents/:id', () => {
    it('should update a document', async () => {
      const body = { detected_type: 'DELIVERY_NOTE' as const };
      documentService.updateDocument.mockResolvedValueOnce(
        createMockDocument(body),
      );

      const result = await controller.updateDocument(
        user,
        'document-123',
        body,
      );

      expect(documentService.updateDocument).toHaveBeenCalledWith(
        user.id,
        'document-123',
        body,
      );
      expect(result.message).toContain('Document updated successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.updateDocument(anonymous, 'document-123', {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('DELETE /documents/:id', () => {
    it('should delete a document', async () => {
      documentService.deleteDocument.mockResolvedValueOnce([]);

      const result = await controller.deleteDocument(user, 'document-123');

      expect(documentService.deleteDocument).toHaveBeenCalledWith(
        user.id,
        'document-123',
      );
      expect(result.data).toEqual([]);
      expect(result.message).toContain('Document deleted successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.deleteDocument(anonymous, 'document-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
