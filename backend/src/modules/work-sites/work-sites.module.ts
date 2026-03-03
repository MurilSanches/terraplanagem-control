import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkSite } from './entities/work-site.entity';
import { WorkSitesService } from './work-sites.service';
import { WorkSitesController } from './work-sites.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WorkSite])],
  controllers: [WorkSitesController],
  providers: [WorkSitesService],
  exports: [WorkSitesService, TypeOrmModule],
})
export class WorkSitesModule {}
