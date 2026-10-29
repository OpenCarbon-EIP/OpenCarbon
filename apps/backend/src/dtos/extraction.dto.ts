import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DataOrigin,
  ExtractionStatus,
  Unit,
} from 'src/generated/prisma/client';

export class CreateExtractionDto {
  @ApiProperty({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsNotEmpty()
  id_document: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    example: { x: 0.1, y: 0.42, width: 0.8, height: 0.05 },
  })
  @IsObject()
  @IsOptional()
  bounding_box?: Record<string, unknown>;

  @ApiProperty({
    example: { designation: 'GNR', quantite: '1 250,5', unite: 'L' },
    description: 'Everything the AI read, as is',
  })
  @IsObject()
  raw_values: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'Gazole non routier' })
  @IsString()
  @IsOptional()
  product_label?: string;

  @ApiPropertyOptional({ example: 1250.5 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ enum: Unit, example: 'LITRE' })
  @IsEnum(Unit)
  @IsOptional()
  unit?: Unit;

  @ApiPropertyOptional({ example: '2026-03-31T00:00:00.000Z' })
  @IsDate()
  @Transform(({ value }) => new Date(value as string))
  @IsOptional()
  document_date?: Date;

  @ApiPropertyOptional({ example: 'TotalEnergies' })
  @IsString()
  @IsOptional()
  supplier_name?: string;

  @ApiPropertyOptional({ example: '33000 Bordeaux' })
  @IsString()
  @IsOptional()
  supplier_address?: string;

  @ApiProperty({ example: 0.92, description: 'Between 0 and 1' })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiPropertyOptional({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsOptional()
  id_proposed_category?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsOptional()
  id_proposed_factor?: string;
}

const REVIEW_STATUSES = [
  ExtractionStatus.ACCEPTED,
  ExtractionStatus.CORRECTED,
  ExtractionStatus.REJECTED,
] as const;

type ReviewStatus = (typeof REVIEW_STATUSES)[number];

const createsActivityLine = (o: ReviewExtractionDto): boolean =>
  o.status !== ExtractionStatus.REJECTED;

export class ReviewExtractionDto {
  @ApiProperty({ enum: REVIEW_STATUSES, example: 'CORRECTED' })
  @IsIn(REVIEW_STATUSES)
  status: ReviewStatus;

  @ApiPropertyOptional({
    example: '550e8400-e29b-...',
    description:
      'Assessment receiving the activity line. Required unless status is REJECTED',
  })
  @ValidateIf(createsActivityLine)
  @IsUUID()
  @IsNotEmpty()
  id_assessment?: string;

  @ApiProperty({ enum: DataOrigin, example: 'MEASURED' })
  @ValidateIf(createsActivityLine)
  @IsEnum(DataOrigin)
  data_origin?: DataOrigin;

  @ApiPropertyOptional({
    example: 'Gazole non routier',
    description: 'CORRECTED only: overrides the AI value',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ example: 1250.5 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ enum: Unit, example: 'LITRE' })
  @IsEnum(Unit)
  @IsOptional()
  unit?: Unit;

  @ApiPropertyOptional({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsOptional()
  id_category?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsOptional()
  id_emission_factor?: string;

  @ApiPropertyOptional({ example: 2.4 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  conversion_factor?: number;

  @ApiPropertyOptional({ example: 'béton 2,4 t/m³' })
  @IsString()
  @IsOptional()
  conversion_note?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  data_uncertainty_pct?: number;

  @ApiPropertyOptional({ example: 'Doublon de la facture du 28/03' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class ListExtractionsQueryDto {
  @ApiProperty({ description: 'Document UUID' })
  @IsUUID()
  @IsNotEmpty()
  id_document: string;

  @ApiPropertyOptional({ enum: ExtractionStatus })
  @IsEnum(ExtractionStatus)
  @IsOptional()
  status?: ExtractionStatus;
}
