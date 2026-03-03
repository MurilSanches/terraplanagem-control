import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User } from '../../modules/users/entities/user.entity';
import { RefreshToken } from '../../modules/users/entities/refresh-token.entity';
import { EquipmentType } from '../../modules/equipment/entities/equipment-type.entity';
import { Equipment } from '../../modules/equipment/entities/equipment.entity';
import { Driver } from '../../modules/drivers/entities/driver.entity';
import { DriverAbsence } from '../../modules/drivers/entities/driver-absence.entity';
import { WorkSite } from '../../modules/work-sites/entities/work-site.entity';
import { DailyProgramming } from '../../modules/daily-programming/entities/daily-programming.entity';

dotenv.config();

const requiredEnv = ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE', 'ADMIN_NAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error(`Variáveis de ambiente obrigatórias não definidas: ${missing.join(', ')}`);
}

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, RefreshToken, EquipmentType, Equipment, Driver, DriverAbsence, WorkSite, DailyProgramming],
  synchronize: true,
});

const EQUIPMENT_TYPES = [
  'Caminhão',
  'Retroescavadeira',
  'Escavadeira',
  'Mini Escavadeira',
  'Rolo',
  'Pipa',
  'Trator',
  'Motoniveladora',
  'Pá Carregadeira',
  'Mini Carregadeira',
  'Plataforma',
];

const WORK_SITES = [
  { name: 'Tegra Tamboré', city: 'Santana de Parnaíba' },
  { name: 'Longitude Elev', city: 'Indaiatuba' },
  { name: 'BRZ Toscana', city: 'Campinas' },
  { name: 'Syngenta', city: 'Paulínia' },
  { name: 'ArcelorMittal', city: 'Campinas' },
  { name: 'CNPEM', city: 'Campinas' },
  { name: 'Alesco', city: 'Campinas' },
  { name: 'Tegra Lazur', city: 'São Paulo' },
  { name: 'Tegra Vista Horizonte', city: 'São Paulo' },
  { name: 'Markinvest Mikonos', city: 'Campinas' },
  { name: 'Passarelli', city: 'São Paulo' },
  { name: 'BRZ Antares', city: 'Campinas' },
  { name: 'BRZ Rimini', city: 'Campinas' },
  { name: 'BRZ Toscana', city: 'Campinas' },
  { name: 'Souza Araujo Por do Sol', city: 'Campinas' },
  { name: 'VIC Minas Gerais', city: 'Minas Gerais' },
  { name: 'MPD CNPEM', city: 'Campinas' },
  { name: 'Duotec Brado', city: 'São Paulo' },
  { name: 'Safetline', city: 'Campinas' },
  { name: 'Tegra Tamboré (Londrina)', city: 'Londrina' },
  { name: 'BRN', city: 'Campinas' },
  { name: 'Hortolandia - Rua das Esmeraldas', city: 'Hortolândia' },
  { name: 'Jaguariúna - Via Lotus', city: 'Jaguariúna' },
  { name: 'Techno Square', city: 'Campinas' },
  { name: 'Obra Interna / Pátio', city: 'Campinas' },
];

const DRIVERS = [
  'Lucas Xavier', 'Kleber', 'Anderson', 'Carlão', 'Valdir',
  'Alison', 'Mateus', 'Tilinha', 'Geraldo', 'Luiz Claudio',
  'Careca', 'Henrique', 'Japa', 'Nieverton', 'Edson',
  'Renato', 'João Paiva', 'Willian Alves', 'Marcos', 'Roberto',
  'Silvio', 'Paulo', 'Diego', 'Fabio', 'Alexandre',
];

const EQUIPMENT_DATA = [
  { plate: 'EHP0B94', typeName: 'Caminhão' },
  { plate: 'FES5B36', typeName: 'Retroescavadeira' },
  { plate: 'PWK0E77', typeName: 'Escavadeira' },
  { plate: 'DPC7B86', typeName: 'Caminhão' },
  { plate: 'GHJ3C21', typeName: 'Pá Carregadeira' },
  { plate: 'MNB8F44', typeName: 'Mini Escavadeira' },
  { plate: 'QWE2A55', typeName: 'Rolo' },
  { plate: 'RTY6D33', typeName: 'Pipa' },
  { plate: 'UIO9E12', typeName: 'Trator' },
  { plate: 'ASD4B67', typeName: 'Motoniveladora' },
  { plate: 'ZXC1F88', typeName: 'Mini Carregadeira' },
  { plate: 'VBN5G99', typeName: 'Plataforma' },
  { plate: 'LKJ7H11', typeName: 'Caminhão' },
  { plate: 'OPQ0I22', typeName: 'Escavadeira' },
  { plate: 'WER3J44', typeName: 'Retroescavadeira' },
];

async function seed() {
  await ds.initialize();
  console.log('🌱 Seeding database...');

  // Equipment Types
  const typeRepo = ds.getRepository(EquipmentType);
  const typeMap: Record<string, EquipmentType> = {};
  for (const name of EQUIPMENT_TYPES) {
    let type = await typeRepo.findOne({ where: { name } });
    if (!type) {
      type = await typeRepo.save(typeRepo.create({ name }));
    }
    typeMap[name] = type;
  }
  console.log(`✅ ${EQUIPMENT_TYPES.length} equipment types`);

  // Work Sites
  const wsRepo = ds.getRepository(WorkSite);
  for (const ws of WORK_SITES) {
    const exists = await wsRepo.findOne({ where: { name: ws.name } });
    if (!exists) await wsRepo.save(wsRepo.create(ws));
  }
  console.log(`✅ ${WORK_SITES.length} work sites`);

  // Drivers
  const driverRepo = ds.getRepository(Driver);
  for (const name of DRIVERS) {
    const exists = await driverRepo.findOne({ where: { name } });
    if (!exists) await driverRepo.save(driverRepo.create({ name }));
  }
  console.log(`✅ ${DRIVERS.length} drivers`);

  // Equipment
  const eqRepo = ds.getRepository(Equipment);
  for (const eq of EQUIPMENT_DATA) {
    const exists = await eqRepo.findOne({ where: { plate: eq.plate } });
    if (!exists) {
      const type = typeMap[eq.typeName];
      await eqRepo.save(eqRepo.create({ plate: eq.plate, typeId: type.id }));
    }
  }
  console.log(`✅ ${EQUIPMENT_DATA.length} equipment`);

  // Admin user — variáveis já validadas no topo do arquivo
  const adminName = process.env.ADMIN_NAME as string;
  const adminEmail = process.env.ADMIN_EMAIL as string;
  const adminPassword = process.env.ADMIN_PASSWORD as string;

  const userRepo = ds.getRepository(User);
  const adminExists = await userRepo.findOne({ where: { email: adminEmail } });
  if (!adminExists) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await userRepo.save(
      userRepo.create({
        name: adminName,
        email: adminEmail,
        passwordHash: hash,
        role: 'admin',
      }),
    );
    console.log(`✅ Admin user criado: ${adminEmail}`);
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  await ds.destroy();
  console.log('🎉 Seed completed!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
