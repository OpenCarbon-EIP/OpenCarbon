import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AssessmentStatus,
  AssessmentType,
  MaturityLevel,
} from 'src/generated/prisma/client';

export class CreateAssessmentDto {
  @ApiProperty({
    example: '550e8400-e29b-...',
    description: 'UUID of the assessed worksite',
  })
  @IsUUID()
  @IsNotEmpty()
  id_worksite: string;

  @ApiPropertyOptional({ enum: AssessmentType, example: 'FORECAST' })
  @IsEnum(AssessmentType)
  @IsOptional()
  type?: AssessmentType;

  @ApiPropertyOptional({ enum: MaturityLevel, example: 'INITIAL' })
  @IsEnum(MaturityLevel)
  @IsOptional()
  maturity_level?: MaturityLevel;

  @ApiPropertyOptional({ example: 'Bilan prévisionnel - réponse AO' })
  @IsString()
  @IsOptional()
  title?: string;
}

export class UpdateAssessmentDto {
  @ApiPropertyOptional({ enum: AssessmentType, example: 'ACTUAL' })
  @IsEnum(AssessmentType)
  @IsOptional()
  type?: AssessmentType;

  @ApiPropertyOptional({ enum: MaturityLevel, example: 'STANDARD' })
  @IsEnum(MaturityLevel)
  @IsOptional()
  maturity_level?: MaturityLevel;

  @ApiPropertyOptional({ example: 'Bilan réel - fin de chantier' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/reports/bilan.pdf',
  })
  @IsUrl()
  @IsOptional()
  report_url?: string;
}

export class UpdateAssessmentStatusDto {
  @ApiProperty({
    enum: AssessmentStatus,
    example: 'VALIDATED',
    description:
      'Allowed transitions: DRAFT → VALIDATED, VALIDATED → DRAFT, VALIDATED → SENT',
  })
  @IsEnum(AssessmentStatus)
  status: AssessmentStatus;
}

export class ListAssessmentsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by worksite UUID' })
  @IsUUID()
  @IsOptional()
  id_worksite?: string;
}
