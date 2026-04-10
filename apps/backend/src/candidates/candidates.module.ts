/**
 * @fileoverview 候选人功能模块定义
 * @description NestJS 功能模块，整合候选人相关的控制器、服务和实体。
 *              通过 TypeOrmModule.forFeature 注册数据库实体，导出 CandidatesService 以供其他模块使用。
 * @module candidates/candidates.module
 * @version 1.0.0
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { Candidate } from './candidate.entity';
import { Education } from './education.entity';
import { WorkExperience } from './work-experience.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Candidate, Education, WorkExperience])],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
