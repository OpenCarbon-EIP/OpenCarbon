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
import { ClientService } from './client.service';
import { ApiResponse } from 'src/types/global';
import type { client } from 'src/generated/prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/decorators/role';
import { CurrentUser } from 'src/decorators/current-user';
import { CreateClientDto, UpdateClientDto } from 'src/dtos/client.dto';
import { ClientWithDetails } from 'src/types/carbon.types';

@ApiTags('Clients')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RoleGuard)
@Role('CONSULTANT')
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @ApiOperation({ summary: 'Create a client for the authenticated consultant' })
  @SwaggerResponse({ status: 201, description: 'Client created' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({
    status: 404,
    description: 'Consultant profile or company not found',
  })
  async createClient(
    @CurrentUser() user: Express.User,
    @Body() body: CreateClientDto,
  ): Promise<ApiResponse<client>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const created = await this.clientService.createClient(user.id, body);

    return {
      success: true,
      data: created,
      message: 'Client created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List clients of the authenticated consultant' })
  @SwaggerResponse({ status: 200, description: 'Clients retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  async listClients(
    @CurrentUser() user: Express.User,
  ): Promise<ApiResponse<client[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const clients = await this.clientService.listClients(user.id);

    return {
      success: true,
      data: clients,
      message: 'Clients retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client with its worksites' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @SwaggerResponse({ status: 200, description: 'Client retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the client owner' })
  @SwaggerResponse({ status: 404, description: 'Client not found' })
  async getClientById(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<ClientWithDetails>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const found = await this.clientService.getClientById(id, user.id);

    return {
      success: true,
      data: found,
      message: 'Client retrieved successfully',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a client (owner only)' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @SwaggerResponse({ status: 200, description: 'Client updated' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the client owner' })
  @SwaggerResponse({ status: 404, description: 'Client not found' })
  async updateClient(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateClientDto,
  ): Promise<ApiResponse<client>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const updated = await this.clientService.updateClient(user.id, id, body);

    return {
      success: true,
      data: updated,
      message: 'Client updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client without worksites (owner only)' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @SwaggerResponse({ status: 200, description: 'Client deleted' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the client owner' })
  @SwaggerResponse({ status: 404, description: 'Client not found' })
  @SwaggerResponse({ status: 409, description: 'Client still has worksites' })
  async deleteClient(
    @CurrentUser() user: Express.User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<client[]>> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const clients = await this.clientService.deleteClient(user.id, id);

    return {
      success: true,
      data: clients,
      message: 'Client deleted successfully',
    };
  }
}
