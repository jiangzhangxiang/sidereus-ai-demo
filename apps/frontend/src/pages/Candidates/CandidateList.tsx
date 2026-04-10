/**
 * @fileoverview 候选人列表页
 * @description 候选人管理的主页面，集成筛选栏、表格/卡片视图切换、分页控制和添加候选人弹窗。
 *              通过 Zustand Store 管理数据加载和筛选状态，支持按关键词、状态、技能标签进行多维筛选。
 * @module pages/Candidates/CandidateList
 * @version 1.0.0
 */
import React, { useEffect, useState } from 'react';
import { Table, Row, Col, Empty, Pagination, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCandidateStore } from '../../store/candidateStore';
import FilterBar from './FilterBar';
import CandidateCard from './CandidateCard';
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

  const columns = [
    {
      title: '候选人',
      key: 'candidate',
      render: (_: unknown, record: (typeof pagedCandidates)[0]) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.basicInfo.name}</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
            {record.basicInfo.city} · {record.basicInfo.phone}
          </div>
        </div>
      ),
    },
    {
      title: '技能标签',
      dataIndex: 'skills',
      key: 'skills',
      render: (skills: string[]) => (
        <span>
          {skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              style={{
                display: 'inline-block',
                background: '#e6f4ff',
                color: '#1677ff',
                padding: '1px 8px',
                borderRadius: 10,
                fontSize: 12,
                marginRight: 4,
                marginBottom: 2,
              }}
            >
              {skill}
            </span>
          ))}
          {skills.length > 3 && (
            <span style={{ fontSize: 12, color: '#999' }}>
              +{skills.length - 3}
            </span>
          )}
        </span>
      ),
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      sorter: true,
      render: (score: number) => (
        <span
          style={{
            fontWeight: 700,
            fontSize: 16,
            color:
              score >= 90
                ? '#52c41a'
                : score >= 80
                  ? '#1677ff'
                  : score >= 70
                    ? '#faad14'
                    : '#ff4d4f',
          }}
        >
          {score}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'default',
          screened: 'processing',
          interviewing: 'warning',
          hired: 'success',
          rejected: 'error',
        };
        const labels: Record<string, string> = {
          pending: '待筛选',
          screened: '初筛通过',
          interviewing: '面试中',
          hired: '已录用',
          rejected: '已淘汰',
        };
        return (
          <span
            style={{
              color: {
                default: '#666',
                processing: '#1677ff',
                warning: '#faad14',
                success: '#52c41a',
                error: '#ff4d4f',
              }[colors[status] || 'default'],
              fontWeight: 500,
            }}
          >
            {labels[status] || status}
          </span>
        );
      },
    },
    {
      title: '上传时间',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 170,
      render: (date: string) =>
        new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      render: (_: unknown, record: (typeof pagedCandidates)[0]) => (
        <a
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/candidates/${record.id}`;
          }}
          style={{ color: '#1677ff' }}
        >
          查看详情 →
        </a>
      ),
    },
  ];

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
        <Table
          dataSource={pagedCandidates}
          columns={columns}
          rowKey="id"
          pagination={false}
          onRow={(record) => ({
            onClick: () => {
              window.location.href = `/candidates/${record.id}`;
            },
            style: { cursor: 'pointer' },
          })}
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
