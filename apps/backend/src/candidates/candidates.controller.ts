/**
 * @fileoverview 候选人 RESTful API 控制器
 * @description 提供 /api/candidates 路由下的 RESTful 接口，包括分页查询、详情查询、创建、更新和删除操作。
 *              使用 ValidationPipe 进行请求体验证，支持查询参数传递筛选条件。
 * @module candidates/candidates.controller
 * @version 1.0.0
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto, UpdateCandidateDto } from './dto/create-candidate.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('api/candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  /**
   * 分页获取候选人列表
   * @param page - 页码（默认 1）
   * @param pageSize - 每页数量（默认 10）
   * @param search - 搜索关键词
   * @param status - 状态筛选
   * @param skills - 技能标签筛选（逗号分隔）
   * @param sortBy - 排序字段
   * @param sortOrder - 排序方向
   * @returns 分页结果
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('skills') skills?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const size = pageSize ? parseInt(pageSize, 10) : 10;
    const skillsArray = skills ? skills.split(',') : [];

    return this.candidatesService.findAll({
      page: pageNum,
      pageSize: size,
      search,
      status: status as any,
      skills: skillsArray,
      sortBy: (sortBy as any) || 'uploadedAt',
      sortOrder: (sortOrder as any) || 'desc',
    });
  }

  /**
   * 根据 ID 获取候选人详情
   * @param id - 候选人 UUID
   * @returns 候选人完整信息
   * @throws HttpException 404 - 候选人不存在
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const candidate = await this.candidatesService.findOne(id);
    if (!candidate) {
      throw new HttpException('候选人不存在', HttpStatus.NOT_FOUND);
    }
    return candidate;
  }

  /**
   * 创建新候选人
   * @param createCandidateDto - 候选人数据（经 ValidationPipe 验证）
   * @returns 创建的候选人对象
   */
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(@Body() createCandidateDto: CreateCandidateDto) {
    return this.candidatesService.create(createCandidateDto);
  }

  /**
   * 更新候选人信息
   * @param id - 候选人 UUID
   * @param updateCandidateDto - 更新数据（经 ValidationPipe 验证）
   * @returns 更新后的候选人对象
   */
  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  update(@Param('id') id: string, @Body() updateCandidateDto: UpdateCandidateDto) {
    return this.candidatesService.update(id, updateCandidateDto);
  }

  /**
   * 删除候选人
   * @param id - 候选人 UUID
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }

  @Patch(':id/status')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.candidatesService.updateStatus(id, updateStatusDto);
  }
}
