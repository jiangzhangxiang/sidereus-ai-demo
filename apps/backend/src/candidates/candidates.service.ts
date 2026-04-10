/**
 * @fileoverview 候选人业务逻辑服务
 * @description 提供候选人数据的 CRUD 操作、分页查询、条件筛选、排序等功能。
 *              使用 TypeORM 进行数据库操作，支持按姓名/电话/邮箱模糊搜索、按状态筛选、按技能标签筛选。
 * @module candidates/candidates.service
 * @version 1.0.0
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Candidate } from './candidate.entity';
import { Education } from './education.entity';
import { WorkExperience } from './work-experience.entity';

/** 分页查询参数接口 */
interface FindAllOptions {
  /** 当前页码（从 1 开始） */
  page: number;
  /** 每页记录数 */
  pageSize: number;
  /** 搜索关键词（匹配姓名/电话/邮箱） */
  search?: string;
  /** 状态筛选（pending/screened/interviewing/hired/rejected） */
  status?: string;
  /** 技能标签筛选（数组，交集匹配） */
  skills?: string[];
  /** 排序字段（score/uploadedAt） */
  sortBy?: string;
  /** 排序方向（asc/desc） */
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

  /**
   * 分页查询候选人列表
   * @param options - 查询选项（分页、搜索、筛选、排序）
   * @returns 分页结果（包含数据列表、总数、页码信息）
   */
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

  /**
   * 根据 ID 查询单个候选人
   * @param id - 候选人 ID
   * @returns 候选人对象（包含教育和工作经历），不存在则返回 null
   */
  async findOne(id: string): Promise<any | null> {
    const candidate = await this.candidateRepository.findOne({
      where: { id },
      relations: ['education', 'workExperience'],
    });
    return candidate ? plainToInstance(Candidate, candidate) : null;
  }

  /**
   * 创建新候选人
   * @param createCandidateDto - 候选人数据（包含基本信息、教育经历、工作经历等）
   * @returns 创建的候选人对象
   */
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

  /**
   * 更新候选人信息
   * @param id - 候选人 ID
   * @param updateCandidateDto - 更新数据
   * @returns 更新后的候选人对象
   * @throws NotFoundException - 候选人不存在时抛出
   */
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

  /**
   * 删除候选人
   * @param id - 候选人 ID
   * @throws NotFoundException - 候选人不存在时抛出
   */
  async remove(id: string): Promise<void> {
    const candidate = await this.findOne(id);
    if (!candidate) {
      throw new NotFoundException(`候选人 ID ${id} 不存在`);
    }
    await this.candidateRepository.remove(candidate);
  }
}
