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
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class EquipmentController {
  constructor(private readonly service: EquipmentService) {}

  @Get('equipment-types')
  findAllTypes() {
    return this.service.findAllTypes();
  }

  @Post('equipment-types')
  createType(@Body('name') name: string) {
    return this.service.createType(name);
  }

  @Get('equipment')
  findAll(
    @Query('status') status?: string,
    @Query('typeId') typeId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(status, typeId ? parseInt(typeId) : undefined, search);
  }

  @Get('equipment/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post('equipment')
  create(@Body() dto: CreateEquipmentDto) {
    return this.service.create(dto);
  }

  @Patch('equipment/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEquipmentDto) {
    return this.service.update(id, dto);
  }

  @Delete('equipment/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
