import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  company,
  company_domain,
  company_invitation,
  company_member,
  CompanyMemberStatus,
  CompanyRole,
} from 'src/generated/prisma/client';
import {
  AcceptInvitationDto,
  CreateCompanyDto,
  CreateCompanyDomainDto,
  CreateInvitationDto,
} from 'src/dtos/company.dto';
import * as crypto from 'crypto';

export interface CompanyWithMemberResult {
  company: company;
  member: company_member;
}

export interface UserCompanyResult {
  membership: company_member;
  company: company;
}

export interface CreatedInvitationResult extends company_invitation {
  web_link: string;
  deep_link: string;
}

export interface AcceptInvitationResult {
  member: company_member;
  company: company | null;
}

export interface MemberWithUser extends company_member {
  user: {
    id: string;
    email: string;
    createdAt?: Date;
  };
}

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async checkIsCompanyAdmin(
    companyId: string,
    userId: string,
  ): Promise<boolean> {
    const member = await this.prisma.company_member.findUnique({
      where: {
        id_company_id_user: {
          id_company: companyId,
          id_user: userId,
        },
      },
    });

    return !!(
      member &&
      member.role === CompanyRole.ADMIN &&
      member.status === CompanyMemberStatus.ACTIVE
    );
  }

  async checkIsCompanyMember(
    companyId: string,
    userId: string,
  ): Promise<boolean> {
    const member = await this.prisma.company_member.findUnique({
      where: {
        id_company_id_user: {
          id_company: companyId,
          id_user: userId,
        },
      },
    });

    return !!(member && member.status === CompanyMemberStatus.ACTIVE);
  }

  async createCompany(
    userId: string,
    dto: CreateCompanyDto,
  ): Promise<CompanyWithMemberResult> {
    return await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          company_name: dto.company_name,
          company_size: dto.company_size,
          description: dto.description,
          logo_url: dto.logo_url,
        },
      });

      const member = await tx.company_member.create({
        data: {
          id_company: company.id,
          id_user: userId,
          role: CompanyRole.ADMIN,
          status: CompanyMemberStatus.ACTIVE,
        },
      });

      return {
        company,
        member,
      };
    });
  }

  async createInvitation(
    companyId: string,
    userId: string,
    dto: CreateInvitationDto,
  ): Promise<CreatedInvitationResult> {
    const isAdmin = await this.checkIsCompanyAdmin(companyId, userId);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only company ADMINs can generate invitations',
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.prisma.company_invitation.create({
      data: {
        id_company: companyId,
        email: dto.email ? dto.email.trim().toLowerCase() : null,
        role: dto.role || CompanyRole.MEMBER,
        token,
        expires_at: expiresAt,
        created_by_user_id: userId,
      },
    });

    const webAppUrl = this.configService.get<string>(
      'WEB_APP_URL',
      'https://app.opencarbon.fr',
    );
    const deepLinkScheme = this.configService.get<string>(
      'APP_DEEP_LINK_SCHEME',
      'opencarbon://invite',
    );

    const webUrl = new URL('/invite', webAppUrl);
    webUrl.searchParams.set('token', token);
    const webLink = webUrl.toString();

    const deepLink = deepLinkScheme.includes('?token=')
      ? `${deepLinkScheme}${token}`
      : `${deepLinkScheme.replace(/\/$/, '')}?token=${token}`;

    return {
      ...invitation,
      web_link: webLink,
      deep_link: deepLink,
    };
  }

  async acceptInvitation(
    userId: string,
    userEmail: string,
    dto: AcceptInvitationDto,
  ): Promise<AcceptInvitationResult> {
    return await this.prisma.$transaction(async (tx) => {
      const invitation = await tx.company_invitation.findUnique({
        where: { token: dto.token },
      });

      if (!invitation || invitation.expires_at <= new Date()) {
        throw new BadRequestException('Invitation token is invalid or expired');
      }

      if (
        invitation.email &&
        invitation.email.toLowerCase() !== userEmail.toLowerCase()
      ) {
        throw new BadRequestException(
          'This invitation was sent to a different email address',
        );
      }

      const existingMember = await tx.company_member.findUnique({
        where: {
          id_company_id_user: {
            id_company: invitation.id_company,
            id_user: userId,
          },
        },
      });

      if (existingMember?.status === CompanyMemberStatus.REJECTED) {
        throw new BadRequestException(
          'Your membership request was previously rejected',
        );
      }

      const deleted = await tx.company_invitation.deleteMany({
        where: {
          id: invitation.id,
          expires_at: { gt: new Date() },
        },
      });

      if (deleted.count === 0) {
        throw new BadRequestException('Invitation token is invalid or expired');
      }

      const targetRole =
        existingMember?.role === CompanyRole.ADMIN
          ? CompanyRole.ADMIN
          : existingMember?.status === CompanyMemberStatus.ACTIVE
            ? existingMember.role
            : invitation.role;

      const member = await tx.company_member.upsert({
        where: {
          id_company_id_user: {
            id_company: invitation.id_company,
            id_user: userId,
          },
        },
        create: {
          id_company: invitation.id_company,
          id_user: userId,
          role: invitation.role,
          status: CompanyMemberStatus.ACTIVE,
        },
        update: {
          role: targetRole,
          status: CompanyMemberStatus.ACTIVE,
        },
      });

      const company = await tx.company.findUnique({
        where: { id: invitation.id_company },
      });

      return {
        member,
        company,
      };
    });
  }

  async addDomain(
    companyId: string,
    userId: string,
    dto: CreateCompanyDomainDto,
  ): Promise<company_domain> {
    const isAdmin = await this.checkIsCompanyAdmin(companyId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only company ADMINs can configure domains');
    }

    const normalizedDomain = dto.domain.trim().toLowerCase().replace(/^@/, '');

    const existingDomain = await this.prisma.company_domain.findUnique({
      where: { domain: normalizedDomain },
    });

    if (existingDomain) {
      throw new ConflictException(
        `Domain '${normalizedDomain}' is already registered`,
      );
    }

    return await this.prisma.company_domain.create({
      data: {
        id_company: companyId,
        domain: normalizedDomain,
      },
    });
  }

  async getDomains(
    companyId: string,
    userId: string,
  ): Promise<company_domain[]> {
    const isMember = await this.checkIsCompanyMember(companyId, userId);
    if (!isMember) {
      throw new ForbiddenException(
        'You must be an active member of this company',
      );
    }

    return await this.prisma.company_domain.findMany({
      where: { id_company: companyId },
    });
  }

  async deleteDomain(
    companyId: string,
    userId: string,
    domainId: string,
  ): Promise<{ message: string }> {
    const isAdmin = await this.checkIsCompanyAdmin(companyId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only company ADMINs can delete domains');
    }

    const domain = await this.prisma.company_domain.findUnique({
      where: { id: domainId },
    });

    if (!domain || domain.id_company !== companyId) {
      throw new NotFoundException('Domain not found for this company');
    }

    await this.prisma.company_domain.delete({
      where: { id: domainId },
    });

    return { message: 'Domain deleted successfully' };
  }

  async getPendingMembers(
    companyId: string,
    userId: string,
  ): Promise<MemberWithUser[]> {
    const isAdmin = await this.checkIsCompanyAdmin(companyId, userId);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only company ADMINs can view pending member requests',
      );
    }

    return await this.prisma.company_member.findMany({
      where: {
        id_company: companyId,
        status: CompanyMemberStatus.PENDING_APPROVAL,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });
  }

  private async updateMemberStatus(
    companyId: string,
    adminUserId: string,
    targetUserId: string,
    status: CompanyMemberStatus,
  ): Promise<MemberWithUser> {
    const isAdmin = await this.checkIsCompanyAdmin(companyId, adminUserId);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only company ADMINs can perform this action',
      );
    }

    const member = await this.prisma.company_member.findUnique({
      where: {
        id_company_id_user: {
          id_company: companyId,
          id_user: targetUserId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Membership request not found');
    }

    if (member.status !== CompanyMemberStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Only membership requests pending approval can be updated',
      );
    }

    return await this.prisma.company_member.update({
      where: {
        id_company_id_user: {
          id_company: companyId,
          id_user: targetUserId,
        },
      },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async approveMember(
    companyId: string,
    userId: string,
    targetUserId: string,
  ): Promise<MemberWithUser> {
    return this.updateMemberStatus(
      companyId,
      userId,
      targetUserId,
      CompanyMemberStatus.ACTIVE,
    );
  }

  async rejectMember(
    companyId: string,
    userId: string,
    targetUserId: string,
  ): Promise<MemberWithUser> {
    return this.updateMemberStatus(
      companyId,
      userId,
      targetUserId,
      CompanyMemberStatus.REJECTED,
    );
  }

  async getCompanyMembers(
    companyId: string,
    userId: string,
  ): Promise<MemberWithUser[]> {
    const isMember = await this.checkIsCompanyMember(companyId, userId);
    if (!isMember) {
      throw new ForbiddenException(
        'You must be an active member of this company',
      );
    }

    return await this.prisma.company_member.findMany({
      where: { id_company: companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async getUserCompany(userId: string): Promise<UserCompanyResult | null> {
    const membership = await this.prisma.company_member.findFirst({
      where: {
        id_user: userId,
        status: CompanyMemberStatus.ACTIVE,
      },
      include: {
        company: true,
      },
    });

    if (!membership) {
      return null;
    }

    return {
      membership,
      company: membership.company,
    };
  }
}
