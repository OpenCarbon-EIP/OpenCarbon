import { Module } from '@nestjs/common';
import { EmissionCategoryController } from './emission-category.controller';
import { EmissionCategoryService } from './emission-category.service';

@Module({
  controllers: [EmissionCategoryController],
  providers: [EmissionCategoryService],
  exports: [EmissionCategoryService],
})
export class EmissionCategoryModule {}
