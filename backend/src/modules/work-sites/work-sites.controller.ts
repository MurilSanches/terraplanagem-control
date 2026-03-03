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
import { WorkSitesService } from './work-sites.service';
import { CreateWorkSiteDto } from './dto/create-work-site.dto';
import { UpdateWorkSiteDto } from './dto/update-work-site.dto';

@UseGuards(JwtAuthGuard)
@Controller('work-sites')
export class WorkSitesController {
  constructor(private readonly service: WorkSitesService) {}

  @Get()
  findAll(@Query('search') search?: string, @Query('isActive') isActive?: string) {
    return this.service.findAll(search, isActive);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateWorkSiteDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWorkSiteDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
