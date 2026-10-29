import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { ExtractionService } from './extraction.service';
import { ApiResponse } from 'src/types/global';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/decorators/role';
import { CurrentUser } from 'src/decorators/current-user';
import {
  CreateExtractionDto,
  ListExtractionsQueryDto,
  ReviewExtractionDto,
} from 'src/dtos/extraction.dto';
import { ExtractionWithDetails } from 'src/types/carbon.types';

@ApiTags('Extractions')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RoleGuard)
@Role('CONSULTANT')
@Controller('extractions')
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Post()
  @ApiOperation({ summary: 'Register an AI extraction read from a document' })
  @SwaggerResponse({ status: 201, description: 'Extraction created' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the document owner' })
  @SwaggerResponse({
    status: 404,
    description: 'Document, factor or category not found',
  })
  async createExtraction(
    @CurrentUser() user: Express.User,
    @Body() body: CreateExtractionDto,
  ): Promise<ApiResponse<ExtractionWithDetails>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const created = await this.extractionService.createExtraction(
      user.id,
      body,
    );

    return {
      success: true,
      data: created,
      message: 'Extraction created successfully',
    };
  }

  @Get()
  @ApiOperation({
    summary: 'List extractions of a document (filter by status)',
  })
  @SwaggerResponse({ status: 200, description: 'Extractions retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the document owner' })
  @SwaggerResponse({ status: 404, description: 'Document not found' })
  async listExtractions(
    @CurrentUser() user: Express.User,
    @Query() query: ListExtractionsQueryDto,
  ): Promise<ApiResponse<ExtractionWithDetails[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const extractions = await this.extractionService.listExtractions(
      user.id,
      query,
    );

    return {
      success: true,
      data: extractions,
      message: 'Extractions retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an extraction by ID' })
  @ApiParam({ name: 'id', description: 'Extraction UUID' })
  @SwaggerResponse({ status: 200, description: 'Extraction retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the extraction owner' })
  @SwaggerResponse({ status: 404, description: 'Extraction not found' })
  async getExtractionById(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<ExtractionWithDetails>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const found = await this.extractionService.getExtractionById(id, user.id);

    return {
      success: true,
      data: found,
      message: 'Extraction retrieved successfully',
    };
  }

  @Patch(':id/review')
  @ApiOperation({
    summary:
      'Review an extraction: ACCEPTED / CORRECTED create an activity line in the given assessment, REJECTED discards it',
  })
  @ApiParam({ name: 'id', description: 'Extraction UUID' })
  @SwaggerResponse({ status: 200, description: 'Extraction reviewed' })
  @SwaggerResponse({
    status: 400,
    description: 'Missing values, unit mismatch or wrong assessment',
  })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the extraction owner' })
  @SwaggerResponse({ status: 404, description: 'Extraction not found' })
  @SwaggerResponse({
    status: 409,
    description: 'Already reviewed or assessment not DRAFT',
  })
  async reviewExtraction(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ReviewExtractionDto,
  ): Promise<ApiResponse<ExtractionWithDetails>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const reviewed = await this.extractionService.reviewExtraction(
      user.id,
      id,
      body,
    );

    return {
      success: true,
      data: reviewed,
      message: 'Extraction reviewed successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an extraction not used by any line' })
  @ApiParam({ name: 'id', description: 'Extraction UUID' })
  @SwaggerResponse({ status: 200, description: 'Extraction deleted' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the extraction owner' })
  @SwaggerResponse({ status: 404, description: 'Extraction not found' })
  @SwaggerResponse({
    status: 409,
    description: 'Extraction used by an activity line',
  })
  async deleteExtraction(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<ExtractionWithDetails[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const extractions = await this.extractionService.deleteExtraction(
      user.id,
      id,
    );

    return {
      success: true,
      data: extractions,
      message: 'Extraction deleted successfully',
    };
  }
}
