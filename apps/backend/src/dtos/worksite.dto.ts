import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { IsOptionalNonNullable, toDate } from 'src/utils/dto-helpers';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationalBoundary, WorkType } from 'src/generated/prisma/client';

export class CreateWorksiteDto {
  @ApiProperty({
    example: '550e8400-e29b-...',
    description: 'UUID of the client owning the worksite',
  })
  @IsUUID()
  @IsNotEmpty()
  id_client: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-...',
    description: 'UUID of the mission this worksite is assessed for',
  })
  @IsUUID()
  @IsOptional()
  id_mission?: string;

  @ApiProperty({ example: 'Réfection RD 936 - Tranche 2' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Département de la Gironde' })
  @IsString()
  @IsOptional()
  project_owner?: string;

  @ApiPropertyOptional({ example: 'MP-2026-0412' })
  @IsString()
  @IsOptional()
  contract_reference?: string;

  @ApiPropertyOptional({ example: 'RD 936, 33750 Beychac-et-Caillau' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ enum: WorkType, example: 'ROADWORKS' })
  @IsEnum(WorkType)
  work_type: WorkType;

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  @IsDate()
  @Transform(toDate)
  @IsNotEmpty()
  start_date: Date;

  @ApiPropertyOptional({ example: '2026-09-30T00:00:00.000Z' })
  @IsDate()
  @Transform(toDate)
  @IsOptional()
  end_date?: Date;

  @ApiPropertyOptional({ example: 7000 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  functional_unit_value?: number;

  @ApiPropertyOptional({ example: 'm² de chaussée' })
  @IsString()
  @IsOptional()
  functional_unit_label?: string;

  @ApiPropertyOptional({
    enum: OrganizationalBoundary,
    example: 'OPERATIONAL_CONTROL',
  })
  @IsEnum(OrganizationalBoundary)
  @IsOptional()
  organizational_boundary?: OrganizationalBoundary;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  subcontractors_included?: boolean;

  @ApiPropertyOptional({
    example: 'Sous-traitance de terrassement incluse au périmètre',
  })
  @IsString()
  @IsOptional()
  boundary_justification?: string;
}

export class UpdateWorksiteDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsOptional()
  id_mission?: string;

  @ApiPropertyOptional({ example: 'Réfection RD 936 - Tranche 2' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Département de la Gironde' })
  @IsString()
  @IsOptional()
  project_owner?: string;

  @ApiPropertyOptional({ example: 'MP-2026-0412' })
  @IsString()
  @IsOptional()
  contract_reference?: string;

  @ApiPropertyOptional({ example: 'RD 936, 33750 Beychac-et-Caillau' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ enum: WorkType, example: 'ROADWORKS' })
  @IsEnum(WorkType)
  @IsOptional()
  work_type?: WorkType;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsDate()
  @Transform(toDate)
  @IsOptionalNonNullable()
  start_date?: Date;

  @ApiPropertyOptional({
    example: '2026-09-30T00:00:00.000Z',
    description: 'null clears it',
    type: Date,
    nullable: true,
  })
  @IsDate()
  @Transform(toDate)
  @IsOptional()
  end_date?: Date | null;

  @ApiPropertyOptional({ example: 7000 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  functional_unit_value?: number;

  @ApiPropertyOptional({ example: 'm² de chaussée' })
  @IsString()
  @IsOptional()
  functional_unit_label?: string;

  @ApiPropertyOptional({
    enum: OrganizationalBoundary,
    example: 'OPERATIONAL_CONTROL',
  })
  @IsEnum(OrganizationalBoundary)
  @IsOptional()
  organizational_boundary?: OrganizationalBoundary;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  subcontractors_included?: boolean;

  @ApiPropertyOptional({
    example: 'Sous-traitance de terrassement incluse au périmètre',
  })
  @IsString()
  @IsOptional()
  boundary_justification?: string;
}

export class ListWorksitesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by client UUID' })
  @IsUUID()
  @IsOptional()
  id_client?: string;

  @ApiPropertyOptional({ description: 'Filter by mission UUID' })
  @IsUUID()
  @IsOptional()
  id_mission?: string;
}
