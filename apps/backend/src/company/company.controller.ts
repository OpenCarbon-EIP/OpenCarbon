import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AcceptInvitationResult,
  CompanyService,
  CompanyWithMemberResult,
  CreatedInvitationResult,
  MemberWithUser,
  UserCompanyResult,
} from './company.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user';
import type { AuthenticatedUser } from 'src/types/user.types';
import { ApiResponse } from 'src/types/global';
import {
  AcceptInvitationDto,
  CreateCompanyDto,
  CreateCompanyDomainDto,
  CreateInvitationDto,
} from 'src/dtos/company.dto';
import type { company_domain } from 'src/generated/prisma/client';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new company and become its ADMIN' })
  @SwaggerResponse({ status: 201, description: 'Company created successfully' })
  async createCompany(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCompanyDto,
  ): Promise<ApiResponse<CompanyWithMemberResult>> {
    const data: CompanyWithMemberResult =
      await this.companyService.createCompany(user.id, dto);
    return {
      success: true,
      data,
      message: 'Company created successfully',
    };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user active company' })
  @SwaggerResponse({ status: 200, description: 'User company fetched' })
  async getUserCompany(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponse<UserCompanyResult | null>> {
    const data: UserCompanyResult | null =
      await this.companyService.getUserCompany(user.id);
    return {
      success: true,
      data,
      message: 'User company fetched successfully',
    };
  }

  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept invitation to join a company (POST body)' })
  @SwaggerResponse({
    status: 200,
    description: 'Invitation accepted successfully',
  })
  async acceptInvitationPost(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AcceptInvitationDto,
  ): Promise<ApiResponse<AcceptInvitationResult>> {
    const data: AcceptInvitationResult =
      await this.companyService.acceptInvitation(user.id, user.email, dto);
    return {
      success: true,
      data,
      message: 'Invitation accepted successfully',
    };
  }

  @Post(':id/invitations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a company invitation link (ADMIN only)' })
  @SwaggerResponse({ status: 201, description: 'Invitation created' })
  async createInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') companyId: string,
    @Body() dto: CreateInvitationDto,
  ): Promise<ApiResponse<CreatedInvitationResult>> {
    const data: CreatedInvitationResult =
      await this.companyService.createInvitation(companyId, user.id, dto);
    return {
      success: true,
      data,
      message: 'Invitation created successfully',
    };
  }

  @Post(':id/domains')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Configure authorized email domain for auto-join (ADMIN only)',
  })
  @SwaggerResponse({ status: 201, description: 'Domain configured' })
  async addDomain(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') companyId: string,
    @Body() dto: CreateCompanyDomainDto,
  ): Promise<ApiResponse<company_domain>> {
    const data: company_domain = await this.companyService.addDomain(
      companyId,
      user.id,
      dto,
    );
    return {
      success: true,
      data,
      message: 'Domain configured successfully',
    };
  }

  @Get(':id/domains')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List configured domains for company' })
  @SwaggerResponse({ status: 200, description: 'Domains retrieved' })
  async getDomains(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') companyId: string,
  ): Promise<ApiResponse<company_domain[]>> {
    const data: company_domain[] = await this.companyService.getDomains(
      companyId,
      user.id,
    );
    return {
      success: true,
      data,
      message: 'Domains retrieved successfully',
    };
  }

  @Delete(':id/domains/:domainId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a configured domain (ADMIN only)' })
  @SwaggerResponse({ status: 200, description: 'Domain deleted' })
  async deleteDomain(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') companyId: string,
    @Param('domainId') domainId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    const data: { message: string } = await this.companyService.deleteDomain(
      companyId,
      user.id,
      domainId,
    );
    return {
      success: true,
      data,
      message: 'Domain deleted successfully',
    };
  }

  @Get(':id/pending-members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List pending member join requests (ADMIN only)' })
  @SwaggerResponse({ status: 200, description: 'Pending members retrieved' })
  async getPendingMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') companyId: string,
  ): Promise<ApiResponse<MemberWithUser[]>> {
    const data: MemberWithUser[] = await this.companyService.getPendingMembers(
      companyId,
      user.id,
    );
    return {
      success: true,
      data,
      message: 'Pending members retrieved successfully',
    };
  }

  @Post(':id/members/:userId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve a pending member join request (ADMIN only)',
  })
  @SwaggerResponse({ status: 200, description: 'Member request approved' })
  async approveMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') companyId: string,
    @Param('userId') targetUserId: string,
  ): Promise<ApiResponse<MemberWithUser>> {
    const data: MemberWithUser = await this.companyService.approveMember(
      companyId,
      user.id,
      targetUserId,
    );
    return {
      success: true,
      data,
      message: 'Member request approved successfully',
    };
  }

  @Post(':id/members/:userId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject a pending member join request (ADMIN only)',
  })
  @SwaggerResponse({ status: 200, description: 'Member request rejected' })
  async rejectMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') companyId: string,
    @Param('userId') targetUserId: string,
  ): Promise<ApiResponse<MemberWithUser>> {
    const data: MemberWithUser = await this.companyService.rejectMember(
      companyId,
      user.id,
      targetUserId,
    );
    return {
      success: true,
      data,
      message: 'Member request rejected successfully',
    };
  }

  @Get(':id/members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List company members' })
  @SwaggerResponse({ status: 200, description: 'Members retrieved' })
  async getCompanyMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') companyId: string,
  ): Promise<ApiResponse<MemberWithUser[]>> {
    console.log(`Fetching members for company ${companyId} by user ${user.id}`);
    const data: MemberWithUser[] = await this.companyService.getCompanyMembers(
      companyId,
      user.id,
    );
    return {
      success: true,
      data,
      message: 'Company members retrieved successfully',
    };
  }
}
