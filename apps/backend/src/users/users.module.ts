import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { ConsultantModule } from 'src/consultant/consultant.module';
import { CompanyModule } from 'src/company/company.module';

@Module({
  imports: [forwardRef(() => AuthModule), ConsultantModule, CompanyModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
