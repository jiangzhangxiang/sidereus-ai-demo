/**
 * @fileoverview 智能匹配 API 请求模块
 * @description 封装与后端 /api/match 接口的 HTTP 通信逻辑。
 *              发送岗位需求和候选人简历数据，获取多维度匹配评分及 AI 评语。
 * @module api/match
 * @version 1.0.0
 */
import type { MatchRequest, MatchResult } from '@demo/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export async function analyzeMatch(data: MatchRequest): Promise<MatchResult> {
  const response = await fetch(`${API_BASE_URL}/api/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('匹配分析请求失败');
  return response.json();
}
