/**
 * @fileoverview 候选人数据传输对象（DTO）定义
 * @description 定义创建和更新候选人时的请求验证规则，包含基本信息、教育经历、工作经历、
 *              技能标签、评分及状态等字段的校验装饰器。所有嵌套对象使用 class-validator 进行类型安全验证。
 * @module candidates/dto/create-candidate.dto
 * @version 1.0.0
 */
import { IsString, IsOptional, IsArray, IsNumber, IsEnum, ValidateNested, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/** 基本信息数据传输对象 */
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

/** 教育经历数据传输对象 */
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

/** 工作经历数据传输对象 */
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

/** 评分明细数据传输对象 */
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

/** 创建候选人请求体数据传输对象 */
export class CreateCandidateDto {
  /** 基本信息（必填，嵌套验证） */
  @ValidateNested()
  @Type(() => BasicInfoDto)
  basicInfo: BasicInfoDto;

  /** 教育经历列表（可选） */
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];

  /** 工作经历列表（可选） */
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WorkExperienceDto)
  workExperience?: WorkExperienceDto[];

  /** 技能标签数组（可选） */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  /** 综合评分（可选，0-100） */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  /** 评分明细（可选） */
  @IsOptional()
  @ValidateNested()
  @Type(() => ScoreBreakdownDto)
  scoreBreakdown?: ScoreBreakdownDto;

  /** 候选人状态（可选，枚举值校验） */
  @IsOptional()
  @IsEnum(['pending', 'screened', 'interviewing', 'hired', 'rejected'])
  status?: string;

  /** 简历文件 URL（必填） */
  @IsString()
  resumeUrl: string;

  /** 备注信息（可选） */
  @IsOptional()
  @IsString()
  notes?: string;
}

/** 更新候选人请求体数据传输对象（继承自 CreateCandidateDto，所有字段变为可选） */
export class UpdateCandidateDto extends CreateCandidateDto {}
