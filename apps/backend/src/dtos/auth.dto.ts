import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from 'src/generated/prisma/client';
import { RegistrationRole } from './user.dto';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Pass@#22',
    description: 'Must be a strong password',
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    enum: RegistrationRole,
    example: 'CONSULTANT',
    description: 'CONSULTANT or COMPANY — ADMIN cannot be self-assigned',
  })
  @IsNotEmpty()
  @IsEnum(RegistrationRole, {
    message: `role must be one of: ${Object.values(RegistrationRole).join(', ')}`,
  })
  role: Role;

  @ApiPropertyOptional({ example: 'A description' })
  @IsString()
  @IsOptional()
  description?: string;

  // Consultant fields

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Required when role is CONSULTANT',
  })
  @ValidateIf((o: RegisterDto) => o.role === 'CONSULTANT')
  @IsString()
  @IsNotEmpty()
  last_name?: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'Required when role is CONSULTANT',
  })
  @ValidateIf((o: RegisterDto) => o.role === 'CONSULTANT')
  @IsString()
  @IsNotEmpty()
  first_name?: string;

  @ApiPropertyOptional({
    example: 'Carbon Auditor',
    description: 'Required when role is CONSULTANT',
  })
  @ValidateIf((o: RegisterDto) => o.role === 'CONSULTANT')
  @IsString()
  @IsNotEmpty()
  professional_title?: string;

  // Company fields (optional during signup, created via POST /companies)

  @ApiPropertyOptional({
    example: 'GreenCorp',
    description: 'Optional company name during signup',
  })
  @IsString()
  @IsOptional()
  company_name?: string;

  @ApiPropertyOptional({
    example: 50,
    description: 'Number of employees (optional)',
  })
  @IsInt()
  @IsOptional()
  company_size?: number;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Str0ng!Pass' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
