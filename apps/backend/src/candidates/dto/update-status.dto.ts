import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(['pending', 'screened', 'interviewing', 'hired', 'rejected'])
  status!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
