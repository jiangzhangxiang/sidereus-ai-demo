/**
 * @fileoverview 候选人全局状态管理（Zustand Store）
 * @description 使用 Zustand 管理候选人列表的全局状态，包括数据加载、分页、筛选、视图切换等功能。
 *              作为前端与后端 API 交互的中间层，统一管理候选人数据的获取和更新。
 * @module store/candidateStore
 * @version 1.0.0
 */
import { create } from 'zustand';
import type { Candidate, FilterState, ViewMode } from '@demo/shared';
import {
  fetchCandidates,
  createCandidate as apiCreateCandidate,
} from '../api/candidates';

/** 候选人状态管理接口定义 */
interface CandidateStore {
  /** 候选人列表数据 */
  candidates: Candidate[];
  /** 当前视图模式（表格/卡片） */
  viewMode: ViewMode;
  /** 筛选条件集合 */
  filter: FilterState;
  /** 当前页码 */
  currentPage: number;
  /** 每页记录数 */
  pageSize: number;
  /** 总记录数 */
  totalCandidates: number;
  /** 数据加载状态 */
  loading: boolean;

  /** 切换视图模式 */
  setViewMode: (mode: ViewMode) => void;
  /** 更新筛选条件（自动重置到第一页） */
  setFilter: (filter: Partial<FilterState>) => void;
  /** 设置当前页码 */
  setCurrentPage: (page: number) => void;
  /** 设置每页大小（自动重置到第一页） */
  setPageSize: (size: number) => void;
  /** 根据当前筛选和分页条件加载候选人列表 */
  loadCandidates: () => Promise<void>;
  /** 创建新候选人并追加到列表 */
  addCandidate: (candidate: Partial<Candidate>) => Promise<Candidate>;
  /** 获取总记录数 */
  getTotalCount: () => number;
  /** 获取所有已存在的技能标签（去重排序） */
  getAllSkills: () => string[];
}

export const useCandidateStore = create<CandidateStore>((set, get) => ({
  candidates: [],
  viewMode: 'table',
  filter: {
    searchKeyword: '',
    sortField: 'uploadedAt',
    sortOrder: 'desc',
    selectedSkills: [],
    selectedStatuses: [],
  },
  currentPage: 1,
  pageSize: 5,
  totalCandidates: 0,
  loading: false,

  setViewMode: (mode) => set({ viewMode: mode }),

  setFilter: (newFilter) =>
    set((state) => ({
      filter: { ...state.filter, ...newFilter },
      currentPage: 1,
    })),

  setCurrentPage: (page) => set({ currentPage: page }),

  setPageSize: (size) =>
    set({ pageSize: size, currentPage: 1 }),

  loadCandidates: async () => {
    set({ loading: true });
    try {
      const { filter, currentPage, pageSize } = get();
      const response = await fetchCandidates({
        page: currentPage,
        pageSize,
        search: filter.searchKeyword || undefined,
        status: filter.selectedStatuses.length > 0 ? filter.selectedStatuses[0] : undefined,
        skills: filter.selectedSkills.length > 0 ? filter.selectedSkills : undefined,
        sortBy: filter.sortField,
        sortOrder: filter.sortOrder,
      });

      set({
        candidates: response.items,
        totalCandidates: response.total,
        loading: false,
      });
    } catch (error) {
      console.error('加载候选人失败:', error);
      set({ loading: false });
    }
  },

  addCandidate: async (candidate) => {
    try {
      const newCandidate = await apiCreateCandidate(candidate);
      set((state) => ({
        candidates: [newCandidate, ...state.candidates],
        totalCandidates: state.totalCandidates + 1,
      }));
      return newCandidate;
    } catch (error) {
      console.error('添加候选人失败:', error);
      throw error;
    }
  },

  getTotalCount: () => get().totalCandidates,

  getAllSkills: () => {
    const { candidates } = get();
    const skillSet = new Set<string>();
    candidates.forEach((c) => c.skills.forEach((s: string) => skillSet.add(s)));
    return Array.from(skillSet).sort();
  },
}));
