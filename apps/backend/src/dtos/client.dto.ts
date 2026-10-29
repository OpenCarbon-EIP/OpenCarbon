import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Normalized before validation so that "  Marie.Dupont@Example.com " is accepted and stored lowercased.
const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class CreateClientDto {
  @ApiProperty({ example: 'Colas Sud-Ouest' })
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @ApiPropertyOptional({ example: '552081317', description: '9-digit SIREN' })
  @Matches(/^\d{9}$/, { message: 'siren must be a 9-digit number' })
  @IsOptional()
  siren?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsInt()
  @Min(0)
  @IsOptional()
  employee_count?: number;

  @ApiPropertyOptional({ example: 'Travaux publics' })
  @IsString()
  @IsOptional()
  sector?: string;

  @ApiPropertyOptional({ example: 'Marie Dupont' })
  @IsString()
  @IsOptional()
  contact_name?: string;

  @ApiPropertyOptional({ example: 'marie.dupont@example.com' })
  @IsEmail()
  @Transform(normalizeEmail)
  @IsOptional()
  contact_email?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-...',
    description:
      'UUID of the OpenCarbon company account, if the client has one',
  })
  @IsUUID()
  @IsOptional()
  id_company?: string;
}

export class UpdateClientDto {
  @ApiPropertyOptional({ example: 'Colas Sud-Ouest' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  company_name?: string;

  @ApiPropertyOptional({ example: '552081317' })
  @Matches(/^\d{9}$/, { message: 'siren must be a 9-digit number' })
  @IsOptional()
  siren?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsInt()
  @Min(0)
  @IsOptional()
  employee_count?: number;

  @ApiPropertyOptional({ example: 'Travaux publics' })
  @IsString()
  @IsOptional()
  sector?: string;

  @ApiPropertyOptional({ example: 'Marie Dupont' })
  @IsString()
  @IsOptional()
  contact_name?: string;

  @ApiPropertyOptional({ example: 'marie.dupont@example.com' })
  @IsEmail()
  @Transform(normalizeEmail)
  @IsOptional()
  contact_email?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsOptional()
  id_company?: string;
}
