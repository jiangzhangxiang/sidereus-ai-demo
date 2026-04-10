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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company: string;

  @Column()
  position: string;

  @Column()
  period: string;

  @Column()
  description: string;

  @Exclude()
  @ManyToOne(() => Candidate, (candidate) => candidate.workExperience, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  candidate: Candidate;
}
