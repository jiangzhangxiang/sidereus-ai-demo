/**
 * @fileoverview 教育经历实体定义
 * @description 定义候选人教育背景的数据模型，包含学校、专业、学历和毕业时间等字段。
 *              与 Candidate 实体构成多对一关系，支持级联删除。
 * @module candidates/education.entity
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
export class Education {
  /** 教育记录唯一标识（UUID） */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 毕业院校名称 */
  @Column()
  school!: string;

  /** 专业名称 */
  @Column()
  major!: string;

  /** 学历层次（如：本科、硕士、博士） */
  @Column()
  degree!: string;

  /** 毕业时间（格式：YYYY-MM） */
  @Column()
  graduationDate!: string;

  /** 关联的候选人（序列化时排除，避免循环引用） */
  @Exclude()
  @ManyToOne(() => Candidate, (candidate) => candidate.education, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  candidate!: Candidate;
}
