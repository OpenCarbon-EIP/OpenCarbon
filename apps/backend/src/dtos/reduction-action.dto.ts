import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActionStatus } from 'src/generated/prisma/client';

export class CreateReductionActionDto {
  @ApiProperty({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsNotEmpty()
  id_assessment: string;

  @ApiProperty({ example: 'Remplacer le GNR par du HVO' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({
    example: 'HVO100 disponible chez le fournisseur local',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 2500,
    description:
      'Computed from the activity line and the alternative factor when omitted',
  })
  @IsNumber()
  @IsOptional()
  estimated_reduction_kgco2e?: number;

  @ApiPropertyOptional({ enum: ActionStatus, example: 'PROPOSED' })
  @IsEnum(ActionStatus)
  @IsOptional()
  status?: ActionStatus;

  @ApiPropertyOptional({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsOptional()
  id_activity_line?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsOptional()
  id_alternative_factor?: string;
}

export class UpdateReductionActionDto {
  @ApiPropertyOptional({ example: 'Remplacer le GNR par du HVO' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({
    example: 'HVO100 disponible chez le fournisseur local',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 2500 })
  @IsNumber()
  @IsOptional()
  estimated_reduction_kgco2e?: number;

  @ApiPropertyOptional({ enum: ActionStatus, example: 'RETAINED' })
  @IsEnum(ActionStatus)
  @IsOptional()
  status?: ActionStatus;

  @ApiPropertyOptional({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsOptional()
  id_activity_line?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsOptional()
  id_alternative_factor?: string;
}

export class ListReductionActionsQueryDto {
  @ApiProperty({ description: 'Assessment UUID' })
  @IsUUID()
  @IsNotEmpty()
  id_assessment: string;
}
