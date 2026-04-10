/**
 * @fileoverview 岗位 API 请求模块
 * @description 封装与后端 /api/jobs 接口的所有 HTTP 通信逻辑。
 *              提供列表查询、详情查询、创建、更新和删除岗位的异步函数。
 * @module api/jobs
 * @version 1.0.0
 */
import type { Job } from '@demo/shared';

const API_BASE_URL = 'http://localhost:3000';

export async function fetchJobs(): Promise<Job[]> {
  const response = await fetch(`${API_BASE_URL}/api/jobs`);
  if (!response.ok) throw new Error('获取岗位列表失败');
  return response.json();
}

export async function fetchJobById(id: string): Promise<Job> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${id}`);
  if (!response.ok) throw new Error('获取岗位详情失败');
  return response.json();
}

export async function createJob(data: Partial<Job>): Promise<Job> {
  const response = await fetch(`${API_BASE_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('创建岗位失败');
  return response.json();
}

export async function updateJob(id: string, data: Partial<Job>): Promise<Job> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('更新岗位失败');
  return response.json();
}
