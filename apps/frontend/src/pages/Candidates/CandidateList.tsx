/**
 * @fileoverview 候选人列表页
 * @description 候选人管理的主页面，集成筛选栏、表格/卡片视图切换、分页控制、添加候选人弹窗，
 *              以及岗位选择和智能匹配分析功能。通过 Zustand Store 管理数据加载和筛选状态。
 *              支持移动端响应式：顶部工具栏自适应布局、卡片视图单列显示、分页组件简化。
 * @module pages/Candidates/CandidateList
 * @version 1.1.0
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Empty, Pagination, Button, Select, Space, message, Tooltip } from 'antd';
import { PlusOutlined, AimOutlined, EditOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { useCandidateStore } from '../../store/candidateStore';
import FilterBar from './FilterBar';
import CandidateCard from './CandidateCard';
import CandidateTable from './CandidateTable';
import AddCandidatesModal from './AddCandidatesModal';
import MatchResultDrawer from '../../components/MatchResultDrawer';
import { fetchJobs } from '../../api/jobs';
import { analyzeMatch } from '../../api/match';
import type { Job, MatchResult, Candidate, MatchRequest } from '@demo/shared';
import useIsMobile from '../../hooks/useIsMobile';

const CandidateList: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();
  const [modalOpen, setModalOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchCandidate, setMatchCandidate] = useState<Candidate | null>(null);
  const [matchJob, setMatchJob] = useState<Job | null>(null);

  const {
    viewMode,
    filter,
    currentPage,
    pageSize,
    loading: candidateLoading,
    candidates,
    setViewMode,
    setFilter,
    setCurrentPage,
    setPageSize,
    loadCandidates,
    getTotalCount,
    getAllSkills,
  } = useCandidateStore();

  useEffect(() => {
    loadCandidates();
  }, [filter, currentPage, pageSize, loadCandidates]);

  useEffect(() => {
    fetchJobs()
      .then((data) => {
        setJobs(data);
        if (data.length > 0 && !selectedJobId) {
          setSelectedJobId(data[0].id);
        }
      })
      .catch(() => message.error('加载岗位列表失败'));
  }, []);

  const pagedCandidates = candidates;
  const total = getTotalCount();
  const allSkills = getAllSkills();

  const handleRefresh = () => {
    loadCandidates();
  };

  const doMatch = useCallback(
    async (candidate: Candidate) => {
      if (!selectedJobId) {
        message.warning('请先选择一个岗位');
        return;
      }

      const job = jobs.find((j) => j.id === selectedJobId);
      if (!job) {
        message.error('未找到所选岗位数据');
        return;
      }

      setMatchCandidate(candidate);
      setMatchJob(job);
      setMatchResult(null);
      setDrawerOpen(true);
      setMatchLoading(true);

      try {
        const payload: MatchRequest = {
          job: {
            title: job.title,
            description: job.description,
            required_skills: job.required_skills || [],
            plus_skills: job.plus_skills || [],
          },
          candidate: {
            basicInfo: candidate.basicInfo,
            skills: candidate.skills,
            workExperience: candidate.workExperience,
            education: candidate.education,
          },
        };
        const result = await analyzeMatch(payload);
        setMatchResult(result);
      } catch {
        message.error('匹配分析请求失败，请稍后重试');
      } finally {
        setMatchLoading(false);
      }
    },
    [selectedJobId, jobs],
  );

  return (
    <div style={{ padding: isMobile ? '0 0 16px' : '0 0 24px' }}>
      {/* 顶部工具栏：岗位选择 + 操作按钮 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          marginBottom: isMobile ? 12 : 16,
          flexWrap: 'wrap',
          gap: isMobile ? 12 : 12,
          flexDirection: isMobile ? 'column' : 'row',
        }}
      >
        <div style={{ 
          width: isMobile ? '100%' : 'auto',
          display: 'flex', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          gap: isMobile ? 8 : 'small'
        }}>
          <span style={{ fontSize: 14, color: '#666' }}>选择岗位：</span>
          <Select
            value={selectedJobId}
            onChange={setSelectedJobId}
            style={{ width: isMobile ? '100%' : 200, minWidth: isMobile ? '100%' : 150 }}
            placeholder="请选择要匹配的岗位"
            options={jobs.map((j) => ({ label: j.title, value: j.id }))}
          />
          {selectedJobId && (
            <Tooltip title="编辑当前岗位">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/job/${selectedJobId}`)}
              >
                编辑
              </Button>
            </Tooltip>
          )}
          <Tooltip title="创建新岗位">
            <Button
              type="text"
              size="small"
              icon={<PlusCircleOutlined />}
              onClick={() => navigate('/job/edit')}
              style={{ color: '#1677ff' }}
            >
              新建岗位
            </Button>
          </Tooltip>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
          style={{ width: isMobile ? '100%' : 'auto' }}
          block={isMobile}
        >
          添加候选人
        </Button>
      </div>

      <FilterBar
        viewMode={viewMode}
        searchKeyword={filter.searchKeyword}
        sortField={filter.sortField}
        sortOrder={filter.sortOrder}
        selectedSkills={filter.selectedSkills}
        selectedStatuses={filter.selectedStatuses}
        allSkills={allSkills}
        onViewModeChange={setViewMode}
        onSearchChange={(v) => setFilter({ searchKeyword: v })}
        onSortFieldChange={(v) => setFilter({ sortField: v })}
        onSortOrderChange={(v) => setFilter({ sortOrder: v })}
        onSkillSelect={(v) => setFilter({ selectedSkills: v })}
        onStatusSelect={(v) => setFilter({ selectedStatuses: v })}
        onReset={() =>
          setFilter({
            searchKeyword: '',
            selectedSkills: [],
            selectedStatuses: [],
          })
        }
      />

      {pagedCandidates.length === 0 ? (
        <Empty description="暂无匹配的候选人" style={{ marginTop: 60 }} />
      ) : viewMode === 'table' ? (
        <CandidateTable
          candidates={pagedCandidates}
          onRefresh={handleRefresh}
          onMatch={doMatch}
        />
      ) : (
        <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
          {pagedCandidates.map((candidate) => (
            <Col xs={24} sm={12} lg={isMobile ? 24 : 8} xl={isMobile ? 24 : 6} key={candidate.id}>
              <CandidateCard candidate={candidate} />
            </Col>
          ))}
        </Row>
      )}

      {total > 0 && (
        <div
          style={{
            marginTop: isMobile ? 16 : 20,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            size={isMobile ? 'small' : undefined}
            showSizeChanger={!isMobile}
            showQuickJumper={!isMobile}
            simple={isMobile}
            showTotal={(t) => `共 ${t} 条记录`}
            pageSizeOptions={['5', '10', '20', '50']}
            onChange={(page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) setPageSize(size);
            }}
          />
        </div>
      )}

      <AddCandidatesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      <MatchResultDrawer
        open={drawerOpen}
        result={matchResult}
        loading={matchLoading}
        candidate={matchCandidate}
        job={matchJob}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
};

export default CandidateList;
