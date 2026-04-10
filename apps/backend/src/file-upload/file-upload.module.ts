import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { ResumeParserService } from './resume-parser.service';
import { FileUploadController } from './file-upload.controller';

@Module({
  controllers: [FileUploadController],
  providers: [FileUploadService, ResumeParserService],
})
export class FileUploadModule {}
