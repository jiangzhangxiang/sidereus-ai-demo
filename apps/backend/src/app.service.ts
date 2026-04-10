/**
 * @fileoverview 应用根服务
 * @description 提供应用级别的基础业务逻辑，目前仅包含问候功能。
 * @module app.service
 * @version 1.0.0
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /** 获取问候消息 */
  getHello(): string {
    return 'Hello World!';
  }
}
