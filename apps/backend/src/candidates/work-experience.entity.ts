/**
 * @fileoverview 工作经历实体定义
 * @description 定义候选人工作经历的数据模型，包含公司、职位、时间段和工作描述等字段。
 *              与 Candidate 实体构成多对一关系，支持级联删除。
 * @module candidates/work-experience.entity
 * @version 1.0.0
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Candidate } from './candidate.entity';

@Entity()
export class WorkExperience {
  /** 工作经历记录唯一标识（UUID） */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 公司名称 */
  @Column()
  company!: string;

  /** 职位名称 */
  @Column()
  position!: string;

  /** 工作时间段（如：2022-07 至今） */
  @Column()
  period!: string;

  /** 工作内容描述 */
  @Column()
  description!: string;

  /** 关联的候选人（序列化时排除，避免循环引用） */
  @Exclude()
  @ManyToOne(() => Candidate, (candidate) => candidate.workExperience, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  candidate!: Candidate;
}
