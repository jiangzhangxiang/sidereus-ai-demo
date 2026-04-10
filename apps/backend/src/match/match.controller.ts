/**
 * @fileoverview 智能匹配 API 控制器
 * @description 提供 POST /api/match 接口，接收岗位需求和候选人简历数据，返回多维度匹配评分及 AI 评语。
 * @module match/match.controller
 * @version 1.0.0
 */
import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MatchService } from './match.service';
import { MatchRequestDto } from './dto/match.dto';

@Controller('api/match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async analyze(@Body() dto: MatchRequestDto) {
    return this.matchService.analyze(dto);
  }
}
