import { IsString, IsOptional, IsArray, IsNumber, IsEnum, ValidateNested, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class BasicInfoDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  email: string;

  @IsString()
  city: string;
}

export class EducationDto {
  @IsString()
  school: string;

  @IsString()
  major: string;

  @IsString()
  degree: string;

  @IsString()
  graduationDate: string;
}

export class WorkExperienceDto {
  @IsString()
  company: string;

  @IsString()
  position: string;

  @IsString()
  period: string;

  @IsString()
  description: string;
}

export class ScoreBreakdownDto {
  @IsNumber()
  technicalSkills: number;

  @IsNumber()
  experience: number;

  @IsNumber()
  education: number;

  @IsNumber()
  communication: number;

  @IsNumber()
  potential: number;
}

export class CreateCandidateDto {
  @ValidateNested()
  @Type(() => BasicInfoDto)
  basicInfo: BasicInfoDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WorkExperienceDto)
  workExperience?: WorkExperienceDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScoreBreakdownDto)
  scoreBreakdown?: ScoreBreakdownDto;

  @IsOptional()
  @IsEnum(['pending', 'screened', 'interviewing', 'hired', 'rejected'])
  status?: string;

  @IsString()
  resumeUrl: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCandidateDto extends CreateCandidateDto {}
