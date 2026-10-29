import { Module } from '@nestjs/common';
import { MissionController } from './mission.controller';
import { MissionService } from './mission.service';
import { ConsultantModule } from 'src/consultant/consultant.module';
import { CompanyModule } from 'src/company/company.module';

@Module({
  imports: [ConsultantModule, CompanyModule],
  controllers: [MissionController],
  providers: [MissionService],
  exports: [MissionService],
})
export class MissionModule {}
