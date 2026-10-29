import { Module } from '@nestjs/common';
import { WorksiteController } from './worksite.controller';
import { WorksiteService } from './worksite.service';
import { ConsultantModule } from 'src/consultant/consultant.module';
import { ClientModule } from 'src/client/client.module';

@Module({
  imports: [ConsultantModule, ClientModule],
  controllers: [WorksiteController],
  providers: [WorksiteService],
  exports: [WorksiteService],
})
export class WorksiteModule {}
