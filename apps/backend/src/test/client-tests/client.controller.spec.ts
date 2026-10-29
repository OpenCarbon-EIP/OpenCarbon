import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ClientController } from 'src/client/client.controller';
import { ClientService } from 'src/client/client.service';
import {
  createMockClient,
  createMockUserConsultant,
} from 'src/utils/mock-creator';

describe('ClientController', () => {
  let controller: ClientController;
  const clientService = {
    createClient: jest.fn(),
    listClients: jest.fn(),
    getClientById: jest.fn(),
    updateClient: jest.fn(),
    deleteClient: jest.fn(),
  };
  const user = createMockUserConsultant();
  const anonymous = undefined as unknown as Express.User;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [{ provide: ClientService, useValue: clientService }],
    }).compile();

    controller = module.get<ClientController>(ClientController);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('POST /clients', () => {
    it('should create a client', async () => {
      const body = { company_name: 'Colas Sud-Ouest' };
      const mockClient = createMockClient();
      clientService.createClient.mockResolvedValueOnce(mockClient);

      const result = await controller.createClient(user, body);

      expect(clientService.createClient).toHaveBeenCalledWith(user.id, body);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockClient);
      expect(result.message).toContain('Client created successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.createClient(anonymous, { company_name: 'X' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('GET /clients', () => {
    it('should list clients', async () => {
      const mockClients = [createMockClient()];
      clientService.listClients.mockResolvedValueOnce(mockClients);

      const result = await controller.listClients(user);

      expect(clientService.listClients).toHaveBeenCalledWith(user.id);
      expect(result.data).toEqual(mockClients);
      expect(result.message).toContain('Clients retrieved successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(controller.listClients(anonymous)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('GET /clients/:id', () => {
    it('should return a client', async () => {
      const mockClient = {
        ...createMockClient(),
        company: null,
        worksites: [],
      };
      clientService.getClientById.mockResolvedValueOnce(mockClient);

      const result = await controller.getClientById(user, 'client-123');

      expect(clientService.getClientById).toHaveBeenCalledWith(
        'client-123',
        user.id,
      );
      expect(result.data).toEqual(mockClient);
      expect(result.message).toContain('Client retrieved successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.getClientById(anonymous, 'client-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('PUT /clients/:id', () => {
    it('should update a client', async () => {
      const body = { sector: 'Génie civil' };
      const mockClient = createMockClient(body);
      clientService.updateClient.mockResolvedValueOnce(mockClient);

      const result = await controller.updateClient(user, 'client-123', body);

      expect(clientService.updateClient).toHaveBeenCalledWith(
        user.id,
        'client-123',
        body,
      );
      expect(result.data).toEqual(mockClient);
      expect(result.message).toContain('Client updated successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.updateClient(anonymous, 'client-123', {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('DELETE /clients/:id', () => {
    it('should delete a client and return the remaining ones', async () => {
      clientService.deleteClient.mockResolvedValueOnce([]);

      const result = await controller.deleteClient(user, 'client-123');

      expect(clientService.deleteClient).toHaveBeenCalledWith(
        user.id,
        'client-123',
      );
      expect(result.data).toEqual([]);
      expect(result.message).toContain('Client deleted successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.deleteClient(anonymous, 'client-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
