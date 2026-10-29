import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateWorksiteDto, UpdateWorksiteDto } from 'src/dtos/worksite.dto';

const invalidProperties = (dto: object): string[] =>
  validateSync(dto).map((error) => error.property);

describe('Worksite DTOs', () => {
  it('should keep a null end_date so the column can be cleared', () => {
    const dto = plainToInstance(UpdateWorksiteDto, { end_date: null });

    expect(invalidProperties(dto)).toEqual([]);
    expect(dto.end_date).toBeNull();
  });

  it('should reject a null start_date instead of turning it into the Unix epoch', () => {
    const dto = plainToInstance(UpdateWorksiteDto, { start_date: null });

    expect(invalidProperties(dto)).toEqual(['start_date']);
  });

  it('should reject a missing start_date on creation', () => {
    const dto = plainToInstance(CreateWorksiteDto, {
      id_client: '550e8400-e29b-41d4-a716-446655440000',
      name: 'RD 999',
      work_type: 'ROADWORKS',
      start_date: null,
    });

    expect(invalidProperties(dto)).toEqual(['start_date']);
  });
});
