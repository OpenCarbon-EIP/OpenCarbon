import { Module } from '@nestjs/common';
import { ExtractionController } from './extraction.controller';
import { ExtractionService } from './extraction.service';
import { ConsultantModule } from 'src/consultant/consultant.module';
import { DocumentModule } from 'src/document/document.module';
import { AssessmentModule } from 'src/assessment/assessment.module';
import { ActivityLineModule } from 'src/activity-line/activity-line.module';
import { EmissionFactorModule } from 'src/emission-factor/emission-factor.module';
import { EmissionCategoryModule } from 'src/emission-category/emission-category.module';

@Module({
  imports: [
    ConsultantModule,
    DocumentModule,
    AssessmentModule,
    ActivityLineModule,
    EmissionFactorModule,
    EmissionCategoryModule,
  ],
  controllers: [ExtractionController],
  providers: [ExtractionService],
  exports: [ExtractionService],
})
export class ExtractionModule {}
