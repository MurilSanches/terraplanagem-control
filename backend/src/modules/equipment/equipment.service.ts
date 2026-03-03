import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from './entities/equipment.entity';
import { EquipmentType } from './entities/equipment-type.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private repo: Repository<Equipment>,
    @InjectRepository(EquipmentType)
    private typeRepo: Repository<EquipmentType>,
  ) {}

  findAllTypes() {
    return this.typeRepo.find({ order: { name: 'ASC' } });
  }

  async createType(name: string) {
    const type = this.typeRepo.create({ name });
    return this.typeRepo.save(type);
  }

  async findAll(status?: string, typeId?: number, search?: string) {
    const qb = this.repo
      .createQueryBuilder('eq')
      .leftJoinAndSelect('eq.type', 'type')
      .orderBy('eq.plate', 'ASC');

    if (status) qb.andWhere('eq.status = :status', { status });
    if (typeId) qb.andWhere('eq.typeId = :typeId', { typeId });
    if (search)
      qb.andWhere('(eq.plate ILIKE :s OR eq.chassis ILIKE :s)', {
        s: `%${search}%`,
      });

    return qb.getMany();
  }

  async findOne(id: string) {
    const eq = await this.repo.findOne({ where: { id } });
    if (!eq) throw new NotFoundException('Equipamento não encontrado');
    return eq;
  }

  async create(dto: CreateEquipmentDto) {
    if (!dto.plate && !dto.chassis)
      throw new BadRequestException('Informe placa ou chassi');
    const eq = this.repo.create(dto);
    return this.repo.save(eq);
  }

  async update(id: string, dto: UpdateEquipmentDto) {
    const eq = await this.findOne(id);
    Object.assign(eq, dto);
    return this.repo.save(eq);
  }

  async remove(id: string) {
    const eq = await this.findOne(id);
    eq.status = 'inactive';
    return this.repo.save(eq);
  }
}
