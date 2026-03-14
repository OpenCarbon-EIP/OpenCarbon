import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from 'src/generated/prisma/client';

export enum RegistrationRole {
  CONSULTANT = 'CONSULTANT',
  COMPANY = 'COMPANY',
}

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    enum: RegistrationRole,
    description: 'User role (ADMIN cannot be self-assigned)',
    example: 'CONSULTANT',
  })
  @IsOptional()
  @IsEnum(RegistrationRole, {
    message: `role must be one of: ${Object.values(RegistrationRole).join(', ')}`,
  })
  role?: Role;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'newpassword', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiPropertyOptional({ example: 'photo_url' })
  @IsString()
  @IsOptional()
  photo_url?: string;

  @ApiPropertyOptional({ example: 'Senior Consultant' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'My Company' })
  @IsString()
  @IsOptional()
  company_name?: string;
}
