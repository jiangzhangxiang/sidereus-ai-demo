/**
 * @fileoverview 候选人实体定义
 * @description 定义候选人核心数据模型，包含基本信息、教育经历、工作经历、技能标签、评分及状态等字段。
 *              作为候选人管理系统的核心实体，与 Education 和 WorkExperience 实体构成一对多关系。
 * @module candidates/candidate.entity
 * @version 1.0.0
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Education } from './education.entity';
import { WorkExperience } from './work-experience.entity';

@Entity()
export class Candidate {
  /** 候选人唯一标识（UUID） */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 基本信息（JSONB）：包含姓名、电话、邮箱、所在城市 */
  @Column({ type: 'jsonb' })
  basicInfo!: {
    name: string;
    phone: string;
    email: string;
    city: string;
  };

  /** 教育经历列表（一对多关联，级联保存/删除， eager 加载） */
  @OneToMany(() => Education, (education) => education.candidate, {
    cascade: true,
    eager: true,
  })
  education!: Education[];

  /** 工作经历列表（一对多关联，级联保存/删除， eager 加载） */
  @OneToMany(() => WorkExperience, (work) => work.candidate, {
    cascade: true,
    eager: true,
  })
  workExperience!: WorkExperience[];

  /** 技能标签数组（PostgreSQL 数组类型） */
  @Column('text', { array: true, default: [] })
  skills!: string[];

  /** 综合评分（0-100，精度为整数） */
  @Column({ type: 'decimal', precision: 3, scale: 0, default: 0 })
  score!: number;

  /** 评分明细（JSONB）：技术能力、项目经验、教育背景、沟通表达、发展潜力五个维度 */
  @Column({ type: 'jsonb' })
  scoreBreakdown!: {
    technicalSkills: number;
    experience: number;
    education: number;
    communication: number;
    potential: number;
  };

  /** 候选人状态枚举：pending / screened / interviewing / hired / rejected */
  @Column({
    type: 'enum',
    enum: ['pending', 'screened', 'interviewing', 'hired', 'rejected'],
    default: 'pending',
  })
  status!: string;

  /** 简历文件存储路径/URL */
  @Column()
  resumeUrl!: string;

  /** 备注信息（可选） */
  @Column({ nullable: true })
  notes?: string;

  /** 创建时间（自动生成） */
  @CreateDateColumn()
  uploadedAt!: Date;

  /** 最后更新时间（自动更新） */
  @UpdateDateColumn()
  updatedAt!: Date;
}
