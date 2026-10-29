import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EmissionFactorSource,
  EmissionFactorStatus,
  Unit,
} from 'src/generated/prisma/client';

const CUSTOM_FACTOR_SOURCES = [
  EmissionFactorSource.FDES,
  EmissionFactorSource.SUPPLIER,
  EmissionFactorSource.CUSTOM,
] as const;

type CustomFactorSource = (typeof CUSTOM_FACTOR_SOURCES)[number];

export class CreateEmissionFactorDto {
  @ApiProperty({ enum: CUSTOM_FACTOR_SOURCES, example: 'FDES' })
  @IsIn(CUSTOM_FACTOR_SOURCES)
  source: CustomFactorSource;

  @ApiProperty({ example: 'Enrobé tiède EME2' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '0/14' })
  @IsString()
  @IsOptional()
  attribute?: string;

  @ApiPropertyOptional({ example: 'Du berceau à la sortie de centrale' })
  @IsString()
  @IsOptional()
  boundary?: string;

  @ApiProperty({ example: 52.4, description: 'kgCO2e per unit' })
  @IsNumber()
  @Min(0)
  value_kgco2e: number;

  @ApiProperty({ enum: Unit, example: 'TONNE' })
  @IsEnum(Unit)
  per_unit: Unit;

  @ApiPropertyOptional({ example: 20 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  uncertainty_pct?: number;

  @ApiPropertyOptional({ example: 'amont + fabrication' })
  @IsString()
  @IsOptional()
  scope_note?: string;

  @ApiPropertyOptional({ example: 'France continentale' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    example: 'INIES n°12345',
    description: 'Required when source is CUSTOM',
  })
  @ValidateIf(
    (o: CreateEmissionFactorDto) =>
      o.source === EmissionFactorSource.CUSTOM ||
      o.source_reference !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  source_reference?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsOptional()
  id_default_category?: string;
}

export class UpdateEmissionFactorDto {
  @ApiPropertyOptional({ enum: CUSTOM_FACTOR_SOURCES, example: 'FDES' })
  @IsIn(CUSTOM_FACTOR_SOURCES)
  @IsOptional()
  source?: CustomFactorSource;

  @ApiPropertyOptional({ example: 'Enrobé tiède EME2' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '0/14' })
  @IsString()
  @IsOptional()
  attribute?: string;

  @ApiPropertyOptional({ example: 'Du berceau à la sortie de centrale' })
  @IsString()
  @IsOptional()
  boundary?: string;

  @ApiPropertyOptional({ example: 52.4 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  value_kgco2e?: number;

  @ApiPropertyOptional({ enum: Unit, example: 'TONNE' })
  @IsEnum(Unit)
  @IsOptional()
  per_unit?: Unit;

  @ApiPropertyOptional({ example: 20 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  uncertainty_pct?: number;

  @ApiPropertyOptional({ example: 'amont + fabrication' })
  @IsString()
  @IsOptional()
  scope_note?: string;

  @ApiPropertyOptional({ example: 'France continentale' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    enum: [EmissionFactorStatus.VALID_SPECIFIC, EmissionFactorStatus.ARCHIVED],
    example: 'ARCHIVED',
  })
  @IsIn([EmissionFactorStatus.VALID_SPECIFIC, EmissionFactorStatus.ARCHIVED])
  @IsOptional()
  status?: EmissionFactorStatus;

  @ApiPropertyOptional({ example: 'INIES n°12345' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  source_reference?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsOptional()
  id_default_category?: string;
}

export class ListEmissionFactorsQueryDto {
  @ApiPropertyOptional({ example: 'gazole', description: 'Search in name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by default category UUID' })
  @IsUUID()
  @IsOptional()
  id_category?: string;

  @ApiPropertyOptional({ enum: Unit })
  @IsEnum(Unit)
  @IsOptional()
  per_unit?: Unit;

  @ApiPropertyOptional({ enum: EmissionFactorSource })
  @IsEnum(EmissionFactorSource)
  @IsOptional()
  source?: EmissionFactorSource;

  @ApiPropertyOptional({ example: 50, default: 50, maximum: 200 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  take?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  skip?: number;
}
