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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse as SwaggerResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MissionService } from './mission.service';
import { ApiResponse } from 'src/types/global';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/decorators/role';
import { CurrentUser } from 'src/decorators/current-user';
import { CreateMissionDto, UpdateMissionDto } from 'src/dtos/mission.dto';
import { MissionWithDetails } from 'src/types/mission.types';

@ApiTags('Missions')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('missions')
export class MissionController {
  constructor(private readonly missionService: MissionService) {}

  @Post()
  @Role('COMPANY')
  @ApiOperation({
    summary:
      'Create a mission from an application to one of your offers (company only). The application becomes ACCEPTED',
  })
  @SwaggerResponse({ status: 201, description: 'Mission created' })
  @SwaggerResponse({
    status: 400,
    description: 'Rejected application or invalid dates',
  })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not your offer' })
  @SwaggerResponse({ status: 404, description: 'Application not found' })
  @SwaggerResponse({ status: 409, description: 'Mission already exists' })
  async createMission(
    @CurrentUser() user: Express.User,
    @Body() body: CreateMissionDto,
  ): Promise<ApiResponse<MissionWithDetails>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const created = await this.missionService.createMission(user.id, body);

    return {
      success: true,
      data: created,
      message: 'Mission created successfully',
    };
  }

  @Get()
  @Role('CONSULTANT', 'COMPANY')
  @ApiOperation({ summary: 'List missions of the authenticated user' })
  @SwaggerResponse({ status: 200, description: 'Missions retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  async listMissions(
    @CurrentUser() user: Express.User,
  ): Promise<ApiResponse<MissionWithDetails[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const missions = await this.missionService.listMissions(user);

    return {
      success: true,
      data: missions,
      message: 'Missions retrieved successfully',
    };
  }

  @Get(':id')
  @Role('CONSULTANT', 'COMPANY')
  @ApiOperation({ summary: 'Get a mission (participants only)' })
  @ApiParam({ name: 'id', description: 'Mission UUID' })
  @SwaggerResponse({ status: 200, description: 'Mission retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not a mission participant' })
  @SwaggerResponse({ status: 404, description: 'Mission not found' })
  async getMissionById(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<MissionWithDetails>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const found = await this.missionService.getMissionById(id, user);

    return {
      success: true,
      data: found,
      message: 'Mission retrieved successfully',
    };
  }

  @Put(':id')
  @Role('CONSULTANT', 'COMPANY')
  @ApiOperation({
    summary:
      'Update a mission: progress for the consultant, dates / status / payment for the company',
  })
  @ApiParam({ name: 'id', description: 'Mission UUID' })
  @SwaggerResponse({ status: 200, description: 'Mission updated' })
  @SwaggerResponse({ status: 400, description: 'Invalid dates' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({
    status: 403,
    description: 'Not a participant or field not allowed for this role',
  })
  @SwaggerResponse({ status: 404, description: 'Mission not found' })
  @SwaggerResponse({ status: 409, description: 'Mission is not ONGOING' })
  async updateMission(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMissionDto,
  ): Promise<ApiResponse<MissionWithDetails>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const updated = await this.missionService.updateMission(user, id, body);

    return {
      success: true,
      data: updated,
      message: 'Mission updated successfully',
    };
  }

  @Delete(':id')
  @Role('COMPANY')
  @ApiOperation({
    summary:
      'Delete a mission (company only). Its application goes back to PENDING',
  })
  @ApiParam({ name: 'id', description: 'Mission UUID' })
  @SwaggerResponse({ status: 200, description: 'Mission deleted' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the mission company' })
  @SwaggerResponse({ status: 404, description: 'Mission not found' })
  async deleteMission(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<MissionWithDetails[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const missions = await this.missionService.deleteMission(user, id);

    return {
      success: true,
      data: missions,
      message: 'Mission deleted successfully',
    };
  }
}
