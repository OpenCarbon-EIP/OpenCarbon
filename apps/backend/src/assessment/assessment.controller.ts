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
import { AssessmentService } from './assessment.service';
import { ApiResponse } from 'src/types/global';
import type { assessment } from 'src/generated/prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/decorators/role';
import { CurrentUser } from 'src/decorators/current-user';
import {
  CreateAssessmentDto,
  ListAssessmentsQueryDto,
  UpdateAssessmentDto,
  UpdateAssessmentStatusDto,
} from 'src/dtos/assessment.dto';
import { AssessmentWithDetails } from 'src/types/carbon.types';

@ApiTags('Assessments')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RoleGuard)
@Role('CONSULTANT')
@Controller('assessments')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create an assessment on one of your worksites' })
  @SwaggerResponse({ status: 201, description: 'Assessment created' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the worksite owner' })
  @SwaggerResponse({ status: 404, description: 'Worksite not found' })
  async createAssessment(
    @CurrentUser() user: Express.User,
    @Body() body: CreateAssessmentDto,
  ): Promise<ApiResponse<assessment>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const created = await this.assessmentService.createAssessment(
      user.id,
      body,
    );

    return {
      success: true,
      data: created,
      message: 'Assessment created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List assessments (filter by worksite)' })
  @SwaggerResponse({ status: 200, description: 'Assessments retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  async listAssessments(
    @CurrentUser() user: Express.User,
    @Query() query: ListAssessmentsQueryDto,
  ): Promise<ApiResponse<assessment[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const assessments = await this.assessmentService.listAssessments(
      user.id,
      query,
    );

    return {
      success: true,
      data: assessments,
      message: 'Assessments retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get an assessment with its activity lines and reduction actions',
  })
  @ApiParam({ name: 'id', description: 'Assessment UUID' })
  @SwaggerResponse({ status: 200, description: 'Assessment retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the assessment owner' })
  @SwaggerResponse({ status: 404, description: 'Assessment not found' })
  async getAssessmentById(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<AssessmentWithDetails>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const found = await this.assessmentService.getAssessmentById(id, user.id);

    return {
      success: true,
      data: found,
      message: 'Assessment retrieved successfully',
    };
  }

  @Put(':id')
  @ApiOperation({
    summary:
      'Update an assessment. Type and maturity can only change while DRAFT',
  })
  @ApiParam({ name: 'id', description: 'Assessment UUID' })
  @SwaggerResponse({ status: 200, description: 'Assessment updated' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the assessment owner' })
  @SwaggerResponse({ status: 404, description: 'Assessment not found' })
  @SwaggerResponse({ status: 409, description: 'Assessment is locked' })
  async updateAssessment(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAssessmentDto,
  ): Promise<ApiResponse<assessment>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const updated = await this.assessmentService.updateAssessment(
      user.id,
      id,
      body,
    );

    return {
      success: true,
      data: updated,
      message: 'Assessment updated successfully',
    };
  }

  @Patch(':id/status')
  @ApiOperation({
    summary:
      'Change assessment status (DRAFT → VALIDATED → SENT, or VALIDATED → DRAFT)',
  })
  @ApiParam({ name: 'id', description: 'Assessment UUID' })
  @SwaggerResponse({ status: 200, description: 'Status updated' })
  @SwaggerResponse({
    status: 400,
    description: 'Transition not allowed or lines not validated',
  })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the assessment owner' })
  @SwaggerResponse({ status: 404, description: 'Assessment not found' })
  async updateAssessmentStatus(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAssessmentStatusDto,
  ): Promise<ApiResponse<assessment>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const updated = await this.assessmentService.updateAssessmentStatus(
      user.id,
      id,
      body.status,
    );

    return {
      success: true,
      data: updated,
      message: 'Assessment status updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a DRAFT assessment (owner only)' })
  @ApiParam({ name: 'id', description: 'Assessment UUID' })
  @SwaggerResponse({ status: 200, description: 'Assessment deleted' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the assessment owner' })
  @SwaggerResponse({ status: 404, description: 'Assessment not found' })
  @SwaggerResponse({ status: 409, description: 'Assessment is not DRAFT' })
  async deleteAssessment(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<assessment[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const assessments = await this.assessmentService.deleteAssessment(
      user.id,
      id,
    );

    return {
      success: true,
      data: assessments,
      message: 'Assessment deleted successfully',
    };
  }
}
