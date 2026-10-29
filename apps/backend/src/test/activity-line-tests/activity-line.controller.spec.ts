import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ActivityLineController } from 'src/activity-line/activity-line.controller';
import { ActivityLineService } from 'src/activity-line/activity-line.service';
import { CreateActivityLineDto } from 'src/dtos/activity-line.dto';
import {
  createMockActivityLine,
  createMockUserConsultant,
} from 'src/utils/mock-creator';

describe('ActivityLineController', () => {
  let controller: ActivityLineController;
  const activityLineService = {
    createLine: jest.fn(),
    listLines: jest.fn(),
    getLineById: jest.fn(),
    updateLine: jest.fn(),
    deleteLine: jest.fn(),
  };
  const user = createMockUserConsultant();
  const anonymous = undefined as unknown as Express.User;
  const createDto: CreateActivityLineDto = {
    id_assessment: 'assessment-123',
    label: 'GNR pelle',
    input_quantity: 1000,
    input_unit: 'LITRE',
    id_emission_factor: 'factor-123',
    data_origin: 'MEASURED',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityLineController],
      providers: [
        { provide: ActivityLineService, useValue: activityLineService },
      ],
    }).compile();

    controller = module.get<ActivityLineController>(ActivityLineController);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('POST /activity-lines', () => {
    it('should create an activity line', async () => {
      const mockLine = createMockActivityLine();
      activityLineService.createLine.mockResolvedValueOnce(mockLine);

      const result = await controller.createLine(user, createDto);

      expect(activityLineService.createLine).toHaveBeenCalledWith(
        user.id,
        createDto,
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLine);
      expect(result.message).toContain('Activity line created successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(controller.createLine(anonymous, createDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('GET /activity-lines', () => {
    it('should list the lines of an assessment', async () => {
      activityLineService.listLines.mockResolvedValueOnce([
        createMockActivityLine(),
      ]);

      const result = await controller.listLines(user, {
        id_assessment: 'assessment-123',
      });

      expect(activityLineService.listLines).toHaveBeenCalledWith(
        user.id,
        'assessment-123',
      );
      expect(result.data).toHaveLength(1);
      expect(result.message).toContain('Activity lines retrieved successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.listLines(anonymous, { id_assessment: 'assessment-123' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('GET /activity-lines/:id', () => {
    it('should return an activity line', async () => {
      const mockLine = createMockActivityLine();
      activityLineService.getLineById.mockResolvedValueOnce(mockLine);

      const result = await controller.getLineById(user, 'line-123');

      expect(activityLineService.getLineById).toHaveBeenCalledWith(
        'line-123',
        user.id,
      );
      expect(result.data).toEqual(mockLine);
      expect(result.message).toContain('Activity line retrieved successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.getLineById(anonymous, 'line-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('PUT /activity-lines/:id', () => {
    it('should update an activity line', async () => {
      const body = { is_validated: true };
      activityLineService.updateLine.mockResolvedValueOnce(
        createMockActivityLine(body),
      );

      const result = await controller.updateLine(user, 'line-123', body);

      expect(activityLineService.updateLine).toHaveBeenCalledWith(
        user.id,
        'line-123',
        body,
      );
      expect(result.message).toContain('Activity line updated successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.updateLine(anonymous, 'line-123', {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('DELETE /activity-lines/:id', () => {
    it('should delete an activity line', async () => {
      activityLineService.deleteLine.mockResolvedValueOnce([]);

      const result = await controller.deleteLine(user, 'line-123');

      expect(activityLineService.deleteLine).toHaveBeenCalledWith(
        user.id,
        'line-123',
      );
      expect(result.data).toEqual([]);
      expect(result.message).toContain('Activity line deleted successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.deleteLine(anonymous, 'line-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
