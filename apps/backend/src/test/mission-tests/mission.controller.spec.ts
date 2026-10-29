import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { MissionController } from 'src/mission/mission.controller';
import { MissionService } from 'src/mission/mission.service';
import { CreateMissionDto } from 'src/dtos/mission.dto';
import {
  createMockMission,
  createMockUserCompany,
  createMockUserConsultant,
} from 'src/utils/mock-creator';

describe('MissionController', () => {
  let controller: MissionController;
  const missionService = {
    createMission: jest.fn(),
    listMissions: jest.fn(),
    getMissionById: jest.fn(),
    updateMission: jest.fn(),
    deleteMission: jest.fn(),
  };
  const company = createMockUserCompany();
  const consultant = createMockUserConsultant();
  const anonymous = undefined as unknown as Express.User;
  const createDto: CreateMissionDto = {
    id_application: 'application-123',
    start_date: new Date('2026-11-01'),
    estimated_end_date: new Date('2027-02-28'),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MissionController],
      providers: [{ provide: MissionService, useValue: missionService }],
    }).compile();

    controller = module.get<MissionController>(MissionController);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('POST /missions', () => {
    it('should create a mission', async () => {
      const mockMission = createMockMission();
      missionService.createMission.mockResolvedValueOnce(mockMission);

      const result = await controller.createMission(company, createDto);

      expect(missionService.createMission).toHaveBeenCalledWith(
        company.id,
        createDto,
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMission);
      expect(result.message).toContain('Mission created successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.createMission(anonymous, createDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('GET /missions', () => {
    it.each([
      ['consultant', consultant],
      ['company', company],
    ])('should list the missions of a %s', async (_role, user) => {
      missionService.listMissions.mockResolvedValueOnce([createMockMission()]);

      const result = await controller.listMissions(user);

      expect(missionService.listMissions).toHaveBeenCalledWith(user);
      expect(result.data).toHaveLength(1);
      expect(result.message).toContain('Missions retrieved successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(controller.listMissions(anonymous)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('GET /missions/:id', () => {
    it('should return a mission', async () => {
      const mockMission = createMockMission();
      missionService.getMissionById.mockResolvedValueOnce(mockMission);

      const result = await controller.getMissionById(consultant, 'mission-123');

      expect(missionService.getMissionById).toHaveBeenCalledWith(
        'mission-123',
        consultant,
      );
      expect(result.data).toEqual(mockMission);
      expect(result.message).toContain('Mission retrieved successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.getMissionById(anonymous, 'mission-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('PUT /missions/:id', () => {
    it('should update a mission', async () => {
      const body = { progress: 40 };
      missionService.updateMission.mockResolvedValueOnce(
        createMockMission(body),
      );

      const result = await controller.updateMission(
        consultant,
        'mission-123',
        body,
      );

      expect(missionService.updateMission).toHaveBeenCalledWith(
        consultant,
        'mission-123',
        body,
      );
      expect(result.data.progress).toBe(40);
      expect(result.message).toContain('Mission updated successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.updateMission(anonymous, 'mission-123', {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('DELETE /missions/:id', () => {
    it('should delete a mission', async () => {
      missionService.deleteMission.mockResolvedValueOnce([]);

      const result = await controller.deleteMission(company, 'mission-123');

      expect(missionService.deleteMission).toHaveBeenCalledWith(
        company,
        'mission-123',
      );
      expect(result.data).toEqual([]);
      expect(result.message).toContain('Mission deleted successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.deleteMission(anonymous, 'mission-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
