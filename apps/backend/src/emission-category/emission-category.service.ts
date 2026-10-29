import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { emission_category } from 'src/generated/prisma/client';

@Injectable()
export class EmissionCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(): Promise<emission_category[]> {
    return await this.prisma.emission_category.findMany({
      orderBy: [{ sort_order: 'asc' }, { label: 'asc' }],
    });
  }

  async getCategoryById(id: string): Promise<emission_category> {
    const category = await this.prisma.emission_category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Emission category not found');
    }

    return category;
  }
}
