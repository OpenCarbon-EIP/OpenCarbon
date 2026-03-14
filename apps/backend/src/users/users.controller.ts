import {
  Controller,
  Get,
  Param,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user';
import { ApiResponse } from 'src/types/global';
import { SafeUser } from 'src/types/user.types';
import { Body, Put } from '@nestjs/common';
import { UpdateUserDto } from '@dtos/user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get the currently authenticated user profile' })
  @SwaggerResponse({ status: 200, description: 'User profile retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  async getMe(
    @CurrentUser() user: Express.User,
  ): Promise<ApiResponse<SafeUser>> {
    const me = await this.usersService.getUserById(user.id);

    if (!me) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: me,
      message: 'User profile retrieved successfully',
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get a user by ID (own profile only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @SwaggerResponse({ status: 200, description: 'User retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({
    status: 403,
    description: 'Cannot access another user profile',
  })
  @SwaggerResponse({ status: 404, description: 'User not found' })
  async getUserById(
    @Param('id') id: string,
    @CurrentUser() user: Express.User,
  ): Promise<ApiResponse<SafeUser>> {
    if (user.id !== id) {
      throw new ForbiddenException('You can only access your own profile');
    }

    const found = await this.usersService.getUserById(id);

    if (!found) {
      throw new NotFoundException('User not found');
    }
    return {
      success: true,
      data: found,
      message: 'User retrieved successfully',
    };
  }

  @Put(':id/update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update user profile (own profile only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @SwaggerResponse({ status: 200, description: 'User updated' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({
    status: 403,
    description: 'Cannot update another user profile',
  })
  @SwaggerResponse({ status: 404, description: 'User not found' })
  async updateUserProfile(
    @Param('id') id: string,
    @CurrentUser() user: Express.User,
    @Body() body: UpdateUserDto,
  ): Promise<ApiResponse<SafeUser>> {
    if (user.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const updatedUser = await this.usersService.updateUser(id, body);

    return {
      success: true,
      data: updatedUser,
      message: 'User profile updated successfully',
    };
  }
}
