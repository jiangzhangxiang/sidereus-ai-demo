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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  school: string;

  @Column()
  major: string;

  @Column()
  degree: string;

  @Column()
  graduationDate: string;

  @Exclude()
  @ManyToOne(() => Candidate, (candidate) => candidate.education, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  candidate: Candidate;
}
