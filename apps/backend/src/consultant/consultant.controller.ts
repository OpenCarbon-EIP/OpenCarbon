import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConsultantService } from './consultant.service';

@ApiTags('Consultants')
@Controller('consultant')
export class ConsultantController {
  constructor(private readonly consultantService: ConsultantService) {}
}
