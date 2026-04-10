/**
 * @fileoverview 岗位 RESTful API 控制器
 * @description 提供 /api/jobs 路由下的 RESTful 接口，包括列表查询、详情查询、创建、更新和删除操作。
 *              使用 ValidationPipe 进行请求体验证。
 * @module jobs/jobs.controller
 * @version 1.0.0
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto, UpdateJobDto } from './dto/job.dto';

@Controller('api/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async findAll() {
    return this.jobsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.jobsService.findOne(id);
    } catch (e) {
      throw new HttpException('岗位不存在', HttpStatus.NOT_FOUND);
    }
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() dto: CreateJobDto) {
    return this.jobsService.create(dto);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    try {
      return await this.jobsService.update(id, dto);
    } catch (e) {
      throw new HttpException('岗位不存在', HttpStatus.NOT_FOUND);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.jobsService.remove(id);
    } catch (e) {
      throw new HttpException('岗位不存在', HttpStatus.NOT_FOUND);
    }
  }
}
