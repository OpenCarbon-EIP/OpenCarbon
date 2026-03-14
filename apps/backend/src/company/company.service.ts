import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import type { company } from 'src/generated/prisma/client';

export interface CreateCompanyData {
  company_name: string;
  company_size?: number;
  description?: string;
  id_user: string;
}

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async createCompany(data: CreateCompanyData): Promise<company> {
    return await this.prisma.company.create({
      data: {
        company_name: data.company_name,
        company_size: data.company_size,
        description: data.description,
        id_user: data.id_user,
      },
    });
  }
}
