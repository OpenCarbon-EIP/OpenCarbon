import { Module } from '@nestjs/common';
import { ActivityLineController } from './activity-line.controller';
import { ActivityLineService } from './activity-line.service';
import { ConsultantModule } from 'src/consultant/consultant.module';
import { AssessmentModule } from 'src/assessment/assessment.module';
import { EmissionFactorModule } from 'src/emission-factor/emission-factor.module';
import { EmissionCategoryModule } from 'src/emission-category/emission-category.module';

@Module({
  imports: [
    ConsultantModule,
    AssessmentModule,
    EmissionFactorModule,
    EmissionCategoryModule,
  ],
  controllers: [ActivityLineController],
  providers: [ActivityLineService],
  exports: [ActivityLineService],
})
export class ActivityLineModule {}
