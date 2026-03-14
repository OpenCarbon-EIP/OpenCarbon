import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { ConsultantModule } from 'src/consultant/consultant.module';

@Module({
  imports: [AuthModule, UsersModule, ConsultantModule],
  controllers: [ApplicationController],
  providers: [ApplicationService],
  exports: [ApplicationService],
})
export class ApplicationModule {}
