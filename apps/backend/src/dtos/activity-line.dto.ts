import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DataOrigin, Unit } from 'src/generated/prisma/client';

export class CreateActivityLineDto {
  @ApiProperty({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsNotEmpty()
  id_assessment: string;

  @ApiProperty({ example: 'GNR pelle 20 t - mars' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 1250.5 })
  @IsNumber()
  @IsPositive()
  input_quantity: number;

  @ApiProperty({ enum: Unit, example: 'LITRE' })
  @IsEnum(Unit)
  input_unit: Unit;

  @ApiPropertyOptional({
    example: 2.4,
    description:
      'Required when input_unit differs from the emission factor unit (e.g. m³ → t)',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  conversion_factor?: number;

  @ApiPropertyOptional({ example: 'béton 2,4 t/m³' })
  @IsString()
  @IsOptional()
  conversion_note?: string;

  @ApiProperty({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsNotEmpty()
  id_emission_factor: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-...',
    description: 'Defaults to the emission factor default category',
  })
  @IsUUID()
  @IsOptional()
  id_category?: string;

  @ApiProperty({ enum: DataOrigin, example: 'MEASURED' })
  @IsEnum(DataOrigin)
  data_origin: DataOrigin;

  @ApiPropertyOptional({
    example: 5,
    description:
      'Defaults to 5 / 15 / 50 % for MEASURED / CALCULATED / ESTIMATED',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  data_uncertainty_pct?: number;

  @ApiPropertyOptional({ example: 'Relevé de cuve du 31/03' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class UpdateActivityLineDto {
  @ApiPropertyOptional({ example: 'GNR pelle 20 t - mars' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ example: 1250.5 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  input_quantity?: number;

  @ApiPropertyOptional({ enum: Unit, example: 'LITRE' })
  @IsEnum(Unit)
  @IsOptional()
  input_unit?: Unit;

  @ApiPropertyOptional({ example: 2.4 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  conversion_factor?: number;

  @ApiPropertyOptional({ example: 'béton 2,4 t/m³' })
  @IsString()
  @IsOptional()
  conversion_note?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-...',
    description: 'Changing it copies the new factor values into the line',
  })
  @IsUUID()
  @IsOptional()
  id_emission_factor?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsOptional()
  id_category?: string;

  @ApiPropertyOptional({ enum: DataOrigin, example: 'CALCULATED' })
  @IsEnum(DataOrigin)
  @IsOptional()
  data_origin?: DataOrigin;

  @ApiPropertyOptional({ example: 15 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  data_uncertainty_pct?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_validated?: boolean;

  @ApiPropertyOptional({ example: 'Relevé de cuve du 31/03' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class ListActivityLinesQueryDto {
  @ApiProperty({ description: 'Assessment UUID' })
  @IsUUID()
  @IsNotEmpty()
  id_assessment: string;
}
