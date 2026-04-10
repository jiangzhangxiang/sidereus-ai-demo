import type { Candidate, FilterState } from '@demo/shared';

const API_BASE_URL = 'http://localhost:3000';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function fetchCandidates(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  skills?: string[];
  sortBy?: string;
  sortOrder?: string;
}): Promise<PaginatedResponse<Candidate>> {
  const searchParams = new URLSearchParams();
  
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params?.search) searchParams.set('search', params.search);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.skills && params.skills.length > 0) {
    searchParams.set('skills', params.skills.join(','));
  }
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const response = await fetch(
    `${API_BASE_URL}/api/candidates?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error('获取候选人列表失败');
  }

  return response.json();
}

export async function fetchCandidateById(id: string): Promise<Candidate> {
  const response = await fetch(`${API_BASE_URL}/api/candidates/${id}`);

  if (!response.ok) {
    throw new Error('获取候选人详情失败');
  }

  return response.json();
}

export async function createCandidate(data: Partial<Candidate>): Promise<Candidate> {
  const response = await fetch(`${API_BASE_URL}/api/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('创建候选人失败');
  }

  return response.json();
}

export async function updateCandidate(
  id: string,
  data: Partial<Candidate>,
): Promise<Candidate> {
  const response = await fetch(`${API_BASE_URL}/api/candidates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('更新候选人失败');
  }

  return response.json();
}

export async function deleteCandidate(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/candidates/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('删除候选人失败');
  }
}
