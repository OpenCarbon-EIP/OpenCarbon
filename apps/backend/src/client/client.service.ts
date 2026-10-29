import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { client } from 'src/generated/prisma/client';
import { ConsultantService } from 'src/consultant/consultant.service';
import { CreateClientDto, UpdateClientDto } from 'src/dtos/client.dto';
import {
  CLIENT_DETAIL_INCLUDE,
  ClientWithDetails,
} from 'src/types/carbon.types';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly consultantService: ConsultantService,
  ) {}

  async createClient(userId: string, body: CreateClientDto): Promise<client> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);

    if (body.id_company) {
      await this.assertCompanyExists(body.id_company);
    }

    const created = await this.prisma.client.create({
      data: {
        ...body,
        contact_email: body.contact_email?.trim().toLowerCase(),
        id_consultant: consultant.id,
      },
    });

    this.logger.log(
      `Client ${created.id} ("${created.company_name}") created by consultant ${consultant.id}`,
    );

    return created;
  }

  async listClients(userId: string): Promise<client[]> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);

    return await this.prisma.client.findMany({
      where: { id_consultant: consultant.id },
      orderBy: { company_name: 'asc' },
    });
  }

  async getClientById(id: string, userId: string): Promise<ClientWithDetails> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);

    const found = await this.prisma.client.findUnique({
      where: { id },
      include: CLIENT_DETAIL_INCLUDE,
    });

    if (!found) {
      throw new NotFoundException('Client not found');
    }

    this.assertOwnership(found, consultant.id);

    return found;
  }

  async getOwnedClient(id: string, consultantId: string): Promise<client> {
    const found = await this.prisma.client.findUnique({ where: { id } });

    if (!found) {
      throw new NotFoundException('Client not found');
    }

    this.assertOwnership(found, consultantId);

    return found;
  }

  async updateClient(
    userId: string,
    id: string,
    body: UpdateClientDto,
  ): Promise<client> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    await this.getOwnedClient(id, consultant.id);

    if (body.id_company) {
      await this.assertCompanyExists(body.id_company);
    }

    const updated = await this.prisma.client.update({
      where: { id },
      data: {
        ...body,
        contact_email: body.contact_email?.trim().toLowerCase(),
      },
    });

    this.logger.log(`Client ${id} updated by consultant ${consultant.id}`);

    return updated;
  }

  async deleteClient(userId: string, id: string): Promise<client[]> {
    const consultant =
      await this.consultantService.getConsultantByUserIdOrThrow(userId);
    await this.getOwnedClient(id, consultant.id);

    const worksiteCount = await this.prisma.worksite.count({
      where: { id_client: id },
    });

    if (worksiteCount > 0) {
      throw new ConflictException(
        'This client still has worksites. Delete them first',
      );
    }

    await this.prisma.client.delete({ where: { id } });

    this.logger.log(`Client ${id} deleted by consultant ${consultant.id}`);

    return this.listClients(userId);
  }

  private assertOwnership(found: client, consultantId: string): void {
    if (found.id_consultant !== consultantId) {
      throw new ForbiddenException(
        'You do not have permission to access this client',
      );
    }
  }

  private async assertCompanyExists(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }
  }
}
