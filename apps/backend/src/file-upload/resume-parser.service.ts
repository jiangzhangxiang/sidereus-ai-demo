/**
 * @fileoverview AI 简历解析服务
 * @description 调用阿里云通义千问（qwen-plus）大模型 API，从 PDF 简历文本中提取结构化信息。
 *              支持同步解析和 SSE 流式解析两种模式。提取的信息包括基本信息、教育经历、工作经历和技能标签。
 * @module file-upload/resume-parser.service
 * @version 1.0.0
 */
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as http from 'http';
import * as https from 'https';

/** 简历解析结果的数据结构定义 */
interface ResumeData {
  basicInfo: {
    name: string;
    phone: string;
    email: string;
    city: string;
  };
  education: Array<{
    school: string;
    major: string;
    degree: string;
    graduationDate: string;
  }>;
  workExperience: Array<{
    company: string;
    position: string;
    period: string;
    description: string;
  }>;
  skills: string[];
}

@Injectable()
export class ResumeParserService {
  /** 阿里云 DashScope API 配置 */
  private readonly aiApiConfig = {
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    apiKey: 'sk-b0b2d4f0e1df4a6882afda42b4ff3fa9',
    model: 'qwen-plus',
  };

  /**
   * 同步解析简历文本（等待完整响应）
   * @param text - 从 PDF 中提取的原始文本
   * @returns 结构化的简历数据
   * @throws Error - AI API 调用失败或响应解析失败时抛出
   */
  async parseResume(text: string): Promise<ResumeData> {
    try {
      const response = await axios.post(
        this.aiApiConfig.url,
        {
          model: this.aiApiConfig.model,
          messages: [
            {
              role: 'user',
              content: this.generatePrompt(text),
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.aiApiConfig.apiKey}`,
          },
        },
      );

      if (
        !response.data ||
        !response.data.choices ||
        !response.data.choices[0] ||
        !response.data.choices[0].message ||
        !response.data.choices[0].message.content
      ) {
        throw new Error('AI API响应结构不正确');
      }

      const aiResponse = response.data.choices[0].message.content;
      return this.parseAIResponse(aiResponse);
    } catch (error) {
      console.error('解析简历失败:', error);
      throw new Error(`解析简历失败: ${error.message || '未知错误'}`);
    }
  }

  /**
   * 生成发送给 AI 模型的提示词模板
   * @param text - 待解析的简历文本
   * @returns 包含输出格式要求的提示词字符串
   */
  private generatePrompt(text: string): string {
    return `请从以下简历文本中提取结构化信息：\n\n${text}\n\n请按照以下格式返回JSON数据，确保JSON格式正确：\n{\n  "basicInfo": {\n    "name": "姓名",\n    "phone": "电话",\n    "email": "邮箱",\n    "city": "所在城市"\n  },\n  "education": [\n    {\n      "school": "学校",\n      "major": "专业",\n      "degree": "学历",\n      "graduationDate": "毕业时间"\n    }\n  ],\n  "workExperience": [\n    {\n      "company": "公司名称",\n      "position": "职位",\n      "period": "时间段",\n      "description": "工作内容摘要"\n    }\n  ],\n  "skills": ["技术栈1", "工具1", "语言1"]\n}\n\n只返回JSON数据，不要添加其他任何文本。`;
  }

  /**
   * 解析 AI 返回的文本为结构化数据
   * @param response - AI 模型返回的原始文本
   * @returns 解析后的简历数据对象
   * @throws Error - 无法提取有效 JSON 时抛出
   */
  private parseAIResponse(response: string): ResumeData {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('无法从AI响应中提取JSON数据');
    } catch (error) {
      console.error('解析AI响应失败:', error);
      throw new Error('解析AI响应失败');
    }
  }

  /**
   * 流式解析简历（SSE 格式）
   * 使用异步生成器逐步返回 AI 的 token 输出，适用于实时展示解析进度。
   * @param text - 从 PDF 中提取的原始文本
   * @yields {string} SSE 格式的事件数据（token 或 complete）
   */
  async *streamParseResume(text: string): AsyncGenerator<string> {
    const httpAgent = new http.Agent({ keepAlive: true });
    const httpsAgent = new https.Agent({ keepAlive: true });

    const response = await axios.post(
      this.aiApiConfig.url,
      {
        model: this.aiApiConfig.model,
        messages: [
          {
            role: 'user',
            content: this.generatePrompt(text),
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        stream: true,
        stream_options: { include_usage: true },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.aiApiConfig.apiKey}`,
        },
        responseType: 'stream',
        httpAgent,
        httpsAgent,
      },
    );

    const stream = response.data;
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') {
          yield `data: ${JSON.stringify({ type: 'complete', data: true })}\n\n`;
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            yield `data: ${JSON.stringify({ type: 'token', data: content })}\n\n`;
          }
        } catch {
          continue;
        }
      }
    }

    yield `data: ${JSON.stringify({ type: 'complete', data: true })}\n\n`;
  }
}
