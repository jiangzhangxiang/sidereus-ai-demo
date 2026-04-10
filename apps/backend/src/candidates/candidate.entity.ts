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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  basicInfo: {
    name: string;
    phone: string;
    email: string;
    city: string;
  };

  @OneToMany(() => Education, (education) => education.candidate, {
    cascade: true,
    eager: true,
  })
  education: Education[];

  @OneToMany(() => WorkExperience, (work) => work.candidate, {
    cascade: true,
    eager: true,
  })
  workExperience: WorkExperience[];

  @Column('text', { array: true, default: [] })
  skills: string[];

  @Column({ type: 'decimal', precision: 3, scale: 0, default: 0 })
  score: number;

  @Column({ type: 'jsonb' })
  scoreBreakdown: {
    technicalSkills: number;
    experience: number;
    education: number;
    communication: number;
    potential: number;
  };

  @Column({
    type: 'enum',
    enum: ['pending', 'screened', 'interviewing', 'hired', 'rejected'],
    default: 'pending',
  })
  status: string;

  @Column()
  resumeUrl: string;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn()
  uploadedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
