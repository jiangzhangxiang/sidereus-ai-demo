const API_BASE_URL = 'http://localhost:3000';

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

export interface UploadError {
  error: string;
}

export interface StreamEvent {
  type: 'token' | 'complete';
  data: string | boolean;
}

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
