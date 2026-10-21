import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyRole } from 'src/generated/prisma/client';

export class CreateCompanyDto {
  @ApiProperty({ example: 'OpenCarbon', description: 'Name of the company' })
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @ApiPropertyOptional({ example: 50, description: 'Number of employees' })
  @IsInt()
  @IsOptional()
  company_size?: number;

  @ApiPropertyOptional({
    example: 'Carbon audit consulting',
    description: 'Company description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://opencarbon.com/logo.png',
    description: 'Logo URL',
  })
  @IsString()
  @IsOptional()
  logo_url?: string;
}

export class CreateInvitationDto {
  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'Optional target email',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    enum: CompanyRole,
    example: CompanyRole.MEMBER,
    description: 'Target role in company',
  })
  @IsEnum(CompanyRole)
  @IsOptional()
  role?: CompanyRole;
}

export class AcceptInvitationDto {
  @ApiProperty({ example: 'abc123token', description: 'Invitation token' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class CreateCompanyDomainDto {
  @ApiProperty({
    example: 'epitech.eu',
    description: 'Domain name to allow for auto-join',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^@?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/, {
    message:
      'domain must be a valid domain name (e.g. epitech.eu or @epitech.eu)',
  })
  domain: string;
}
