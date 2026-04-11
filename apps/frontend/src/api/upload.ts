/**
 * @fileoverview 简历上传 API 请求模块
 * @description 封装简历文件上传接口的通信逻辑，支持普通上传和 SSE 流式上传两种模式。
 *              与后端 /api/upload/resume 接口交互，返回 AI 解析后的结构化简历数据。
 * @module api/upload
 * @version 1.0.0
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/** 上传成功后的简历解析结果 */
export interface UploadResponse {
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

/** 上传错误响应 */
export interface UploadError {
  error: string;
}

/** SSE 流式事件类型定义 */
export interface StreamEvent {
  type: 'token' | 'complete';
  data: string | boolean;
}

/**
 * 上传 PDF 简历文件（普通模式）
 * @param file - 待上传的 PDF 文件对象
 * @returns AI 解析后的结构化简历数据
 * @throws Error - 文件格式错误或上传失败时抛出
 */
export async function uploadResume(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/upload/resume`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData: UploadError = await response.json();
    throw new Error(errorData.error || '上传失败');
  }

  return response.json();
}

/**
 * 流式上传 PDF 简历文件（SSE 模式）
 * 使用异步生成器逐步接收 AI 解析的 token 数据，适用于实时展示解析进度。
 * @param file - 待上传的 PDF 文件对象
 * @yields {StreamEvent} SSE 流事件（token 或 complete）
 * @throws Error - 文件格式错误或上传失败时抛出
 */
export async function* uploadResumeStream(
  file: File,
): AsyncGenerator<StreamEvent> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/upload/resume`, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData: UploadError = await response.json();
    throw new Error(errorData.error || '上传失败');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法获取响应流');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;

      const data = trimmed.slice(5).trim();
      try {
        const event: StreamEvent = JSON.parse(data);
        yield event;

        if (event.type === 'complete') return;
      } catch {
        continue;
      }
    }
  }
}
