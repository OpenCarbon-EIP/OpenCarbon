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
import { EmissionFactorService } from './emission-factor.service';
import { ApiResponse } from 'src/types/global';
import type { emission_factor } from 'src/generated/prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/decorators/role';
import { CurrentUser } from 'src/decorators/current-user';
import {
  CreateEmissionFactorDto,
  ListEmissionFactorsQueryDto,
  UpdateEmissionFactorDto,
} from 'src/dtos/emission-factor.dto';
import { EmissionFactorWithCategory } from 'src/types/carbon.types';

@ApiTags('Emission factors')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RoleGuard)
@Role('CONSULTANT')
@Controller('emission-factors')
export class EmissionFactorController {
  constructor(private readonly emissionFactorService: EmissionFactorService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a custom emission factor (FDES, supplier, custom)',
  })
  @SwaggerResponse({ status: 201, description: 'Emission factor created' })
  @SwaggerResponse({ status: 400, description: 'Invalid body' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 404, description: 'Category not found' })
  async createFactor(
    @CurrentUser() user: Express.User,
    @Body() body: CreateEmissionFactorDto,
  ): Promise<ApiResponse<EmissionFactorWithCategory>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const factor = await this.emissionFactorService.createFactor(user.id, body);

    return {
      success: true,
      data: factor,
      message: 'Emission factor created successfully',
    };
  }

  @Get()
  @ApiOperation({
    summary:
      'List usable emission factors (reference + own custom), archived excluded',
  })
  @SwaggerResponse({ status: 200, description: 'Emission factors retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  async listFactors(
    @CurrentUser() user: Express.User,
    @Query() query: ListEmissionFactorsQueryDto,
  ): Promise<ApiResponse<EmissionFactorWithCategory[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const factors = await this.emissionFactorService.listFactors(
      user.id,
      query,
    );

    return {
      success: true,
      data: factors,
      message: 'Emission factors retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an emission factor by ID' })
  @ApiParam({ name: 'id', description: 'Emission factor UUID' })
  @SwaggerResponse({ status: 200, description: 'Emission factor retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not your custom factor' })
  @SwaggerResponse({ status: 404, description: 'Emission factor not found' })
  async getFactorById(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<EmissionFactorWithCategory>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const factor = await this.emissionFactorService.getFactorById(id, user.id);

    return {
      success: true,
      data: factor,
      message: 'Emission factor retrieved successfully',
    };
  }

  @Put(':id')
  @ApiOperation({
    summary:
      'Update a custom emission factor (owner only). Existing lines keep their copied values',
  })
  @ApiParam({ name: 'id', description: 'Emission factor UUID' })
  @SwaggerResponse({ status: 200, description: 'Emission factor updated' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({
    status: 403,
    description: 'Reference factor or not the owner',
  })
  @SwaggerResponse({ status: 404, description: 'Emission factor not found' })
  async updateFactor(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateEmissionFactorDto,
  ): Promise<ApiResponse<EmissionFactorWithCategory>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const factor = await this.emissionFactorService.updateFactor(
      user.id,
      id,
      body,
    );

    return {
      success: true,
      data: factor,
      message: 'Emission factor updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an unused custom emission factor' })
  @ApiParam({ name: 'id', description: 'Emission factor UUID' })
  @SwaggerResponse({ status: 200, description: 'Emission factor deleted' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({
    status: 403,
    description: 'Reference factor or not the owner',
  })
  @SwaggerResponse({ status: 404, description: 'Emission factor not found' })
  @SwaggerResponse({ status: 409, description: 'Factor is in use' })
  async deleteFactor(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<emission_factor>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const factor = await this.emissionFactorService.deleteFactor(user.id, id);

    return {
      success: true,
      data: factor,
      message: 'Emission factor deleted successfully',
    };
  }
}
