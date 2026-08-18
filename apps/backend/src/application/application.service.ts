import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from 'src/dtos/application.dto';
import type { application } from 'src/generated/prisma/client';
import { UsersService } from 'src/users/users.service';
import { ConsultantService } from 'src/consultant/consultant.service';

@Injectable()
export class ApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
    private readonly consultantService: ConsultantService,
  ) {}

  async getAllApplicationsByUserId(userId: string): Promise<application[]> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'CONSULTANT') {
      const consultant =
        await this.consultantService.getConsultantByUserId(userId);
      if (!consultant) {
        throw new NotFoundException('Consultant profile not found');
      }
      return await this.prisma.application.findMany({
        where: { id_consultant: consultant.id },
      });
    } else if (user.role === 'COMPANY') {
      const company = await this.prisma.company.findUnique({
        where: { id_user: userId },
      });
      if (!company) {
        throw new NotFoundException('Company profile not found');
      }
      return await this.prisma.application.findMany({
        where: {
          offer: {
            id_company: company.id,
          },
        },
      });
    }

    return [];
  }

  async getApplicationById(id: string, userId: string): Promise<application> {
    if (!id) {
      throw new BadRequestException('Application ID is required');
    }

    const application = await this.prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const hasAccess = await this.checkApplicationAccess(application, userId);
    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have permission to access this application',
      );
    }

    return application;
  }

  async createApplication(
    createApplicationDto: CreateApplicationDto,
    userId: string,
  ): Promise<application> {
    const { id_offer, content } = createApplicationDto;

    if (!id_offer || !content) {
      throw new BadRequestException('All fields are required');
    }

    const user = await this.userService.getUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const consultant =
      await this.consultantService.getConsultantByUserId(userId);

    if (!consultant) {
      throw new NotFoundException('Consultant profile not found');
    }

    try {
      return await this.prisma.application.create({
        data: {
          id_consultant: consultant.id,
          id_offer,
          content,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to create application: ${errorMessage}`);
      throw new BadRequestException('Failed to create application');
    }
  }

  async deleteApplication(id: string, userId: string): Promise<application[]> {
    if (!id) {
      throw new BadRequestException('Application ID is required');
    }

    const application = await this.prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const consultant =
      await this.consultantService.getConsultantByUserId(userId);

    if (!consultant || application.id_consultant !== consultant.id) {
      throw new ForbiddenException(
        'You do not have permission to delete this application',
      );
    }

    await this.prisma.application.delete({
      where: { id },
    });

    return this.getAllApplicationsByUserId(userId);
  }

  async checkApplicationAccess(
    application: application,
    userId: string,
  ): Promise<boolean> {
    const user = await this.userService.getUserById(userId);
    if (!user) return false;

    if (user.role === 'CONSULTANT') {
      const consultant =
        await this.consultantService.getConsultantByUserId(userId);
      return consultant ? application.id_consultant === consultant.id : false;
    } else if (user.role === 'COMPANY') {
      const company = await this.prisma.company.findUnique({
        where: { id_user: userId },
      });
      if (!company) return false;
      const offer = await this.prisma.offer.findUnique({
        where: { id: application.id_offer },
      });
      return offer ? offer.id_company === company.id : false;
    }

    return false;
  }
}
