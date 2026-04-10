/**
 * @fileoverview 岗位业务逻辑服务
 * @description 提供岗位数据的 CRUD 操作，包括创建、查询、更新和删除岗位。
 *              使用 TypeORM 进行数据库操作，支持分页查询和按 ID 查询。
 * @module jobs/jobs.service
 * @version 1.0.0
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Job } from './job.entity';
import { CreateJobDto, UpdateJobDto } from './dto/job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async findAll() {
    const jobs = await this.jobRepository.find({
      order: { created_at: 'DESC' },
    });
    return plainToInstance(Job, jobs);
  }

  async findOne(id: string) {
    const job = await this.jobRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException('岗位不存在');
    }
    return job;
  }

  create(dto: CreateJobDto) {
    const job = this.jobRepository.create(dto);
    return this.jobRepository.save(job);
  }

  async update(id: string, dto: UpdateJobDto) {
    const job = await this.findOne(id);
    Object.assign(job, dto);
    return this.jobRepository.save(job);
  }

  async remove(id: string) {
    const job = await this.findOne(id);
    await this.jobRepository.remove(job);
    return { message: '删除成功' };
  }
}
