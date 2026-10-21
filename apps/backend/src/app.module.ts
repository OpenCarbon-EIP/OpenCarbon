import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from './users/users.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ApplicationModule } from './application/application.module';
import { ConsultantModule } from './consultant/consultant.module';
import { OfferModule } from './offer/offer.module';
import { CompanyModule } from './company/company.module';
import { GLOBAL_THROTTLE_LIMIT, GLOBAL_THROTTLE_TTL } from 'src/utils/macros';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: GLOBAL_THROTTLE_TTL,
        limit: GLOBAL_THROTTLE_LIMIT,
      },
    ]),
    PrismaModule,
    ApplicationModule,
    UsersModule,
    AuthModule,
    ConsultantModule,
    OfferModule,
    CompanyModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
