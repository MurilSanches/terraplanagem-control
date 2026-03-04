import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { WorkSitesModule } from './modules/work-sites/work-sites.module';
import { DailyProgrammingModule } from './modules/daily-programming/daily-programming.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 1 minuto
        limit: 60,   // 60 requisições por minuto (geral)
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        // DB_DATABASE_URL é a URL do Neon (pooler). Fallback para variáveis individuais (dev local).
        const databaseUrl = config.get<string>('DB_DATABASE_URL');
        return {
          type: 'postgres' as const,
          ...(databaseUrl
            ? { url: databaseUrl, ssl: { rejectUnauthorized: false } }
            : {
                host: config.get('DB_HOST'),
                port: parseInt(config.get('DB_PORT') || '5432'),
                username: config.get('DB_USERNAME'),
                password: config.get('DB_PASSWORD'),
                database: config.get<string>('DB_DATABASE'),
                ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : undefined,
              }),
          entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
          synchronize: config.get('NODE_ENV') === 'development',
          logging: config.get('NODE_ENV') === 'development',
          extra: { max: parseInt(config.get('DB_POOL_MAX') || '10') },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    EquipmentModule,
    DriversModule,
    WorkSitesModule,
    DailyProgrammingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
