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
import { ReductionActionService } from './reduction-action.service';
import { ApiResponse } from 'src/types/global';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/decorators/role';
import { CurrentUser } from 'src/decorators/current-user';
import {
  CreateReductionActionDto,
  ListReductionActionsQueryDto,
  UpdateReductionActionDto,
} from 'src/dtos/reduction-action.dto';
import { ReductionActionWithDetails } from 'src/types/carbon.types';

@ApiTags('Reduction actions')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RoleGuard)
@Role('CONSULTANT')
@Controller('reduction-actions')
export class ReductionActionController {
  constructor(
    private readonly reductionActionService: ReductionActionService,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Add a reduction action. The saving is estimated when a line and an alternative factor are given',
  })
  @SwaggerResponse({ status: 201, description: 'Reduction action created' })
  @SwaggerResponse({ status: 400, description: 'Line or unit mismatch' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the assessment owner' })
  @SwaggerResponse({
    status: 404,
    description: 'Assessment, line or factor not found',
  })
  @SwaggerResponse({ status: 409, description: 'Assessment already sent' })
  async createAction(
    @CurrentUser() user: Express.User,
    @Body() body: CreateReductionActionDto,
  ): Promise<ApiResponse<ReductionActionWithDetails>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const created = await this.reductionActionService.createAction(
      user.id,
      body,
    );

    return {
      success: true,
      data: created,
      message: 'Reduction action created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List reduction actions of an assessment' })
  @SwaggerResponse({ status: 200, description: 'Reduction actions retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the assessment owner' })
  @SwaggerResponse({ status: 404, description: 'Assessment not found' })
  async listActions(
    @CurrentUser() user: Express.User,
    @Query() query: ListReductionActionsQueryDto,
  ): Promise<ApiResponse<ReductionActionWithDetails[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const actions = await this.reductionActionService.listActions(
      user.id,
      query.id_assessment,
    );

    return {
      success: true,
      data: actions,
      message: 'Reduction actions retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reduction action by ID' })
  @ApiParam({ name: 'id', description: 'Reduction action UUID' })
  @SwaggerResponse({ status: 200, description: 'Reduction action retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the action owner' })
  @SwaggerResponse({ status: 404, description: 'Reduction action not found' })
  async getActionById(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<ReductionActionWithDetails>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const action = await this.reductionActionService.getActionById(id, user.id);

    return {
      success: true,
      data: action,
      message: 'Reduction action retrieved successfully',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a reduction action (owner only)' })
  @ApiParam({ name: 'id', description: 'Reduction action UUID' })
  @SwaggerResponse({ status: 200, description: 'Reduction action updated' })
  @SwaggerResponse({ status: 400, description: 'Line or unit mismatch' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the action owner' })
  @SwaggerResponse({ status: 404, description: 'Reduction action not found' })
  @SwaggerResponse({ status: 409, description: 'Assessment already sent' })
  async updateAction(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateReductionActionDto,
  ): Promise<ApiResponse<ReductionActionWithDetails>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const updated = await this.reductionActionService.updateAction(
      user.id,
      id,
      body,
    );

    return {
      success: true,
      data: updated,
      message: 'Reduction action updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reduction action (owner only)' })
  @ApiParam({ name: 'id', description: 'Reduction action UUID' })
  @SwaggerResponse({ status: 200, description: 'Reduction action deleted' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the action owner' })
  @SwaggerResponse({ status: 404, description: 'Reduction action not found' })
  @SwaggerResponse({ status: 409, description: 'Assessment already sent' })
  async deleteAction(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<ReductionActionWithDetails[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const actions = await this.reductionActionService.deleteAction(user.id, id);

    return {
      success: true,
      data: actions,
      message: 'Reduction action deleted successfully',
    };
  }
}
