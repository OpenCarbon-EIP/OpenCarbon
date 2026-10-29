import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ClientService } from 'src/client/client.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConsultantService } from 'src/consultant/consultant.service';
import {
  createMockClient,
  createMockCompany,
  createMockConsultant,
} from 'src/utils/mock-creator';
import { createPrismaMock, PrismaMock } from '../helpers/prisma-mock';

describe('ClientService', () => {
  let service: ClientService;
  let prisma: PrismaMock;
  const consultantService = { getConsultantByUserIdOrThrow: jest.fn() };

  beforeEach(async () => {
    prisma = createPrismaMock();
    consultantService.getConsultantByUserIdOrThrow.mockResolvedValue(
      createMockConsultant(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConsultantService, useValue: consultantService },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
  });

  describe('createClient', () => {
    it('should create a client for the consultant with a normalized email', async () => {
      const mockClient = createMockClient();
      prisma.client.create.mockResolvedValue(mockClient);

      const result = await service.createClient('user-123', {
        company_name: 'Colas Sud-Ouest',
        contact_email: '  Marie.Dupont@Example.com ',
      });

      expect(result).toEqual(mockClient);
      expect(prisma.client.create).toHaveBeenCalledWith({
        data: {
          company_name: 'Colas Sud-Ouest',
          contact_email: 'marie.dupont@example.com',
          id_consultant: 'consul-123',
        },
      });
    });

    it('should check that the linked company exists', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(
        service.createClient('user-123', {
          company_name: 'Colas',
          id_company: 'unknown-company',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.client.create).not.toHaveBeenCalled();
    });

    it('should accept an existing linked company', async () => {
      prisma.company.findUnique.mockResolvedValue(createMockCompany());
      prisma.client.create.mockResolvedValue(createMockClient());

      await service.createClient('user-123', {
        company_name: 'Colas',
        id_company: 'company-uuid',
      });

      expect(prisma.client.create).toHaveBeenCalled();
    });

    it('should throw if the consultant profile does not exist', async () => {
      consultantService.getConsultantByUserIdOrThrow.mockRejectedValueOnce(
        new NotFoundException('Consultant profile not found'),
      );

      await expect(
        service.createClient('user-123', { company_name: 'Colas' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listClients', () => {
    it('should list only the consultant clients', async () => {
      const mockClients = [createMockClient()];
      prisma.client.findMany.mockResolvedValue(mockClients);

      const result = await service.listClients('user-123');

      expect(result).toEqual(mockClients);
      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id_consultant: 'consul-123' } }),
      );
    });
  });

  describe('getClientById', () => {
    it('should return an owned client', async () => {
      const mockClient = createMockClient();
      prisma.client.findUnique.mockResolvedValue(mockClient);

      await expect(
        service.getClientById('client-123', 'user-123'),
      ).resolves.toEqual(mockClient);
    });

    it('should throw NotFoundException when the client does not exist', async () => {
      prisma.client.findUnique.mockResolvedValue(null);

      await expect(
        service.getClientById('client-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for a client of another consultant', async () => {
      prisma.client.findUnique.mockResolvedValue(
        createMockClient({ id_consultant: 'other-consultant' }),
      );

      await expect(
        service.getClientById('client-123', 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateClient', () => {
    it('should update an owned client', async () => {
      prisma.client.findUnique.mockResolvedValue(createMockClient());
      prisma.client.update.mockResolvedValue(
        createMockClient({ sector: 'Génie civil' }),
      );

      const result = await service.updateClient('user-123', 'client-123', {
        sector: 'Génie civil',
      });

      expect(result.sector).toBe('Génie civil');
      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'client-123' },
        data: { sector: 'Génie civil', contact_email: undefined },
      });
    });

    it('should not update a client of another consultant', async () => {
      prisma.client.findUnique.mockResolvedValue(
        createMockClient({ id_consultant: 'other-consultant' }),
      );

      await expect(
        service.updateClient('user-123', 'client-123', { sector: 'X' }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.client.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteClient', () => {
    it('should delete a client without worksites', async () => {
      prisma.client.findUnique.mockResolvedValue(createMockClient());
      prisma.worksite.count.mockResolvedValue(0);
      prisma.client.findMany.mockResolvedValue([]);

      const result = await service.deleteClient('user-123', 'client-123');

      expect(prisma.client.delete).toHaveBeenCalledWith({
        where: { id: 'client-123' },
      });
      expect(result).toEqual([]);
    });

    it('should refuse to delete a client that still has worksites', async () => {
      prisma.client.findUnique.mockResolvedValue(createMockClient());
      prisma.worksite.count.mockResolvedValue(2);

      await expect(
        service.deleteClient('user-123', 'client-123'),
      ).rejects.toThrow(ConflictException);
      expect(prisma.client.delete).not.toHaveBeenCalled();
    });
  });
});
