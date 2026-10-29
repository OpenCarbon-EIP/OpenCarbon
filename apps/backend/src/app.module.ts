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
import { MissionModule } from './mission/mission.module';
import { ClientModule } from './client/client.module';
import { WorksiteModule } from './worksite/worksite.module';
import { AssessmentModule } from './assessment/assessment.module';
import { DocumentModule } from './document/document.module';
import { EmissionCategoryModule } from './emission-category/emission-category.module';
import { EmissionFactorModule } from './emission-factor/emission-factor.module';
import { ActivityLineModule } from './activity-line/activity-line.module';
import { ReductionActionModule } from './reduction-action/reduction-action.module';
import { ExtractionModule } from './extraction/extraction.module';
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
    MissionModule,
    ClientModule,
    WorksiteModule,
    AssessmentModule,
    DocumentModule,
    EmissionCategoryModule,
    EmissionFactorModule,
    ActivityLineModule,
    ReductionActionModule,
    ExtractionModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
