/**
 * @fileoverview 共享类型定义和常量
 * @description Monorepo 共享包，定义前后端共用的 TypeScript 类型、接口、枚举常量和工具函数。
 *              包括候选人数据模型（Candidate, Education, WorkExperience 等）、状态管理类型、
 *              筛选/排序/视图模式类型以及日期格式化工具函数。
 * @module shared/index
 * @version 1.0.0
 */

/** 用户基础信息接口 */
export interface User {
  /** 用户唯一标识 */
  id: number;
  /** 用户姓名 */
  name: string;
  /** 用户邮箱 */
  email: string;
}

/** 格式化日期为 YYYY-MM-DD 字符串 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/** 候选人状态联合类型 */
export type CandidateStatus =
  | 'pending'
  | 'screened'
  | 'interviewing'
  | 'hired'
  | 'rejected';

/** 候选人状态中文标签映射表 */
export const CandidateStatusLabels: Record<CandidateStatus, string> = {
  pending: '待筛选',
  screened: '初筛通过',
  interviewing: '面试中',
  hired: '已录用',
  rejected: '已淘汰',
};

/** 候选人状态 Ant Design Tag 颜色映射表 */
export const CandidateStatusColors: Record<CandidateStatus, string> = {
  pending: 'default',
  screened: 'processing',
  interviewing: 'warning',
  hired: 'success',
  rejected: 'error',
};

/** 评分明细维度接口：五个维度的评分（各 0-100） */
export interface ScoreBreakdown {
  /** 技术能力评分 */
  technicalSkills: number;
  /** 项目经验评分 */
  experience: number;
  /** 教育背景评分 */
  education: number;
  /** 沟通表达评分 */
  communication: number;
  /** 发展潜力评分 */
  potential: number;
}

/** 教育经历接口 */
export interface Education {
  /** 学校名称 */
  school: string;
  /** 专业名称 */
  major: string;
  /** 学历层次（博士/硕士/本科/大专） */
  degree: string;
  /** 毕业时间 */
  graduationDate: string;
}

/** 工作经历接口 */
export interface WorkExperience {
  /** 公司名称 */
  company: string;
  /** 职位名称 */
  position: string;
  /** 工作时间段 */
  period: string;
  /** 工作描述 */
  description: string;
}

/** 候选人基本信息接口 */
export interface CandidateBasicInfo {
  /** 姓名 */
  name: string;
  /** 联系电话 */
  phone: string;
  /** 电子邮箱 */
  email: string;
  /** 所在城市 */
  city: string;
}

/** 候选人完整数据模型 */
export interface Candidate {
  /** 唯一标识（UUID） */
  id: string;
  /** 基本信息 */
  basicInfo: CandidateBasicInfo;
  /** 教育经历列表 */
  education: Education[];
  /** 工作经历列表 */
  workExperience: WorkExperience[];
  /** 技能标签数组 */
  skills: string[];
  /** 综合评分（0-100） */
  score: number;
  /** 五维度评分明细 */
  scoreBreakdown: ScoreBreakdown;
  /** 当前状态 */
  status: CandidateStatus;
  /** 简历文件 URL */
  resumeUrl: string;
  /** 上传时间（ISO 格式） */
  uploadedAt: string;
  /** 备注信息（可选） */
  notes?: string;
}

/** 状态变更历史记录接口 */
export interface StatusHistoryRecord {
  /** 记录唯一标识 */
  id: string;
  /** 关联的候选人 ID */
  candidateId: string;
  /** 变更前状态（首次变更时为 null） */
  fromStatus: CandidateStatus | null;
  /** 变更后状态 */
  toStatus: CandidateStatus;
  /** 变更时间 */
  changedAt: string;
  /** 操作人 */
  changedBy: string;
  /** 变更原因备注（可选） */
  reason?: string;
}

/** 视图模式联合类型 */
export type ViewMode = 'table' | 'card';

/** 排序字段联合类型 */
export type SortField = 'score' | 'uploadedAt';
/** 排序方向联合类型 */
export type SortOrder = 'asc' | 'desc';

/** 筛选条件集合接口 */
export interface FilterState {
  /** 搜索关键词 */
  searchKeyword: string;
  /** 排序字段 */
  sortField: SortField;
  /** 排序方向 */
  sortOrder: SortOrder;
  /** 已选技能标签 */
  selectedSkills: string[];
  /** 已选状态标签 */
  selectedStatuses: CandidateStatus[];
}

/** 岗位数据模型 */
export interface Job {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  plus_skills: string[];
  created_at: string;
  updated_at: string;
}

/** 匹配维度评分接口 */
export interface MatchDimensions {
  skill_match: number;
  experience_relevance: number;
  education_fit: number;
}

/** 匹配分析结果接口 */
export interface MatchResult {
  overall_score: number;
  dimensions: MatchDimensions;
  comment: string;
}

/** 匹配请求接口（前端发送给后端） */
export interface MatchRequest {
  job: {
    title: string;
    description: string;
    required_skills: string[];
    plus_skills?: string[];
  };
  candidate: {
    basicInfo: CandidateBasicInfo;
    skills?: string[];
    workExperience?: WorkExperience[];
    education?: Education[];
  };
}
