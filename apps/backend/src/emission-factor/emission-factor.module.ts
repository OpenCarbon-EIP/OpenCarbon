import { Module } from '@nestjs/common';
import { EmissionFactorController } from './emission-factor.controller';
import { EmissionFactorService } from './emission-factor.service';
import { ConsultantModule } from 'src/consultant/consultant.module';
import { EmissionCategoryModule } from 'src/emission-category/emission-category.module';

@Module({
  imports: [ConsultantModule, EmissionCategoryModule],
  controllers: [EmissionFactorController],
  providers: [EmissionFactorService],
  exports: [EmissionFactorService],
})
export class EmissionFactorModule {}
