import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({
    example: '550e8400-e29b-...',
    description: 'UUID of the offer to apply to',
  })
  @IsUUID()
  @IsNotEmpty()
  id_offer: string;

  @ApiProperty({
    example:
      'I am interested in this carbon audit mission. I have 6 years of experience.',
    description: 'Application message / cover letter',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
