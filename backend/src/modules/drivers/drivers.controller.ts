import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseDatePipe } from '../../common/pipes/parse-date.pipe';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { CreateAbsenceDto } from './dto/create-absence.dto';

@UseGuards(JwtAuthGuard)
@Controller('drivers')
export class DriversController {
  constructor(private readonly service: DriversService) {}

  @Get()
  findAll(@Query('status') status?: string, @Query('search') search?: string) {
    return this.service.findAll(status, search);
  }

  @Get('absent')
  getAbsent(@Query('date', ParseDatePipe) date: string) {
    return this.service.getAbsentDriversOnDate(date);
  }

  @Get('available')
  getAvailable(@Query('date', ParseDatePipe) date: string) {
    return this.service.getAvailableDrivers(date);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDriverDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDriverDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Get(':id/absences')
  getAbsences(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getAbsences(id);
  }

  @Post(':id/absences')
  createAbsence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAbsenceDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createAbsence(id, dto, user?.id);
  }

  @Delete(':id/absences/:absenceId')
  removeAbsence(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('absenceId', ParseUUIDPipe) absenceId: string,
  ) {
    return this.service.removeAbsence(id, absenceId);
  }
}
