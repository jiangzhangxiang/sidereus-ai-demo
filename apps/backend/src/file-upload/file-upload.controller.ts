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
        const resumeData =
          await this.resumeParserService.parseResume(pdfText);
        res.status(200).json(resumeData);
      }
    } catch (error) {
      console.error('上传失败:', error);
      res.status(500).json({ error: '上传失败，请稍后重试' });
    }
  }
}
