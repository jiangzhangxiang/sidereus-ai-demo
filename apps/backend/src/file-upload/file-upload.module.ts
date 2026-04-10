/**
 * @fileoverview 文件上传模块定义
 * @description NestJS 功能模块，整合文件上传和简历解析相关的控制器与服务。
 *              提供 /api/upload 路由下的简历上传与 AI 解析能力。
 * @module file-upload/file-upload.module
 * @version 1.0.0
 */
import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { ResumeParserService } from './resume-parser.service';
import { FileUploadController } from './file-upload.controller';

@Module({
  controllers: [FileUploadController],
  providers: [FileUploadService, ResumeParserService],
})
export class FileUploadModule {}
