import { IsArray, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { UpsertDailyDto } from './upsert-daily.dto';

export class BulkUpsertDailyDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => UpsertDailyDto)
  entries: UpsertDailyDto[];
}
