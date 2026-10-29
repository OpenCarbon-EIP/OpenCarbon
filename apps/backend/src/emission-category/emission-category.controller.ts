import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse as SwaggerResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EmissionCategoryService } from './emission-category.service';
import { ApiResponse } from 'src/types/global';
import type { emission_category } from 'src/generated/prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/decorators/role';
import { CurrentUser } from 'src/decorators/current-user';

@ApiTags('Emission categories')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RoleGuard)
@Role('CONSULTANT', 'COMPANY')
@Controller('emission-categories')
export class EmissionCategoryController {
  constructor(
    private readonly emissionCategoryService: EmissionCategoryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List emission categories (reference data)' })
  @SwaggerResponse({ status: 200, description: 'Categories retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  async listCategories(
    @CurrentUser() user: Express.User,
  ): Promise<ApiResponse<emission_category[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const categories = await this.emissionCategoryService.listCategories();

    return {
      success: true,
      data: categories,
      message: 'Emission categories retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an emission category by ID' })
  @ApiParam({ name: 'id', description: 'Emission category UUID' })
  @SwaggerResponse({ status: 200, description: 'Category retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 404, description: 'Category not found' })
  async getCategoryById(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<emission_category>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const category = await this.emissionCategoryService.getCategoryById(id);

    return {
      success: true,
      data: category,
      message: 'Emission category retrieved successfully',
    };
  }
}
