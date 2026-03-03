import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkSite } from './entities/work-site.entity';
import { CreateWorkSiteDto } from './dto/create-work-site.dto';
import { UpdateWorkSiteDto } from './dto/update-work-site.dto';

@Injectable()
export class WorkSitesService {
  constructor(
    @InjectRepository(WorkSite)
    private repo: Repository<WorkSite>,
  ) {}

  findAll(search?: string, isActive?: string) {
    const qb = this.repo.createQueryBuilder('w').orderBy('w.name', 'ASC');
    if (isActive !== undefined) qb.where('w.is_active = :ia', { ia: isActive === 'true' });
    if (search) qb.andWhere('w.name ILIKE :s', { s: `%${search}%` });
    return qb.getMany();
  }

  async findOne(id: string) {
    const ws = await this.repo.findOne({ where: { id } });
    if (!ws) throw new NotFoundException('Obra não encontrada');
    return ws;
  }

  create(dto: CreateWorkSiteDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateWorkSiteDto) {
    const ws = await this.findOne(id);
    Object.assign(ws, dto);
    return this.repo.save(ws);
  }

  async remove(id: string) {
    const ws = await this.findOne(id);
    ws.isActive = false;
    return this.repo.save(ws);
  }
}
