import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Candidate } from './candidate.entity';
import { Education } from './education.entity';
import { WorkExperience } from './work-experience.entity';

interface FindAllOptions {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  skills?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    @InjectRepository(Education)
    private educationRepository: Repository<Education>,
    @InjectRepository(WorkExperience)
    private workExperienceRepository: Repository<WorkExperience>,
  ) {}

  async findAll(options: FindAllOptions) {
    const { page, pageSize, search, status, skills, sortBy, sortOrder } =
      options;

    const queryBuilder = this.candidateRepository
      .createQueryBuilder('candidate')
      .leftJoinAndSelect('candidate.education', 'education')
      .leftJoinAndSelect('candidate.workExperience', 'work');

    if (search) {
      queryBuilder.andWhere(
        "candidate.basicInfo->>'name' ILIKE :search OR candidate.basicInfo->>'phone' ILIKE :search OR candidate.basicInfo->>'email' ILIKE :search",
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('candidate.status = :status', { status });
    }

    if (skills && skills.length > 0) {
      queryBuilder.andWhere('candidate.skills && :skills', {
        skills: skills,
      });
    }

    const validSortFields = ['score', 'uploadedAt'];
    const sortField = validSortFields.includes(sortBy || '') ? sortBy : 'uploadedAt';
    
    queryBuilder
      .orderBy(`candidate.${sortField}`, sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items: plainToInstance(Candidate, items),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string): Promise<any | null> {
    const candidate = await this.candidateRepository.findOne({
      where: { id },
      relations: ['education', 'workExperience'],
    });
    return candidate ? plainToInstance(Candidate, candidate) : null;
  }

  async create(createCandidateDto: any): Promise<any> {
    const { education, workExperience, ...candidateData } = createCandidateDto;

    const candidate = new Candidate();
    Object.assign(candidate, candidateData);

    if (education && education.length > 0) {
      const eduEntities = this.educationRepository.create(education);
      eduEntities.forEach((edu: any) => (edu.candidate = candidate));
      candidate.education = eduEntities;
    }

    if (workExperience && workExperience.length > 0) {
      const workEntities = this.workExperienceRepository.create(workExperience);
      workEntities.forEach((work: any) => (work.candidate = candidate));
      candidate.workExperience = workEntities;
    }

    const savedCandidate = await this.candidateRepository.save(candidate);
    return plainToInstance(Candidate, savedCandidate);
  }

  async update(id: string, updateCandidateDto: any): Promise<any> {
    const candidate = await this.findOne(id);
    if (!candidate) {
      throw new NotFoundException(`候选人 ID ${id} 不存在`);
    }

    const { education, workExperience, ...candidateData } = updateCandidateDto;

    Object.assign(candidate, candidateData);

    if (education !== undefined) {
      await this.educationRepository.delete({ candidate: { id } });
      if (education.length > 0) {
        const eduEntities = this.educationRepository.create(education);
        eduEntities.forEach((edu: any) => (edu.candidate = candidate));
        candidate.education = eduEntities;
      }
    }

    if (workExperience !== undefined) {
      await this.workExperienceRepository.delete({ candidate: { id } });
      if (workExperience.length > 0) {
        const workEntities = this.workExperienceRepository.create(workExperience);
        workEntities.forEach((work: any) => (work.candidate = candidate));
        candidate.workExperience = workEntities;
      }
    }

    const updatedCandidate = await this.candidateRepository.save(candidate);
    return plainToInstance(Candidate, updatedCandidate);
  }

  async remove(id: string): Promise<void> {
    const candidate = await this.findOne(id);
    if (!candidate) {
      throw new NotFoundException(`候选人 ID ${id} 不存在`);
    }
    await this.candidateRepository.remove(candidate);
  }
}
