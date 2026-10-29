import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { document } from 'src/generated/prisma/client';
import { ConsultantService } from 'src/consultant/consultant.service';
import { WorksiteService } from 'src/worksite/worksite.service';
import { CreateDocumentDto, UpdateDocumentDto } from 'src/dtos/document.dto';
import {
  DOCUMENT_DETAIL_INCLUDE,
  DocumentWithDetails,
  DocumentWithOwner,
} from 'src/types/carbon.types';
import { isUniqueConstraintViolation } from 'src/utils/prisma-errors';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly consultantService: ConsultantService,
    private readonly worksiteService: WorksiteService,
  ) {}

  async createDocument(
    userId: string,
    body: CreateDocumentDto,
  ): Promise<document> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    await this.worksiteService.getOwnedWorksite(
      body.id_worksite,
      consultant.id,
    );

    const sha256 = body.sha256.toLowerCase();

    const duplicate = await this.prisma.document.findUnique({
      where: { id_worksite_sha256: { id_worksite: body.id_worksite, sha256 } },
      select: { id: true, file_name: true },
    });

    if (duplicate) {
      throw new ConflictException(
        `This file has already been uploaded to this worksite as "${duplicate.file_name}" (${duplicate.id})`,
      );
    }

    let created: document;
    try {
      created = await this.prisma.document.create({
        data: { ...body, sha256 },
      });
    } catch (error) {
      // A concurrent upload of the same file can pass the check above; the unique index still blocks it.
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(
          'This file has already been uploaded to this worksite',
        );
      }
      throw error;
    }

    this.logger.log(
      `Document ${created.id} ("${created.file_name}", ${created.size_bytes} bytes) added to worksite ${body.id_worksite} by consultant ${consultant.id}`,
    );

    return created;
  }

  async listDocuments(userId: string, worksiteId: string): Promise<document[]> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    await this.worksiteService.getOwnedWorksite(worksiteId, consultant.id);

    return await this.prisma.document.findMany({
      where: { id_worksite: worksiteId },
      orderBy: { uploaded_at: 'desc' },
    });
  }

  async getDocumentById(
    id: string,
    userId: string,
  ): Promise<DocumentWithDetails> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    await this.getOwnedDocument(id, consultant.id);

    return await this.prisma.document.findUniqueOrThrow({
      where: { id },
      include: DOCUMENT_DETAIL_INCLUDE,
    });
  }

  async getOwnedDocument(
    id: string,
    consultantId: string,
  ): Promise<DocumentWithOwner> {
    const found = await this.prisma.document.findUnique({
      where: { id },
      include: { worksite: { include: { client: true } } },
    });

    if (!found) {
      throw new NotFoundException('Document not found');
    }

    if (found.worksite.client.id_consultant !== consultantId) {
      throw new ForbiddenException(
        'You do not have permission to access this document',
      );
    }

    return found;
  }

  async updateDocument(
    userId: string,
    id: string,
    body: UpdateDocumentDto,
  ): Promise<document> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    await this.getOwnedDocument(id, consultant.id);

    const updated = await this.prisma.document.update({
      where: { id },
      data: body,
    });

    this.logger.log(`Document ${id} updated by consultant ${consultant.id}`);

    return updated;
  }

  // Activity lines created from its extractions are kept: only their link to the extraction is cleared.
  async deleteDocument(userId: string, id: string): Promise<document[]> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    const existing = await this.getOwnedDocument(id, consultant.id);

    await this.prisma.document.delete({ where: { id } });

    this.logger.log(
      `Document ${id} and its extractions deleted by consultant ${consultant.id}`,
    );

    return this.listDocuments(userId, existing.id_worksite);
  }
}
