import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OfferStatus } from 'src/generated/prisma/client';

export class CreateOfferDto {
  @ApiProperty({ example: 'Carbon Audit for Factory' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Full carbon footprint assessment of manufacturing plant',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Bordeaux, France' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @IsNotEmpty()
  budget: number;

  @ApiProperty({
    example: '2025-12-31T00:00:00.000Z',
    description: 'ISO date string',
  })
  @IsDate()
  @Transform(({ value }) => new Date(value as string))
  @IsNotEmpty()
  deadline: Date;
}

export class UpdateOfferDto {
  @ApiPropertyOptional({ example: 'Updated Title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Bordeaux, France' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 20000 })
  @IsNumber()
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({ example: '2026-06-30T00:00:00.000Z' })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => new Date(value as string))
  deadline?: Date;

  @ApiPropertyOptional({ enum: ['OPEN', 'CLOSED'], example: 'CLOSED' })
  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;
}
