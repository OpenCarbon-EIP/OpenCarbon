import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from '@dtos/application.dto';
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

    return await this.prisma.application.findMany({
      where: { id_consultant: userId },
    });
  }

  async getApplicationById(id: string): Promise<application | null> {
    if (!id) {
      throw new BadRequestException('Application ID is required');
    }

    return await this.prisma.application.findUnique({
      where: { id },
    });
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

    if (application.id_consultant !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this application',
      );
    }

    await this.prisma.application.delete({
      where: { id },
    });

    return this.getAllApplicationsByUserId(userId);
  }
}
