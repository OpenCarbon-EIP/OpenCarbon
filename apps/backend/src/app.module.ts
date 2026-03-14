import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from '@prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ApplicationModule } from './application/application.module';
import { ConsultantModule } from './consultant/consultant.module';
import { OfferModule } from './offer/offer.module';
import { CompanyModule } from './company/company.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ApplicationModule,
    UsersModule,
    AuthModule,
    ConsultantModule,
    OfferModule,
    CompanyModule,
  ],
})
export class AppModule {}
