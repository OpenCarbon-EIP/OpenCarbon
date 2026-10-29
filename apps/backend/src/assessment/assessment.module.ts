import { Module } from '@nestjs/common';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { ConsultantModule } from 'src/consultant/consultant.module';
import { WorksiteModule } from 'src/worksite/worksite.module';

@Module({
  imports: [ConsultantModule, WorksiteModule],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
