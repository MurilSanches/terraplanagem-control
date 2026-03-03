import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class UpsertDailyDto {
  @IsDateString()
  date: string;

  @IsUUID()
  equipmentId: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsUUID()
  workSiteId?: string;

  @IsOptional()
  @IsString()
  observation?: string;
}
