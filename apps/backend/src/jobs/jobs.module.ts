/**
 * @fileoverview 岗位功能模块定义
 * @description NestJS 功能模块，整合岗位相关的控制器、服务和实体。
 * @module jobs/jobs.module
 * @version 1.0.0
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { Job } from './job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job])],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
