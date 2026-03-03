import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateWorkSiteDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
