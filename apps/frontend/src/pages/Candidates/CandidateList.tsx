/**
 * @fileoverview 候选人列表页
 * @description 候选人管理的主页面，集成筛选栏、表格/卡片视图切换、分页控制和添加候选人弹窗。
 *              通过 Zustand Store 管理数据加载和筛选状态，支持按关键词、状态、技能标签进行多维筛选。
 * @module pages/Candidates/CandidateList
 * @version 1.0.0
 */
import React, { useEffect, useState } from 'react';
import { Row, Col, Empty, Pagination, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCandidateStore } from '../../store/candidateStore';
import FilterBar from './FilterBar';
import CandidateCard from './CandidateCard';
import CandidateTable from './CandidateTable';
import AddCandidatesModal from './AddCandidatesModal';

const CandidateList: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const {
    viewMode,
    filter,
    currentPage,
    pageSize,
    loading,
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

  const pagedCandidates = candidates;
  const total = getTotalCount();
  const allSkills = getAllSkills();

  const handleRefresh = () => {
    loadCandidates();
  };

  return (
    <div style={{ padding: '0 0 24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
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
        />
      ) : (
        <Row gutter={[16, 16]}>
          {pagedCandidates.map((candidate) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={candidate.id}>
              <CandidateCard candidate={candidate} />
            </Col>
          ))}
        </Row>
      )}

      {total > 0 && (
        <div
          style={{
            marginTop: 20,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            showQuickJumper
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
    </div>
  );
};

export default CandidateList;
