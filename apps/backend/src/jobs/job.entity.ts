/**
 * @fileoverview 岗位实体定义
 * @description 定义岗位数据模型，包含岗位名称、描述、必备技能、加分技能等字段。
 *              作为岗位管理模块的核心实体，用于存储 JD（职位描述）配置信息。
 * @module jobs/job.entity
 * @version 1.0.0
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Job {
  /** 岗位唯一标识（UUID） */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 岗位名称（最大50字符） */
  @Column({ length: 50 })
  title: string;

  /** 岗位描述（富文本/Markdown格式） */
  @Column({ type: 'text' })
  description: string;

  /** 必备技能列表（PostgreSQL 文本数组，至少1项） */
  @Column('text', { array: true, default: [] })
  required_skills: string[];

  /** 加分技能列表（PostgreSQL 文本数组，可选） */
  @Column('text', { array: true, default: [] })
  plus_skills: string[];

  /** 创建时间（自动生成） */
  @CreateDateColumn()
  created_at: Date;

  /** 最后更新时间（自动更新） */
  @UpdateDateColumn()
  updated_at: Date;
}
