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
  @Transform(({ value }) => new Date(value as string))
  @IsNotEmpty()
  start_date: Date;

  @ApiProperty({ example: '2027-02-28T00:00:00.000Z' })
  @IsDate()
  @Transform(({ value }) => new Date(value as string))
  @IsNotEmpty()
  estimated_end_date: Date;
}

export class UpdateMissionDto {
  @ApiPropertyOptional({
    example: '2026-11-01T00:00:00.000Z',
    description: 'Company only',
  })
  @IsDate()
  @Transform(({ value }) => new Date(value as string))
  @IsOptional()
  start_date?: Date;

  @ApiPropertyOptional({
    example: '2027-02-28T00:00:00.000Z',
    description: 'Company only',
  })
  @IsDate()
  @Transform(({ value }) => new Date(value as string))
  @IsOptional()
  estimated_end_date?: Date;

  @ApiPropertyOptional({
    example: '2027-02-15T00:00:00.000Z',
    description:
      'Company only. Set automatically when status becomes COMPLETED',
  })
  @IsDate()
  @Transform(({ value }) => new Date(value as string))
  @IsOptional()
  end_date?: Date;

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
