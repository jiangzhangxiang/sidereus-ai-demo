import { create } from 'zustand';
import type {
  Candidate,
  CandidateStatus,
  FilterState,
  StatusHistoryRecord,
  ViewMode,
} from '@demo/shared';
import {
  fetchCandidates,
  createCandidate as apiCreateCandidate,
  updateCandidate as apiUpdateCandidate,
  deleteCandidate as apiDeleteCandidate,
} from '../api/candidates';

interface CandidateStore {
  candidates: Candidate[];
  statusHistory: StatusHistoryRecord[];
  viewMode: ViewMode;
  filter: FilterState;
  currentPage: number;
  pageSize: number;
  totalCandidates: number;
  totalPages: number;
  loading: boolean;

  setViewMode: (mode: ViewMode) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  loadCandidates: () => Promise<void>;
  addCandidate: (candidate: Partial<Candidate>) => Promise<void>;
  updateCandidate: (id: string, data: Partial<Candidate>) => Promise<void>;
  updateCandidateStatus: (
    id: string,
    newStatus: CandidateStatus,
    reason?: string,
  ) => Promise<void>;
  deleteCandidate: (id: string) => Promise<void>;
  getFilteredCandidates: () => Candidate[];
  getTotalCount: () => number;
  getPagedCandidates: () => Candidate[];
  getAllSkills: () => string[];
}

export const useCandidateStore = create<CandidateStore>((set, get) => ({
  candidates: [],
  statusHistory: [],
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
  totalPages: 0,
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
        totalPages: response.totalPages,
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
    } catch (error) {
      console.error('添加候选人失败:', error);
      throw error;
    }
  },

  updateCandidate: async (id, data) => {
    try {
      const updatedCandidate = await apiUpdateCandidate(id, data);
      set((state) => ({
        candidates: state.candidates.map((c) =>
          c.id === id ? updatedCandidate : c,
        ),
      }));
    } catch (error) {
      console.error('更新候选人失败:', error);
      throw error;
    }
  },

  updateCandidateStatus: async (id, newStatus, reason) => {
    const candidate = get().candidates.find((c) => c.id === id);
    if (!candidate) return;

    const historyRecord: StatusHistoryRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      candidateId: id,
      fromStatus: candidate.status,
      toStatus: newStatus,
      changedAt: new Date().toISOString(),
      changedBy: '当前用户',
      reason,
    };

    try {
      await apiUpdateCandidate(id, { status: newStatus });
      set((state) => ({
        candidates: state.candidates.map((c) =>
          c.id === id ? { ...c, status: newStatus } : c,
        ),
        statusHistory: [...state.statusHistory, historyRecord],
      }));
    } catch (error) {
      console.error('更新候选人状态失败:', error);
      throw error;
    }
  },

  deleteCandidate: async (id) => {
    try {
      await apiDeleteCandidate(id);
      set((state) => ({
        candidates: state.candidates.filter((c) => c.id !== id),
        totalCandidates: state.totalCandidates - 1,
      }));
    } catch (error) {
      console.error('删除候选人失败:', error);
      throw error;
    }
  },

  getFilteredCandidates: () => {
    return get().candidates;
  },

  getTotalCount: () => get().totalCandidates,

  getPagedCandidates: () => {
    return get().candidates;
  },

  getAllSkills: () => {
    const { candidates } = get();
    const skillSet = new Set<string>();
    candidates.forEach((c) => c.skills.forEach((s) => skillSet.add(s)));
    return Array.from(skillSet).sort();
  },
}));
