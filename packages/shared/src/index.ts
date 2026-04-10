export interface User {
  id: number;
  name: string;
  email: string;
}

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export type CandidateStatus =
  | 'pending'
  | 'screened'
  | 'interviewing'
  | 'hired'
  | 'rejected';

export const CandidateStatusLabels: Record<CandidateStatus, string> = {
  pending: '待筛选',
  screened: '初筛通过',
  interviewing: '面试中',
  hired: '已录用',
  rejected: '已淘汰',
};

export const CandidateStatusColors: Record<CandidateStatus, string> = {
  pending: 'default',
  screened: 'processing',
  interviewing: 'warning',
  hired: 'success',
  rejected: 'error',
};

export interface ScoreBreakdown {
  technicalSkills: number;
  experience: number;
  education: number;
  communication: number;
  potential: number;
}

export interface Education {
  school: string;
  major: string;
  degree: string;
  graduationDate: string;
}

export interface WorkExperience {
  company: string;
  position: string;
  period: string;
  description: string;
}

export interface CandidateBasicInfo {
  name: string;
  phone: string;
  email: string;
  city: string;
}

export interface Candidate {
  id: string;
  basicInfo: CandidateBasicInfo;
  education: Education[];
  workExperience: WorkExperience[];
  skills: string[];
  score: number;
  scoreBreakdown: ScoreBreakdown;
  status: CandidateStatus;
  resumeUrl: string;
  uploadedAt: string;
  notes?: string;
}

export interface StatusHistoryRecord {
  id: string;
  candidateId: string;
  fromStatus: CandidateStatus | null;
  toStatus: CandidateStatus;
  changedAt: string;
  changedBy: string;
  reason?: string;
}

export type ViewMode = 'table' | 'card';

export type SortField = 'score' | 'uploadedAt';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  searchKeyword: string;
  sortField: SortField;
  sortOrder: SortOrder;
  selectedSkills: string[];
  selectedStatuses: CandidateStatus[];
}
