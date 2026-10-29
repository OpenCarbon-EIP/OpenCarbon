import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateClientDto, UpdateClientDto } from 'src/dtos/client.dto';

describe('Client DTOs', () => {
  it.each([CreateClientDto, UpdateClientDto])(
    '%p should trim and lowercase contact_email before validating it',
    (Dto) => {
      const dto = plainToInstance(Dto, {
        company_name: 'Colas',
        contact_email: '  Marie.Dupont@Example.com ',
      });

      expect(validateSync(dto)).toHaveLength(0);
      expect(dto.contact_email).toBe('marie.dupont@example.com');
    },
  );

  it('should still reject an invalid contact_email', () => {
    const dto = plainToInstance(CreateClientDto, {
      company_name: 'Colas',
      contact_email: 'not-an-email',
    });

    expect(validateSync(dto).map((error) => error.property)).toEqual([
      'contact_email',
    ]);
  });
});
