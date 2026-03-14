import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import type { consultant } from 'src/generated/prisma/client';

export interface CreateConsultantData {
  last_name: string;
  first_name: string;
  professional_title: string;
  description?: string;
  id_user: string;
}

@Injectable()
export class ConsultantService {
  constructor(private readonly prisma: PrismaService) {}

  async createConsultant(data: CreateConsultantData): Promise<consultant> {
    return await this.prisma.consultant.create({
      data: {
        last_name: data.last_name,
        first_name: data.first_name,
        professional_title: data.professional_title,
        description: data.description,
        id_user: data.id_user,
      },
    });
  }

  async getConsultantByUserId(userId: string): Promise<consultant | null> {
    return await this.prisma.consultant.findUnique({
      where: { id_user: userId },
    });
  }
}
