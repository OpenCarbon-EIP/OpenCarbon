import {
  IsEnum,
  IsHash,
  IsInt,
  IsMimeType,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from 'src/generated/prisma/client';

export class CreateDocumentDto {
  @ApiProperty({ example: '550e8400-e29b-...' })
  @IsUUID()
  @IsNotEmpty()
  id_worksite: string;

  @ApiProperty({ example: 'facture-carburant-mars.pdf' })
  @IsString()
  @IsNotEmpty()
  file_name: string;

  @ApiProperty({
    example: 'https://storage.example.com/documents/facture-carburant-mars.pdf',
  })
  @IsUrl()
  storage_url: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsMimeType()
  mime_type: string;

  @ApiProperty({ example: 245760 })
  @IsInt()
  @IsPositive()
  size_bytes: number;

  @ApiProperty({
    example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    description: 'SHA-256 of the file content, used to detect duplicates',
  })
  @IsHash('sha256')
  sha256: string;

  @ApiPropertyOptional({ enum: DocumentType, example: 'FUEL_INVOICE' })
  @IsEnum(DocumentType)
  @IsOptional()
  detected_type?: DocumentType;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional({ example: 'facture-carburant-mars.pdf' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  file_name?: string;

  @ApiPropertyOptional({ enum: DocumentType, example: 'FUEL_INVOICE' })
  @IsEnum(DocumentType)
  @IsOptional()
  detected_type?: DocumentType;
}

export class ListDocumentsQueryDto {
  @ApiProperty({ description: 'Worksite UUID' })
  @IsUUID()
  @IsNotEmpty()
  id_worksite: string;
}
