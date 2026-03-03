import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyProgramming } from './entities/daily-programming.entity';
import { DailyProgrammingService } from './daily-programming.service';
import { DailyProgrammingController } from './daily-programming.controller';
import { Equipment } from '../equipment/entities/equipment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DailyProgramming, Equipment])],
  controllers: [DailyProgrammingController],
  providers: [DailyProgrammingService],
})
export class DailyProgrammingModule {}
