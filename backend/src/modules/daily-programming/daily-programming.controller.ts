import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Res,
  Header,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseDatePipe } from '../../common/pipes/parse-date.pipe';
import { DailyProgrammingService } from './daily-programming.service';
import { UpsertDailyDto } from './dto/upsert-daily.dto';
import { BulkUpsertDailyDto } from './dto/bulk-upsert.dto';

@UseGuards(JwtAuthGuard)
@Controller('daily')
export class DailyProgrammingController {
  constructor(private readonly service: DailyProgrammingService) {}

  @Get()
  getDayView(@Query('date', ParseDatePipe) date: string) {
    return this.service.getDayView(date);
  }

  @Post()
  upsert(@Body() dto: UpsertDailyDto, @CurrentUser() user: { id: string }) {
    return this.service.upsert(dto, user?.id);
  }

  @Post('bulk')
  bulkUpsert(@Body() dto: BulkUpsertDailyDto, @CurrentUser() user: { id: string }) {
    return this.service.bulkUpsert(dto, user?.id);
  }

  @Post('copy-from/:date')
  copyFrom(
    @Param('date', ParseDatePipe) sourceDate: string,
    @Query('targetDate', ParseDatePipe) targetDate: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.service.copyFrom(sourceDate, targetDate, user?.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.clearEntry(id);
  }

  @Get('report')
  async report(
    @Query('startDate', ParseDatePipe) startDate: string,
    @Query('endDate', ParseDatePipe) endDate: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('driverId') driverId?: string,
    @Query('workSiteId') workSiteId?: string,
    @Query('format') format?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const diffDays =
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000;
    if (diffDays < 0) {
      throw new BadRequestException('startDate deve ser anterior ou igual a endDate');
    }
    if (diffDays > 90) {
      throw new BadRequestException('O intervalo máximo do relatório é de 90 dias');
    }

    const data = await this.service.report({
      startDate,
      endDate,
      equipmentId,
      driverId,
      workSiteId,
    });

    if (format === 'csv' && res) {
      const header = 'Data,Equipamento,Placa,Tipo,Motorista,Obra,Observação\n';
      const rows = data.map((r) =>
        [
          r.date,
          r.equipment?.model ?? '',
          r.equipment?.plate ?? r.equipment?.chassis ?? '',
          r.equipment?.type?.name ?? '',
          r.driver?.name ?? '',
          r.workSite?.name ?? '',
          (r.observation ?? '').replace(/,/g, ';'),
        ].join(','),
      );
      const csv = header + rows.join('\n');
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="programacao_${startDate}_${endDate}.csv"`,
      });
      return csv;
    }

    return data;
  }
}
