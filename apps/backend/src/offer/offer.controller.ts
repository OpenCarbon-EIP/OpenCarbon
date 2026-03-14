import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiParam,
} from '@nestjs/swagger';
import { OfferService } from './offer.service';
import { CurrentUser } from 'src/decorators/current-user';
import { CreateOfferDto, UpdateOfferDto } from '@dtos/offer.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponse } from 'src/types/global';
import { offer } from 'src/generated/prisma/client';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/decorators/role';

@ApiTags('Offers')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('offers')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new offer (company only)' })
  @SwaggerResponse({ status: 201, description: 'Offer created successfully' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({
    status: 403,
    description: 'Only companies can create offers',
  })
  @UseGuards(RoleGuard)
  @Role('COMPANY')
  async createOffer(
    @CurrentUser() user: Express.User,
    @Body() body: CreateOfferDto,
  ): Promise<ApiResponse<offer>> {
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const offer = await this.offerService.createOffer(user.id, body);

    return {
      success: true,
      data: offer,
      message: 'Offer created successfully',
    };
  }

  @Get('list')
  @ApiOperation({ summary: 'List all offers' })
  @SwaggerResponse({ status: 200, description: 'Offers retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  async listOffers(
    @CurrentUser() user: Express.User,
  ): Promise<ApiResponse<offer[]>> {
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const offers = await this.offerService.listOffers();

    return {
      success: true,
      data: offers,
      message: 'Offers retrieved successfully',
    };
  }

  @Get('my-offers')
  @ApiOperation({ summary: 'List offers created by the authenticated company' })
  @SwaggerResponse({ status: 200, description: 'Offers retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 404, description: 'Company not found for user' })
  async listMyOffers(
    @CurrentUser() user: Express.User,
  ): Promise<ApiResponse<offer[]>> {
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const offers = await this.offerService.listMyOffers(user.id);

    return {
      success: true,
      data: offers,
      message: 'My offers retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific offer by ID' })
  @ApiParam({ name: 'id', description: 'Offer UUID' })
  @SwaggerResponse({ status: 200, description: 'Offer retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 404, description: 'Offer not found' })
  async getOfferById(
    @CurrentUser() user: Express.User,
    @Param('id') id: string,
  ): Promise<ApiResponse<offer>> {
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const offer = await this.offerService.getOfferById(id);

    return {
      success: true,
      data: offer,
      message: 'Offer retrieved successfully',
    };
  }

  @Put(':id/update')
  @ApiOperation({ summary: 'Update an offer (owner only)' })
  @ApiParam({ name: 'id', description: 'Offer UUID' })
  @SwaggerResponse({ status: 200, description: 'Offer updated' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the offer owner' })
  @SwaggerResponse({ status: 404, description: 'Offer not found' })
  async updateOffer(
    @CurrentUser() user: Express.User,
    @Param('id') id: string,
    @Body() body: UpdateOfferDto,
  ): Promise<ApiResponse<offer>> {
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const offer = await this.offerService.updateOffer(user.id, id, body);

    return {
      success: true,
      data: offer,
      message: 'Offer updated successfully',
    };
  }

  @Delete(':id/delete')
  @ApiOperation({ summary: 'Delete an offer (owner only)' })
  @ApiParam({ name: 'id', description: 'Offer UUID' })
  @SwaggerResponse({ status: 200, description: 'Offer deleted' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Not the offer owner' })
  @SwaggerResponse({ status: 404, description: 'Offer not found' })
  @UseGuards(RoleGuard)
  @Role('COMPANY')
  async deleteOffer(
    @CurrentUser() user: Express.User,
    @Param('id') id: string,
  ): Promise<ApiResponse<offer[]>> {
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const offer = await this.offerService.deleteOffer(user.id, id);

    return {
      success: true,
      data: offer,
      message: 'Offer deleted successfully',
    };
  }
}
