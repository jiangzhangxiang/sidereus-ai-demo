import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class FileUploadService {
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    // 确保上传目录存在
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // 保存文件到本地
  async saveFile(file: Express.Multer.File): Promise<string> {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.uploadDir, fileName);

    await fs.promises.writeFile(filePath, file.buffer);
    return filePath;
  }

  // 解析PDF文件内容
  async parsePdf(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const pdf = new PDFParse({ data: dataBuffer });
    const result = await pdf.getText();
    return result.text;
  }

  // 清理临时文件
  async cleanupFile(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}