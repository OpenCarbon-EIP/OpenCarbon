import { Module } from '@nestjs/common';
import { ReductionActionController } from './reduction-action.controller';
import { ReductionActionService } from './reduction-action.service';
import { ConsultantModule } from 'src/consultant/consultant.module';
import { AssessmentModule } from 'src/assessment/assessment.module';
import { EmissionFactorModule } from 'src/emission-factor/emission-factor.module';

@Module({
  imports: [ConsultantModule, AssessmentModule, EmissionFactorModule],
  controllers: [ReductionActionController],
  providers: [ReductionActionService],
  exports: [ReductionActionService],
})
export class ReductionActionModule {}
