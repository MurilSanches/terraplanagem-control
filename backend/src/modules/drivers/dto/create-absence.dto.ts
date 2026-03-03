import { IsString, IsIn, IsDateString, IsOptional } from 'class-validator';

export class CreateAbsenceDto {
  @IsIn(['sick', 'vacation', 'other'])
  reason: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
