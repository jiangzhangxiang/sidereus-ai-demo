/**
 * @fileoverview 根路径控制器
 * @description 应用的默认根路由控制器，提供健康检查接口。
 * @module app.controller
 * @version 1.0.0
 */
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/** 根路径控制器，提供基础 API 端点 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** GET / - 返回问候信息（用于健康检查） */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
