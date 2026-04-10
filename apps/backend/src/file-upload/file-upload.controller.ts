/**
 * @fileoverview 文件上传控制器
 * @description 处理简历文件上传请求，支持 PDF 文件上传、解析及流式响应。
 *              根据客户端 Accept 头自动选择普通 JSON 响应或 SSE（Server-Sent Events）流式响应模式。
 * @module file-upload/file-upload.controller
 * @version 1.0.0
 */
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Res,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FileUploadService } from './file-upload.service';
import { ResumeParserService } from './resume-parser.service';

@Controller('api/upload')
export class FileUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly resumeParserService: ResumeParserService,
  ) {}

  /**
   * 上传并解析 PDF 简历
   * @param file - 上传的 PDF 文件（Multer 处理）
   * @param res - Express Response 对象（用于自定义响应格式）
   * @param acceptHeader - 客户端 Accept 请求头（判断是否需要 SSE 流式响应）
   */
  @Post('resume')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
    @Headers('accept') acceptHeader: string,
  ) {
    try {
      if (!file) {
        return res.status(400).json({ error: '请选择文件' });
      }

      if (!file.mimetype.includes('pdf')) {
        return res.status(400).json({ error: '只能上传PDF格式文件' });
      }

      const filePath = await this.fileUploadService.saveFile(file);
      const pdfText = await this.fileUploadService.parsePdf(filePath);

      await this.fileUploadService.cleanupFile(filePath);

      if (acceptHeader?.includes('text/event-stream')) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of this.resumeParserService.streamParseResume(
          pdfText,
        )) {
          res.write(chunk);
        }

        res.end();
      } else {
        const resumeData = await this.resumeParserService.parseResume(pdfText);
        res.status(200).json(resumeData);
      }
    } catch (error) {
      console.error('上传失败:', error);
      res.status(500).json({ error: '上传失败，请稍后重试' });
    }
  }
}
