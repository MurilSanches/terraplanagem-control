import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { Driver } from './entities/driver.entity';
import { DriverAbsence } from './entities/driver-absence.entity';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('DriversService', () => {
  let service: DriversService;
  let driverRepo: ReturnType<typeof mockRepo>;
  let absenceRepo: ReturnType<typeof mockRepo>;

  const TODAY = '2026-03-03';
  const DRIVER_ID = 'driver-uuid-1';

  beforeEach(async () => {
    driverRepo = mockRepo();
    absenceRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversService,
        { provide: getRepositoryToken(Driver), useValue: driverRepo },
        { provide: getRepositoryToken(DriverAbsence), useValue: absenceRepo },
      ],
    }).compile();

    service = module.get(DriversService);
  });

  // ── createAbsence ──────────────────────────────────────────────────────────

  describe('createAbsence', () => {
    it('cria ausência com datas válidas', async () => {
      driverRepo.findOne.mockResolvedValue({ id: DRIVER_ID, name: 'Lucas' });
      const absence = { id: 'abs-1', driverId: DRIVER_ID, reason: 'sick', startDate: TODAY, endDate: TODAY };
      absenceRepo.create.mockReturnValue(absence);
      absenceRepo.save.mockResolvedValue(absence);

      const result = await service.createAbsence(DRIVER_ID, {
        reason: 'sick',
        startDate: TODAY,
        endDate: TODAY,
      });

      expect(result).toEqual(absence);
      expect(absenceRepo.save).toHaveBeenCalled();
    });

    it('lança BadRequestException se data fim < data início', async () => {
      driverRepo.findOne.mockResolvedValue({ id: DRIVER_ID });

      await expect(
        service.createAbsence(DRIVER_ID, {
          reason: 'vacation',
          startDate: '2026-03-10',
          endDate: '2026-03-05', // fim antes do início
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança NotFoundException se motorista não existe', async () => {
      driverRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createAbsence('nao-existe', {
          reason: 'sick',
          startDate: TODAY,
          endDate: TODAY,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── getAbsentDriverIds ─────────────────────────────────────────────────────

  describe('getAbsentDriverIds', () => {
    it('retorna IDs de motoristas ausentes na data', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { driverId: 'driver-1' },
          { driverId: 'driver-2' },
        ]),
      };
      absenceRepo.createQueryBuilder.mockReturnValue(qb);

      const ids = await service.getAbsentDriverIds(TODAY);

      expect(ids).toEqual(['driver-1', 'driver-2']);
    });

    it('retorna array vazio quando não há ausências na data', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      absenceRepo.createQueryBuilder.mockReturnValue(qb);

      const ids = await service.getAbsentDriverIds(TODAY);
      expect(ids).toEqual([]);
    });
  });

  // ── getAvailableDrivers ────────────────────────────────────────────────────

  describe('getAvailableDrivers', () => {
    it('exclui motoristas ausentes da lista de disponíveis', async () => {
      // getAbsentDriverIds retorna driver-2 como ausente
      const qbAbsence = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ driverId: 'driver-2' }]),
      };
      absenceRepo.createQueryBuilder.mockReturnValue(qbAbsence);

      const availableDrivers = [{ id: 'driver-1', name: 'Lucas', status: 'active' }];
      const qbDriver = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(availableDrivers),
      };
      driverRepo.createQueryBuilder.mockReturnValue(qbDriver);

      const result = await service.getAvailableDrivers(TODAY);

      // Deve filtrar driver-2 (ausente) — alias 'd' conforme o service
      expect(qbDriver.andWhere).toHaveBeenCalledWith(
        'd.id NOT IN (:...ids)',
        expect.objectContaining({ ids: ['driver-2'] }),
      );
      expect(result).toEqual(availableDrivers);
    });

    it('não aplica filtro de exclusão quando não há ausências', async () => {
      const qbAbsence = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      absenceRepo.createQueryBuilder.mockReturnValue(qbAbsence);

      const qbDriver = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      driverRepo.createQueryBuilder.mockReturnValue(qbDriver);

      await service.getAvailableDrivers(TODAY);

      // andWhere NÃO deve ser chamado para exclusão (sem ausentes)
      expect(qbDriver.andWhere).not.toHaveBeenCalled();
    });
  });

  // ── removeAbsence ──────────────────────────────────────────────────────────

  describe('removeAbsence', () => {
    it('remove ausência existente', async () => {
      const absence = { id: 'abs-1', driverId: DRIVER_ID };
      absenceRepo.findOne.mockResolvedValue(absence);
      absenceRepo.remove.mockResolvedValue(absence);

      const result = await service.removeAbsence(DRIVER_ID, 'abs-1');
      expect(absenceRepo.remove).toHaveBeenCalledWith(absence);
      expect(result).toEqual({ message: 'Ausência removida' });
    });

    it('lança NotFoundException para ausência inexistente', async () => {
      absenceRepo.findOne.mockResolvedValue(null);
      await expect(service.removeAbsence(DRIVER_ID, 'nao-existe')).rejects.toThrow(NotFoundException);
    });
  });
});
