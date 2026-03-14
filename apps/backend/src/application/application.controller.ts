import {
  Controller,
  Get,
  Param,
  Body,
  UseGuards,
  Delete,
  ForbiddenException,
  NotFoundException,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import { ApiResponse } from 'src/types/global';
import type { application } from 'src/generated/prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateApplicationDto } from '@dtos/application.dto';
import { CurrentUser } from 'src/decorators/current-user';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/decorators/role';

@ApiTags('Applications')
@Controller('applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get all applications for the authenticated consultant',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Applications retrieved successfully',
  })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'User not authenticated' })
  async getAllApplicationsByUserId(
    @CurrentUser() user: Express.User,
  ): Promise<ApiResponse<application[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const applications =
      await this.applicationService.getAllApplicationsByUserId(user.id);

    return {
      success: true,
      data: applications,
      message: 'Applications retrieved successfully',
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get a specific application by ID' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @SwaggerResponse({
    status: 200,
    description: 'Application retrieved successfully',
  })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({
    status: 403,
    description: 'Not allowed to access this application',
  })
  @SwaggerResponse({ status: 404, description: 'Application not found' })
  async getApplicationById(
    @Param('id') id: string,
    @CurrentUser() user: Express.User,
  ): Promise<ApiResponse<application>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const application = await this.applicationService.getApplicationById(id);

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.id_consultant !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this application',
      );
    }

    return {
      success: true,
      data: application,
      message: 'Application retrieved successfully',
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role('CONSULTANT')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new application (consultant only)' })
  @SwaggerResponse({
    status: 201,
    description: 'Application created successfully',
  })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'User not authenticated' })
  @SwaggerResponse({
    status: 404,
    description: 'User or consultant profile not found',
  })
  async createApplication(
    @Body() createApplicationDto: CreateApplicationDto,
    @CurrentUser() user: Express.User,
  ): Promise<ApiResponse<application>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const application = await this.applicationService.createApplication(
      createApplicationDto,
      user.id,
    );

    return {
      success: true,
      data: application,
      message: 'Application created successfully',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role('CONSULTANT')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete an application by ID' })
  @ApiParam({ name: 'id', description: 'Application UUID to delete' })
  @SwaggerResponse({
    status: 200,
    description: 'Application deleted successfully',
  })
  @SwaggerResponse({ status: 400, description: 'Application ID is required' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({
    status: 403,
    description: 'Not allowed to delete this application',
  })
  @SwaggerResponse({ status: 404, description: 'Application not found' })
  async deleteApplication(
    @Param('id') id: string,
    @CurrentUser() user: Express.User,
  ): Promise<ApiResponse<application[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const applications = await this.applicationService.deleteApplication(
      id,
      user.id,
    );

    if (!applications) {
      throw new NotFoundException('Application not found');
    }

    return {
      success: true,
      data: applications,
      message: 'Applications deleted successfully',
    };
  }
}
