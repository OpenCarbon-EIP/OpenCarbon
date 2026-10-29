import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { IsOptionalNonNullable, toDate } from 'src/utils/dto-helpers';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MissionStatus, PaymentStatus } from 'src/generated/prisma/client';

export class CreateMissionDto {
  @ApiProperty({
    example: '550e8400-e29b-...',
    description:
      'UUID of the application to accept. The application is marked ACCEPTED',
  })
  @IsUUID()
  @IsNotEmpty()
  id_application: string;

  @ApiProperty({ example: '2026-11-01T00:00:00.000Z' })
  @IsDate()
  @Transform(toDate)
  @IsNotEmpty()
  start_date: Date;

  @ApiProperty({ example: '2027-02-28T00:00:00.000Z' })
  @IsDate()
  @Transform(toDate)
  @IsNotEmpty()
  estimated_end_date: Date;
}

export class UpdateMissionDto {
  @ApiPropertyOptional({
    example: '2026-11-01T00:00:00.000Z',
    description: 'Company only',
  })
  @IsDate()
  @Transform(toDate)
  @IsOptionalNonNullable()
  start_date?: Date;

  @ApiPropertyOptional({
    example: '2027-02-28T00:00:00.000Z',
    description: 'Company only',
  })
  @IsDate()
  @Transform(toDate)
  @IsOptionalNonNullable()
  estimated_end_date?: Date;

  @ApiPropertyOptional({
    example: '2027-02-15T00:00:00.000Z',
    description:
      'Company only. Set automatically when status becomes COMPLETED; null clears it',
    type: Date,
    nullable: true,
  })
  @IsDate()
  @Transform(toDate)
  @IsOptional()
  end_date?: Date | null;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    example: 'PAID',
    description: 'Company only',
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  payment_status?: PaymentStatus;

  @ApiPropertyOptional({
    enum: MissionStatus,
    example: 'COMPLETED',
    description: 'Company only',
  })
  @IsEnum(MissionStatus)
  @IsOptional()
  status?: MissionStatus;

  @ApiPropertyOptional({
    example: 40,
    description: 'Consultant only, between 0 and 100',
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;
}
