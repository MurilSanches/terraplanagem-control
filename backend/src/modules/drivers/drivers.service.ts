import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Driver } from './entities/driver.entity';
import { DriverAbsence } from './entities/driver-absence.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { CreateAbsenceDto } from './dto/create-absence.dto';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private repo: Repository<Driver>,
    @InjectRepository(DriverAbsence)
    private absenceRepo: Repository<DriverAbsence>,
  ) {}

  findAll(status?: string, search?: string) {
    const qb = this.repo
      .createQueryBuilder('d')
      .orderBy('d.name', 'ASC');
    if (status) qb.andWhere('d.status = :status', { status });
    if (search) qb.andWhere('d.name ILIKE :s', { s: `%${search}%` });
    return qb.getMany();
  }

  async findOne(id: string) {
    const driver = await this.repo.findOne({
      where: { id },
      relations: ['absences'],
    });
    if (!driver) throw new NotFoundException('Motorista não encontrado');
    return driver;
  }

  async create(dto: CreateDriverDto) {
    const driver = this.repo.create(dto);
    return this.repo.save(driver);
  }

  async update(id: string, dto: UpdateDriverDto) {
    const driver = await this.findOne(id);
    Object.assign(driver, dto);
    return this.repo.save(driver);
  }

  async remove(id: string) {
    const driver = await this.findOne(id);
    driver.status = 'inactive';
    return this.repo.save(driver);
  }

  // Absences
  async getAbsences(driverId: string) {
    await this.findOne(driverId);
    return this.absenceRepo.find({
      where: { driverId },
      order: { startDate: 'DESC' },
    });
  }

  async createAbsence(driverId: string, dto: CreateAbsenceDto, userId?: string) {
    if (dto.endDate < dto.startDate)
      throw new BadRequestException('Data fim deve ser >= data início');
    await this.findOne(driverId);
    const absence = this.absenceRepo.create({ driverId, ...dto });
    if (userId) (absence as any).createdBy = userId;
    return this.absenceRepo.save(absence);
  }

  async removeAbsence(driverId: string, absenceId: string) {
    const absence = await this.absenceRepo.findOne({
      where: { id: absenceId, driverId },
    });
    if (!absence) throw new NotFoundException('Ausência não encontrada');
    await this.absenceRepo.remove(absence);
    return { message: 'Ausência removida' };
  }

  /** Returns IDs of drivers absent on a given date */
  async getAbsentDriverIds(date: string): Promise<string[]> {
    const absences = await this.absenceRepo
      .createQueryBuilder('a')
      .where('a.start_date <= :date', { date })
      .andWhere('a.end_date >= :date', { date })
      .select('a.driver_id', 'driverId')
      .distinct(true)
      .getRawMany();
    return absences.map((a) => a.driverId);
  }

  /** Returns drivers active and not absent on a given date */
  async getAvailableDrivers(date: string) {
    const absentIds = await this.getAbsentDriverIds(date);
    const qb = this.repo
      .createQueryBuilder('d')
      .where('d.status = :status', { status: 'active' })
      .orderBy('d.name', 'ASC');
    if (absentIds.length > 0)
      qb.andWhere('d.id NOT IN (:...ids)', { ids: absentIds });
    return qb.getMany();
  }

  async getAbsentDriversOnDate(date: string) {
    const absentIds = await this.getAbsentDriverIds(date);
    if (!absentIds.length) return [];
    return this.repo
      .createQueryBuilder('d')
      .where('d.id IN (:...ids)', { ids: absentIds })
      .getMany();
  }
}
