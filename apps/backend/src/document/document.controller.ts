import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse as SwaggerResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { ApiResponse } from 'src/types/global';
import type { document } from 'src/generated/prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/decorators/role';
import { CurrentUser } from 'src/decorators/current-user';
import {
  CreateDocumentDto,
  ListDocumentsQueryDto,
  UpdateDocumentDto,
} from 'src/dtos/document.dto';
import { DocumentWithDetails } from 'src/types/carbon.types';

@ApiTags('Documents')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RoleGuard)
@Role('CONSULTANT')
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @ApiOperation({
    summary: 'Register an uploaded document on one of your worksites',
  })
  @SwaggerResponse({ status: 201, description: 'Document created' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the worksite owner' })
  @SwaggerResponse({ status: 404, description: 'Worksite not found' })
  @SwaggerResponse({
    status: 409,
    description: 'Same file already uploaded to this worksite',
  })
  async createDocument(
    @CurrentUser() user: Express.User,
    @Body() body: CreateDocumentDto,
  ): Promise<ApiResponse<document>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const created = await this.documentService.createDocument(user.id, body);

    return {
      success: true,
      data: created,
      message: 'Document created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List documents of a worksite' })
  @SwaggerResponse({ status: 200, description: 'Documents retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the worksite owner' })
  @SwaggerResponse({ status: 404, description: 'Worksite not found' })
  async listDocuments(
    @CurrentUser() user: Express.User,
    @Query() query: ListDocumentsQueryDto,
  ): Promise<ApiResponse<document[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const documents = await this.documentService.listDocuments(
      user.id,
      query.id_worksite,
    );

    return {
      success: true,
      data: documents,
      message: 'Documents retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document with its extractions' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @SwaggerResponse({ status: 200, description: 'Document retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the document owner' })
  @SwaggerResponse({ status: 404, description: 'Document not found' })
  async getDocumentById(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<DocumentWithDetails>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const found = await this.documentService.getDocumentById(id, user.id);

    return {
      success: true,
      data: found,
      message: 'Document retrieved successfully',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Rename or reclassify a document (owner only)' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @SwaggerResponse({ status: 200, description: 'Document updated' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the document owner' })
  @SwaggerResponse({ status: 404, description: 'Document not found' })
  async updateDocument(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateDocumentDto,
  ): Promise<ApiResponse<document>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const updated = await this.documentService.updateDocument(
      user.id,
      id,
      body,
    );

    return {
      success: true,
      data: updated,
      message: 'Document updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a document and its extractions (owner only)',
  })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @SwaggerResponse({ status: 200, description: 'Document deleted' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the document owner' })
  @SwaggerResponse({ status: 404, description: 'Document not found' })
  async deleteDocument(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<document[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const documents = await this.documentService.deleteDocument(user.id, id);

    return {
      success: true,
      data: documents,
      message: 'Document deleted successfully',
    };
  }
}
