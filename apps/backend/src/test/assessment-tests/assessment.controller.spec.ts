import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AssessmentController } from 'src/assessment/assessment.controller';
import { AssessmentService } from 'src/assessment/assessment.service';
import {
  createMockAssessment,
  createMockUserConsultant,
} from 'src/utils/mock-creator';

describe('AssessmentController', () => {
  let controller: AssessmentController;
  const assessmentService = {
    createAssessment: jest.fn(),
    listAssessments: jest.fn(),
    getAssessmentById: jest.fn(),
    updateAssessment: jest.fn(),
    updateAssessmentStatus: jest.fn(),
    deleteAssessment: jest.fn(),
  };
  const user = createMockUserConsultant();
  const anonymous = undefined as unknown as Express.User;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentController],
      providers: [{ provide: AssessmentService, useValue: assessmentService }],
    }).compile();

    controller = module.get<AssessmentController>(AssessmentController);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('POST /assessments', () => {
    it('should create an assessment', async () => {
      const body = { id_worksite: 'worksite-123' };
      const mockAssessment = createMockAssessment();
      assessmentService.createAssessment.mockResolvedValueOnce(mockAssessment);

      const result = await controller.createAssessment(user, body);

      expect(assessmentService.createAssessment).toHaveBeenCalledWith(
        user.id,
        body,
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAssessment);
      expect(result.message).toContain('Assessment created successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.createAssessment(anonymous, { id_worksite: 'w' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('GET /assessments', () => {
    it('should list assessments', async () => {
      const query = { id_worksite: 'worksite-123' };
      assessmentService.listAssessments.mockResolvedValueOnce([
        createMockAssessment(),
      ]);

      const result = await controller.listAssessments(user, query);

      expect(assessmentService.listAssessments).toHaveBeenCalledWith(
        user.id,
        query,
      );
      expect(result.data).toHaveLength(1);
      expect(result.message).toContain('Assessments retrieved successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(controller.listAssessments(anonymous, {})).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('GET /assessments/:id', () => {
    it('should return an assessment', async () => {
      const mockAssessment = createMockAssessment();
      assessmentService.getAssessmentById.mockResolvedValueOnce(mockAssessment);

      const result = await controller.getAssessmentById(user, 'assessment-123');

      expect(assessmentService.getAssessmentById).toHaveBeenCalledWith(
        'assessment-123',
        user.id,
      );
      expect(result.data).toEqual(mockAssessment);
      expect(result.message).toContain('Assessment retrieved successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.getAssessmentById(anonymous, 'assessment-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('PUT /assessments/:id', () => {
    it('should update an assessment', async () => {
      const body = { title: 'Bilan prévisionnel' };
      assessmentService.updateAssessment.mockResolvedValueOnce(
        createMockAssessment(body),
      );

      const result = await controller.updateAssessment(
        user,
        'assessment-123',
        body,
      );

      expect(assessmentService.updateAssessment).toHaveBeenCalledWith(
        user.id,
        'assessment-123',
        body,
      );
      expect(result.message).toContain('Assessment updated successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.updateAssessment(anonymous, 'assessment-123', {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('PATCH /assessments/:id/status', () => {
    it('should change the assessment status', async () => {
      assessmentService.updateAssessmentStatus.mockResolvedValueOnce(
        createMockAssessment({ status: 'VALIDATED' }),
      );

      const result = await controller.updateAssessmentStatus(
        user,
        'assessment-123',
        { status: 'VALIDATED' },
      );

      expect(assessmentService.updateAssessmentStatus).toHaveBeenCalledWith(
        user.id,
        'assessment-123',
        'VALIDATED',
      );
      expect(result.data.status).toBe('VALIDATED');
      expect(result.message).toContain(
        'Assessment status updated successfully',
      );
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.updateAssessmentStatus(anonymous, 'assessment-123', {
          status: 'VALIDATED',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('DELETE /assessments/:id', () => {
    it('should delete an assessment', async () => {
      assessmentService.deleteAssessment.mockResolvedValueOnce([]);

      const result = await controller.deleteAssessment(user, 'assessment-123');

      expect(assessmentService.deleteAssessment).toHaveBeenCalledWith(
        user.id,
        'assessment-123',
      );
      expect(result.data).toEqual([]);
      expect(result.message).toContain('Assessment deleted successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.deleteAssessment(anonymous, 'assessment-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
