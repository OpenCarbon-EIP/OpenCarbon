import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateMissionDto, UpdateMissionDto } from 'src/dtos/mission.dto';

const invalidProperties = (dto: object): string[] =>
  validateSync(dto).map((error) => error.property);

describe('Mission DTOs', () => {
  it('should parse ISO date strings', () => {
    const dto = plainToInstance(UpdateMissionDto, {
      end_date: '2027-02-15T00:00:00.000Z',
    });

    expect(invalidProperties(dto)).toEqual([]);
    expect(dto.end_date).toEqual(new Date('2027-02-15T00:00:00.000Z'));
  });

  it('should keep a null end_date so the column can be cleared', () => {
    const dto = plainToInstance(UpdateMissionDto, { end_date: null });

    expect(invalidProperties(dto)).toEqual([]);
    expect(dto.end_date).toBeNull();
  });

  it.each(['start_date', 'estimated_end_date'])(
    'should reject a null %s instead of turning it into the Unix epoch',
    (field) => {
      const dto = plainToInstance(UpdateMissionDto, { [field]: null });

      expect(invalidProperties(dto)).toEqual([field]);
    },
  );

  it('should still allow omitting every date on update', () => {
    expect(invalidProperties(plainToInstance(UpdateMissionDto, {}))).toEqual(
      [],
    );
  });

  it('should reject a null start_date on creation', () => {
    const dto = plainToInstance(CreateMissionDto, {
      id_application: '550e8400-e29b-41d4-a716-446655440000',
      start_date: null,
      estimated_end_date: '2027-02-28T00:00:00.000Z',
    });

    expect(invalidProperties(dto)).toEqual(['start_date']);
  });
});
