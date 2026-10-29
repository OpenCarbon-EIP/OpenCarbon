import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ReductionActionController } from 'src/reduction-action/reduction-action.controller';
import { ReductionActionService } from 'src/reduction-action/reduction-action.service';
import {
  createMockReductionAction,
  createMockUserConsultant,
} from 'src/utils/mock-creator';

describe('ReductionActionController', () => {
  let controller: ReductionActionController;
  const reductionActionService = {
    createAction: jest.fn(),
    listActions: jest.fn(),
    getActionById: jest.fn(),
    updateAction: jest.fn(),
    deleteAction: jest.fn(),
  };
  const user = createMockUserConsultant();
  const anonymous = undefined as unknown as Express.User;
  const createDto = {
    id_assessment: 'assessment-123',
    label: 'Remplacer le GNR par du HVO',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReductionActionController],
      providers: [
        { provide: ReductionActionService, useValue: reductionActionService },
      ],
    }).compile();

    controller = module.get<ReductionActionController>(
      ReductionActionController,
    );
  });

  beforeEach(() => jest.clearAllMocks());

  describe('POST /reduction-actions', () => {
    it('should create a reduction action', async () => {
      const mockAction = createMockReductionAction();
      reductionActionService.createAction.mockResolvedValueOnce(mockAction);

      const result = await controller.createAction(user, createDto);

      expect(reductionActionService.createAction).toHaveBeenCalledWith(
        user.id,
        createDto,
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAction);
      expect(result.message).toContain('Reduction action created successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.createAction(anonymous, createDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('GET /reduction-actions', () => {
    it('should list the actions of an assessment', async () => {
      reductionActionService.listActions.mockResolvedValueOnce([
        createMockReductionAction(),
      ]);

      const result = await controller.listActions(user, {
        id_assessment: 'assessment-123',
      });

      expect(reductionActionService.listActions).toHaveBeenCalledWith(
        user.id,
        'assessment-123',
      );
      expect(result.data).toHaveLength(1);
      expect(result.message).toContain(
        'Reduction actions retrieved successfully',
      );
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.listActions(anonymous, { id_assessment: 'assessment-123' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('GET /reduction-actions/:id', () => {
    it('should return a reduction action', async () => {
      const mockAction = createMockReductionAction();
      reductionActionService.getActionById.mockResolvedValueOnce(mockAction);

      const result = await controller.getActionById(user, 'action-123');

      expect(reductionActionService.getActionById).toHaveBeenCalledWith(
        'action-123',
        user.id,
      );
      expect(result.data).toEqual(mockAction);
      expect(result.message).toContain(
        'Reduction action retrieved successfully',
      );
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.getActionById(anonymous, 'action-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('PUT /reduction-actions/:id', () => {
    it('should update a reduction action', async () => {
      const body = { status: 'RETAINED' as const };
      reductionActionService.updateAction.mockResolvedValueOnce(
        createMockReductionAction(body),
      );

      const result = await controller.updateAction(user, 'action-123', body);

      expect(reductionActionService.updateAction).toHaveBeenCalledWith(
        user.id,
        'action-123',
        body,
      );
      expect(result.message).toContain('Reduction action updated successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.updateAction(anonymous, 'action-123', {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('DELETE /reduction-actions/:id', () => {
    it('should delete a reduction action', async () => {
      reductionActionService.deleteAction.mockResolvedValueOnce([]);

      const result = await controller.deleteAction(user, 'action-123');

      expect(reductionActionService.deleteAction).toHaveBeenCalledWith(
        user.id,
        'action-123',
      );
      expect(result.data).toEqual([]);
      expect(result.message).toContain('Reduction action deleted successfully');
    });

    it('should throw if user is not authenticated', async () => {
      await expect(
        controller.deleteAction(anonymous, 'action-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
