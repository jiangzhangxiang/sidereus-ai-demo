/**
 * @fileoverview 智能匹配功能模块定义
 * @description NestJS 功能模块，整合匹配分析的控制器和服务。
 * @module match/match.module
 * @version 1.0.0
 */
import { Module } from '@nestjs/common';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';

@Module({
  controllers: [MatchController],
  providers: [MatchService],
})
export class MatchModule {}
