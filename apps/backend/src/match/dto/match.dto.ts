import {
  IsString,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MatchJobDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString({ each: true })
  required_skills!: string[];

  @IsOptional()
  @IsString({ each: true })
  plus_skills?: string[];
}

export class MatchCandidateDto {
  @IsObject()
  basicInfo!: Record<string, string>;

  @IsOptional()
  skills?: string[];

  @IsOptional()
  workExperience?: Array<Record<string, string>>;

  @IsOptional()
  education?: Array<Record<string, string>>;
}

export class MatchRequestDto {
  @ValidateNested()
  @Type(() => MatchJobDto)
  job!: MatchJobDto;

  @ValidateNested()
  @Type(() => MatchCandidateDto)
  candidate!: MatchCandidateDto;
}
