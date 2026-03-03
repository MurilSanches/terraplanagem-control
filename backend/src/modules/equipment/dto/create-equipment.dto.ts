import { IsString, IsOptional, IsInt, IsIn } from 'class-validator';

export class CreateEquipmentDto {
  @IsOptional()
  @IsString()
  plate?: string;

  @IsOptional()
  @IsString()
  chassis?: string;

  @IsInt()
  typeId: number;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsIn(['active', 'maintenance', 'inactive'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
