/**
 * @fileoverview 候选人 API 请求模块
 * @description 封装与后端 /api/candidates 接口的所有 HTTP 通信逻辑。
 *              提供分页查询、详情查询、创建、更新和删除候选人的异步函数。
 * @module api/candidates
 * @version 1.0.0
 */
import type { Candidate, FilterState } from '@demo/shared';

/** 后端 API 基础地址 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/** 分页响应通用结构 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 分页查询候选人列表
 * @param params - 查询参数（分页、搜索、筛选、排序）
 * @returns 分页结果（包含候选人列表及元信息）
 * @throws Error - 请求失败时抛出
 */
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

/**
 * 根据 ID 查询候选人详情
 * @param id - 候选人 UUID
 * @returns 候选人完整信息
 * @throws Error - 请求失败时抛出
 */
export async function fetchCandidateById(id: string): Promise<Candidate> {
  const response = await fetch(`${API_BASE_URL}/api/candidates/${id}`);

  if (!response.ok) {
    throw new Error('获取候选人详情失败');
  }

  return response.json();
}

/**
 * 创建新候选人
 * @param data - 候选人数据
 * @returns 创建的候选人对象
 * @throws Error - 请求失败时抛出
 */
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

/**
 * 更新候选人信息
 * @param id - 候选人 UUID
 * @param data - 需要更新的字段数据
 * @returns 更新后的候选人对象
 * @throws Error - 请求失败时抛出
 */
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

/**
 * 删除候选人
 * @param id - 候选人 UUID
 * @throws Error - 请求失败时抛出
 */
export async function deleteCandidate(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/candidates/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('删除候选人失败');
  }
}

/**
 * 更新候选人状态
 * @param id - 候选人 UUID
 * @param status - 新状态
 * @param reason - 变更原因（可选）
 * @returns 更新后的候选人对象
 * @throws Error - 请求失败或状态转换不合法时抛出
 */
export async function updateCandidateStatus(
  id: string,
  status: string,
  reason?: string,
): Promise<Candidate> {
  const response = await fetch(`${API_BASE_URL}/api/candidates/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reason }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || '更新候选人状态失败');
  }

  return response.json();
}
