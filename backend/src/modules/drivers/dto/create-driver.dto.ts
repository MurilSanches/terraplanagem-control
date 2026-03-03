import { IsString, IsOptional, IsIn, MinLength } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'vacation'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
