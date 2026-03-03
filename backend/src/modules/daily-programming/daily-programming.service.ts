import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyProgramming } from './entities/daily-programming.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { UpsertDailyDto } from './dto/upsert-daily.dto';
import { BulkUpsertDailyDto } from './dto/bulk-upsert.dto';

@Injectable()
export class DailyProgrammingService {
  constructor(
    @InjectRepository(DailyProgramming)
    private repo: Repository<DailyProgramming>,
    @InjectRepository(Equipment)
    private equipmentRepo: Repository<Equipment>,
  ) {}

  async getDayView(date: string) {
    const equipment = await this.equipmentRepo.find({
      where: { status: 'active' },
      relations: ['type'],
      order: { plate: 'ASC' },
    });

    const entries = await this.repo.find({
      where: { date },
      relations: ['driver', 'workSite'],
    });

    const entryMap = new Map(entries.map((e) => [e.equipmentId, e]));

    return equipment.map((eq) => ({
      equipment: eq,
      entry: entryMap.get(eq.id) ?? null,
    }));
  }

  async upsert(dto: UpsertDailyDto, userId?: string) {
    let entry = await this.repo.findOne({
      where: { equipmentId: dto.equipmentId, date: dto.date },
    });

    if (entry) {
      entry.driverId = dto.driverId ?? undefined;
      entry.workSiteId = dto.workSiteId ?? undefined;
      entry.observation = dto.observation ?? undefined;
      entry.updatedBy = userId ?? undefined;
    } else {
      entry = this.repo.create({
        date: dto.date,
        equipmentId: dto.equipmentId,
        driverId: dto.driverId,
        workSiteId: dto.workSiteId,
        observation: dto.observation,
        createdBy: userId,
      });
    }
    return this.repo.save(entry);
  }

  async bulkUpsert(dto: BulkUpsertDailyDto, userId?: string) {
    return Promise.all(dto.entries.map((e) => this.upsert(e, userId)));
  }

  async clearEntry(id: string) {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Entrada não encontrada');
    await this.repo.delete(id);
    return { message: 'Entrada removida' };
  }

  async copyFrom(sourceDate: string, targetDate?: string, userId?: string) {
    const target = targetDate ?? new Date().toISOString().split('T')[0];
    const sourceEntries = await this.repo.find({ where: { date: sourceDate } });
    let copied = 0;

    for (const src of sourceEntries) {
      const exists = await this.repo.findOne({
        where: { equipmentId: src.equipmentId, date: target },
      });
      if (!exists) {
        const newEntry = this.repo.create({
          date: target,
          equipmentId: src.equipmentId,
          driverId: src.driverId,
          workSiteId: src.workSiteId,
          observation: src.observation,
          createdBy: userId,
        });
        await this.repo.save(newEntry);
        copied++;
      }
    }
    return { copied, skipped: sourceEntries.length - copied };
  }

  async report(params: {
    startDate: string;
    endDate: string;
    equipmentId?: string;
    driverId?: string;
    workSiteId?: string;
  }) {
    const qb = this.repo
      .createQueryBuilder('dp')
      .leftJoinAndSelect('dp.equipment', 'equipment')
      .leftJoinAndSelect('equipment.type', 'type')
      .leftJoinAndSelect('dp.driver', 'driver')
      .leftJoinAndSelect('dp.workSite', 'workSite')
      .where('dp.date BETWEEN :start AND :end', {
        start: params.startDate,
        end: params.endDate,
      })
      .orderBy('dp.date', 'ASC')
      .addOrderBy('equipment.plate', 'ASC');

    if (params.equipmentId)
      qb.andWhere('dp.equipment_id = :eq', { eq: params.equipmentId });
    if (params.driverId)
      qb.andWhere('dp.driver_id = :dr', { dr: params.driverId });
    if (params.workSiteId)
      qb.andWhere('dp.work_site_id = :ws', { ws: params.workSiteId });

    return qb.getMany();
  }
}
