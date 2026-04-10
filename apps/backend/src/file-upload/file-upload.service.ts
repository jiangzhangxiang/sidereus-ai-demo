/**
 * @fileoverview 文件上传服务
 * @description 提供文件存储、PDF 文本提取和临时文件清理功能。
 *              使用 pdf-parse 库解析 PDF 内容，文件临时存储在 uploads 目录下。
 * @module file-upload/file-upload.service
 * @version 1.0.0
 */
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class FileUploadService {
  /** 文件上传目录路径 */
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * 将上传的文件保存到本地磁盘
   * @param file - Multer 处理后的文件对象
   * @returns 保存后的文件绝对路径
   */
  async saveFile(file: Express.Multer.File): Promise<string> {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.uploadDir, fileName);

    await fs.promises.writeFile(filePath, file.buffer);
    return filePath;
  }

  /**
   * 解析 PDF 文件内容为纯文本
   * @param filePath - PDF 文件的绝对路径
   * @returns 提取出的文本内容
   */
  async parsePdf(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const pdf = new PDFParse({ data: dataBuffer });
    const result = await pdf.getText();
    return result.text;
  }

  /**
   * 清理临时文件
   * @param filePath - 需要删除的文件路径
   */
  async cleanupFile(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}