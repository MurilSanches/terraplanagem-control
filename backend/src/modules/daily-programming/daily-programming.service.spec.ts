import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DailyProgrammingService } from './daily-programming.service';
import { DailyProgramming } from './entities/daily-programming.entity';
import { Equipment } from '../equipment/entities/equipment.entity';

// Minimal mock factory for TypeORM Repository
const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

describe('DailyProgrammingService', () => {
  let service: DailyProgrammingService;
  let dailyRepo: ReturnType<typeof mockRepo>;
  let equipmentRepo: ReturnType<typeof mockRepo>;

  const TODAY = '2026-03-03';
  const EQ_ID = 'eq-uuid-1';
  const DRIVER_ID = 'driver-uuid-1';
  const WS_ID = 'ws-uuid-1';
  const USER_ID = 'user-uuid-1';

  beforeEach(async () => {
    dailyRepo = mockRepo();
    equipmentRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyProgrammingService,
        { provide: getRepositoryToken(DailyProgramming), useValue: dailyRepo },
        { provide: getRepositoryToken(Equipment), useValue: equipmentRepo },
      ],
    }).compile();

    service = module.get(DailyProgrammingService);
  });

  // ── upsert ───────────────────────────────────────────────────────────────

  describe('upsert', () => {
    it('cria uma nova entrada quando não existe', async () => {
      dailyRepo.findOne.mockResolvedValue(null);
      const created = { id: 'new-entry', date: TODAY, equipmentId: EQ_ID };
      dailyRepo.create.mockReturnValue(created);
      dailyRepo.save.mockResolvedValue(created);

      const result = await service.upsert(
        { date: TODAY, equipmentId: EQ_ID, driverId: DRIVER_ID, workSiteId: WS_ID },
        USER_ID,
      );

      expect(dailyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ date: TODAY, equipmentId: EQ_ID, driverId: DRIVER_ID }),
      );
      expect(dailyRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });

    it('atualiza entrada existente (não cria duplicata)', async () => {
      const existing = { id: 'existing-entry', date: TODAY, equipmentId: EQ_ID, driverId: null };
      dailyRepo.findOne.mockResolvedValue(existing);
      dailyRepo.save.mockResolvedValue({ ...existing, driverId: DRIVER_ID });

      const result = await service.upsert(
        { date: TODAY, equipmentId: EQ_ID, driverId: DRIVER_ID },
        USER_ID,
      );

      // Deve atualizar, não criar
      expect(dailyRepo.create).not.toHaveBeenCalled();
      expect(dailyRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'existing-entry', driverId: DRIVER_ID }),
      );
      expect(result.driverId).toBe(DRIVER_ID);
    });

    it('aceita entrada sem motorista (nullable)', async () => {
      dailyRepo.findOne.mockResolvedValue(null);
      const created = { id: 'e1', date: TODAY, equipmentId: EQ_ID, driverId: undefined };
      dailyRepo.create.mockReturnValue(created);
      dailyRepo.save.mockResolvedValue(created);

      const result = await service.upsert(
        { date: TODAY, equipmentId: EQ_ID },
        USER_ID,
      );

      expect(dailyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ driverId: undefined }),
      );
      expect(result).toEqual(created);
    });
  });

  // ── clearEntry ────────────────────────────────────────────────────────────

  describe('clearEntry', () => {
    it('remove entrada pelo id', async () => {
      dailyRepo.delete.mockResolvedValue({ affected: 1 });
      const result = await service.clearEntry('entry-id');
      expect(dailyRepo.delete).toHaveBeenCalledWith('entry-id');
      expect(result).toEqual({ message: 'Entrada removida' });
    });
  });

  // ── copyFrom ──────────────────────────────────────────────────────────────

  describe('copyFrom', () => {
    it('copia entradas da data de origem para o destino', async () => {
      const srcEntries = [
        { equipmentId: 'eq-1', date: '2026-03-02', driverId: 'd1', workSiteId: 'ws1', observation: 'obs' },
        { equipmentId: 'eq-2', date: '2026-03-02', driverId: null, workSiteId: null, observation: null },
      ];
      dailyRepo.find.mockResolvedValue(srcEntries);
      // Nenhuma entrada já existe no destino
      dailyRepo.findOne.mockResolvedValue(null);
      dailyRepo.create.mockImplementation((d) => d);
      dailyRepo.save.mockImplementation((d) => Promise.resolve({ id: 'new', ...d }));

      const result = await service.copyFrom('2026-03-02', TODAY, USER_ID);

      expect(result.copied).toBe(2);
      expect(result.skipped).toBe(0);
      expect(dailyRepo.save).toHaveBeenCalledTimes(2);
    });

    it('pula entradas que já existem no destino', async () => {
      dailyRepo.find.mockResolvedValue([
        { equipmentId: 'eq-1', date: '2026-03-02', driverId: 'd1' },
      ]);
      // Já existe no destino
      dailyRepo.findOne.mockResolvedValue({ id: 'existing', equipmentId: 'eq-1', date: TODAY });

      const result = await service.copyFrom('2026-03-02', TODAY, USER_ID);

      expect(result.copied).toBe(0);
      expect(result.skipped).toBe(1);
      expect(dailyRepo.save).not.toHaveBeenCalled();
    });

    it('não falha quando a data de origem não tem entradas', async () => {
      dailyRepo.find.mockResolvedValue([]);
      const result = await service.copyFrom('2026-03-02', TODAY, USER_ID);
      expect(result.copied).toBe(0);
      expect(result.skipped).toBe(0);
    });
  });

  // ── getDayView ─────────────────────────────────────────────────────────────

  describe('getDayView', () => {
    it('retorna todos os equipamentos ativos com sua entrada (ou null)', async () => {
      const activeEquipment = [
        { id: 'eq-1', plate: 'AAA1111', status: 'active', type: { name: 'Caminhão' } },
        { id: 'eq-2', plate: 'BBB2222', status: 'active', type: { name: 'Escavadeira' } },
      ];
      equipmentRepo.find.mockResolvedValue(activeEquipment);

      // Apenas eq-1 tem entrada hoje
      dailyRepo.find.mockResolvedValue([
        { id: 'entry-1', date: TODAY, equipmentId: 'eq-1', driverId: DRIVER_ID },
      ]);

      const rows = await service.getDayView(TODAY);

      expect(rows).toHaveLength(2);
      // eq-1 tem entry
      expect(rows.find((r) => r.equipment.id === 'eq-1')?.entry).not.toBeNull();
      // eq-2 não tem entry
      expect(rows.find((r) => r.equipment.id === 'eq-2')?.entry).toBeNull();
    });

    it('retorna lista vazia quando não há equipamentos ativos', async () => {
      equipmentRepo.find.mockResolvedValue([]);
      dailyRepo.find.mockResolvedValue([]);
      const rows = await service.getDayView(TODAY);
      expect(rows).toHaveLength(0);
    });
  });
});
