import {
  IsString,
  IsArray,
  MaxLength,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';

export class CreateJobDto {
  @IsString()
  @MaxLength(50)
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  required_skills: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  plus_skills?: string[];
}

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  required_skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  plus_skills?: string[];
}
