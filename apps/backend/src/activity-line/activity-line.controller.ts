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
import { ActivityLineService } from './activity-line.service';
import { ApiResponse } from 'src/types/global';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/decorators/role';
import { CurrentUser } from 'src/decorators/current-user';
import {
  CreateActivityLineDto,
  ListActivityLinesQueryDto,
  UpdateActivityLineDto,
} from 'src/dtos/activity-line.dto';
import { ActivityLineWithDetails } from 'src/types/carbon.types';

@ApiTags('Activity lines')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RoleGuard)
@Role('CONSULTANT')
@Controller('activity-lines')
export class ActivityLineController {
  constructor(private readonly activityLineService: ActivityLineService) {}

  @Post()
  @ApiOperation({
    summary:
      'Add an activity line to a DRAFT assessment. Emissions are computed server-side',
  })
  @SwaggerResponse({ status: 201, description: 'Activity line created' })
  @SwaggerResponse({
    status: 400,
    description: 'Unit mismatch, archived factor or missing category',
  })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the assessment owner' })
  @SwaggerResponse({
    status: 404,
    description: 'Assessment, factor or category not found',
  })
  @SwaggerResponse({ status: 409, description: 'Assessment is not DRAFT' })
  async createLine(
    @CurrentUser() user: Express.User,
    @Body() body: CreateActivityLineDto,
  ): Promise<ApiResponse<ActivityLineWithDetails>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const created = await this.activityLineService.createLine(user.id, body);

    return {
      success: true,
      data: created,
      message: 'Activity line created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List activity lines of an assessment' })
  @SwaggerResponse({ status: 200, description: 'Activity lines retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the assessment owner' })
  @SwaggerResponse({ status: 404, description: 'Assessment not found' })
  async listLines(
    @CurrentUser() user: Express.User,
    @Query() query: ListActivityLinesQueryDto,
  ): Promise<ApiResponse<ActivityLineWithDetails[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const lines = await this.activityLineService.listLines(
      user.id,
      query.id_assessment,
    );

    return {
      success: true,
      data: lines,
      message: 'Activity lines retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an activity line by ID' })
  @ApiParam({ name: 'id', description: 'Activity line UUID' })
  @SwaggerResponse({ status: 200, description: 'Activity line retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the line owner' })
  @SwaggerResponse({ status: 404, description: 'Activity line not found' })
  async getLineById(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<ActivityLineWithDetails>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const line = await this.activityLineService.getLineById(id, user.id);

    return {
      success: true,
      data: line,
      message: 'Activity line retrieved successfully',
    };
  }

  @Put(':id')
  @ApiOperation({
    summary:
      'Update an activity line. Any calculation change recomputes it and resets its validation',
  })
  @ApiParam({ name: 'id', description: 'Activity line UUID' })
  @SwaggerResponse({ status: 200, description: 'Activity line updated' })
  @SwaggerResponse({ status: 400, description: 'Unit mismatch' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the line owner' })
  @SwaggerResponse({ status: 404, description: 'Activity line not found' })
  @SwaggerResponse({ status: 409, description: 'Assessment is not DRAFT' })
  async updateLine(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateActivityLineDto,
  ): Promise<ApiResponse<ActivityLineWithDetails>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const updated = await this.activityLineService.updateLine(
      user.id,
      id,
      body,
    );

    return {
      success: true,
      data: updated,
      message: 'Activity line updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Delete an activity line. Its source extraction goes back to review',
  })
  @ApiParam({ name: 'id', description: 'Activity line UUID' })
  @SwaggerResponse({ status: 200, description: 'Activity line deleted' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the line owner' })
  @SwaggerResponse({ status: 404, description: 'Activity line not found' })
  @SwaggerResponse({ status: 409, description: 'Assessment is not DRAFT' })
  async deleteLine(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<ActivityLineWithDetails[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const lines = await this.activityLineService.deleteLine(user.id, id);

    return {
      success: true,
      data: lines,
      message: 'Activity line deleted successfully',
    };
  }
}
