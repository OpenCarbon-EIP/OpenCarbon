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
import { WorksiteService } from './worksite.service';
import { ApiResponse } from 'src/types/global';
import type { worksite } from 'src/generated/prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/decorators/role';
import { CurrentUser } from 'src/decorators/current-user';
import {
  CreateWorksiteDto,
  ListWorksitesQueryDto,
  UpdateWorksiteDto,
} from 'src/dtos/worksite.dto';
import { WorksiteWithDetails } from 'src/types/carbon.types';

@ApiTags('Worksites')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RoleGuard)
@Role('CONSULTANT')
@Controller('worksites')
export class WorksiteController {
  constructor(private readonly worksiteService: WorksiteService) {}

  @Post()
  @ApiOperation({ summary: 'Create a worksite for one of your clients' })
  @SwaggerResponse({ status: 201, description: 'Worksite created' })
  @SwaggerResponse({ status: 400, description: 'Invalid dates' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({
    status: 403,
    description: 'Client or mission not owned by the consultant',
  })
  @SwaggerResponse({ status: 404, description: 'Client or mission not found' })
  async createWorksite(
    @CurrentUser() user: Express.User,
    @Body() body: CreateWorksiteDto,
  ): Promise<ApiResponse<worksite>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const created = await this.worksiteService.createWorksite(user.id, body);

    return {
      success: true,
      data: created,
      message: 'Worksite created successfully',
    };
  }

  @Get()
  @ApiOperation({
    summary: 'List worksites of the consultant (filter by client or mission)',
  })
  @SwaggerResponse({ status: 200, description: 'Worksites retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  async listWorksites(
    @CurrentUser() user: Express.User,
    @Query() query: ListWorksitesQueryDto,
  ): Promise<ApiResponse<worksite[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const worksites = await this.worksiteService.listWorksites(user.id, query);

    return {
      success: true,
      data: worksites,
      message: 'Worksites retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a worksite with its client, assessments and documents',
  })
  @ApiParam({ name: 'id', description: 'Worksite UUID' })
  @SwaggerResponse({ status: 200, description: 'Worksite retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the worksite owner' })
  @SwaggerResponse({ status: 404, description: 'Worksite not found' })
  async getWorksiteById(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<WorksiteWithDetails>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const found = await this.worksiteService.getWorksiteById(id, user.id);

    return {
      success: true,
      data: found,
      message: 'Worksite retrieved successfully',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a worksite (owner only)' })
  @ApiParam({ name: 'id', description: 'Worksite UUID' })
  @SwaggerResponse({ status: 200, description: 'Worksite updated' })
  @SwaggerResponse({ status: 400, description: 'Invalid dates' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the worksite owner' })
  @SwaggerResponse({ status: 404, description: 'Worksite not found' })
  async updateWorksite(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateWorksiteDto,
  ): Promise<ApiResponse<worksite>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const updated = await this.worksiteService.updateWorksite(
      user.id,
      id,
      body,
    );

    return {
      success: true,
      data: updated,
      message: 'Worksite updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Delete a worksite with its documents and draft assessments (owner only)',
  })
  @ApiParam({ name: 'id', description: 'Worksite UUID' })
  @SwaggerResponse({ status: 200, description: 'Worksite deleted' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the worksite owner' })
  @SwaggerResponse({ status: 404, description: 'Worksite not found' })
  @SwaggerResponse({
    status: 409,
    description: 'Worksite has validated or sent assessments',
  })
  async deleteWorksite(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<worksite[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const worksites = await this.worksiteService.deleteWorksite(user.id, id);

    return {
      success: true,
      data: worksites,
      message: 'Worksite deleted successfully',
    };
  }
}
