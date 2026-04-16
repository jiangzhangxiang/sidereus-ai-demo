/**
 * @fileoverview 筛选工具栏组件
 * @description 提供候选人列表的多维筛选能力，包括关键词搜索、排序字段/方向切换、
 *              状态多选筛选、技能标签多选筛选以及表格/卡片视图模式切换。
 *              已激活的筛选项以 Tag 形式展示并支持单独移除。
 *              支持移动端响应式：移动端默认只显示搜索框和排序，其他筛选项可展开查看。
 * @module pages/Candidates/FilterBar
 * @version 1.1.0
 */
import React, { useState } from 'react';
import {
  Input,
  Select,
  Button,
  Space,
  Tag,
  Radio,
} from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  TableOutlined,
  ClearOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import type { CandidateStatus, ViewMode, SortField, SortOrder } from '@demo/shared';
import useIsMobile from '../../hooks/useIsMobile';

/** 筛选工具栏 Props 接口 */
interface FilterBarProps {
  viewMode: ViewMode;
  searchKeyword: string;
  sortField: SortField;
  sortOrder: SortOrder;
  selectedSkills: string[];
  selectedStatuses: CandidateStatus[];
  allSkills: string[];
  onViewModeChange: (mode: ViewMode) => void;
  onSearchChange: (value: string) => void;
  onSortFieldChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
  onSkillSelect: (skills: string[]) => void;
  onStatusSelect: (statuses: CandidateStatus[]) => void;
  onReset: () => void;
}

/** 候选人状态选项映射 */
const statusOptions = Object.entries({
  pending: '待筛选',
  screened: '初筛通过',
  interviewing: '面试中',
  hired: '已录用',
  rejected: '已淘汰',
}) as [CandidateStatus, string][];

/** 筛选工具栏组件 */
const FilterBar: React.FC<FilterBarProps> = ({
  viewMode,
  searchKeyword,
  sortField,
  sortOrder,
  selectedSkills,
  selectedStatuses,
  allSkills,
  onViewModeChange,
  onSearchChange,
  onSortFieldChange,
  onSortOrderChange,
  onSkillSelect,
  onStatusSelect,
  onReset,
}) => {
  const { isMobile } = useIsMobile();
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const hasActiveFilters =
    searchKeyword ||
    selectedSkills.length > 0 ||
    selectedStatuses.length > 0;

  return (
    <div
      style={{
        background: '#fff',
        padding: isMobile ? '12px 16px' : '16px 20px',
        borderRadius: 8,
        marginBottom: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* 第一行：搜索框 + 排序 + 展开/收起按钮（移动端） */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? 8 : 12, 
        flexWrap: 'wrap',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <Input
          placeholder="搜索姓名、技能、学校、公司..."
          prefix={<SearchOutlined style={{ color: '#999' }} />}
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          style={{ 
            width: isMobile ? '100%' : 220, 
            minWidth: isMobile ? '100%' : 160, 
            flex: isMobile ? 'none' : '1 1 200px' 
          }}
        />

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          width: isMobile ? '100%' : 'auto',
          flexWrap: 'wrap'
        }}>
          <Radio.Group
            value={sortField}
            onChange={(e) => onSortFieldChange(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size={isMobile ? 'small' : 'middle'}
          >
            <Radio.Button value="score">按评分</Radio.Button>
            <Radio.Button value="uploadedAt">按时间</Radio.Button>
          </Radio.Group>

          <Radio.Group
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size={isMobile ? 'small' : 'middle'}
          >
            <Radio.Button value="desc">
              {sortField === 'score' ? '降序' : '最新'}
            </Radio.Button>
            <Radio.Button value="asc">
              {sortField === 'score' ? '升序' : '最早'}
            </Radio.Button>
          </Radio.Group>

          {/* 移动端展开/收起更多筛选按钮 */}
          {isMobile && (
            <Button
              type="link"
              size="small"
              icon={showMoreFilters ? <UpOutlined /> : <DownOutlined />}
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              style={{ marginLeft: 'auto' }}
            >
              {showMoreFilters ? '收起筛选' : '更多筛选'}
            </Button>
          )}
        </div>

        {/* PC端：状态/技能筛选 + 操作按钮 */}
        {!isMobile && (
          <>
            <Select
              mode="multiple"
              placeholder="筛选状态"
              value={selectedStatuses}
              onChange={onStatusSelect}
              allowClear
              style={{ width: 180, minWidth: 140, flex: '1 1 150px' }}
              maxTagCount={1}
              options={statusOptions.map(([value, label]) => ({
                value,
                label,
              }))}
            />

            <Select
              mode="multiple"
              placeholder="筛选技能标签"
              value={selectedSkills}
              onChange={onSkillSelect}
              allowClear
              style={{ width: 200, minWidth: 160, flex: '1 1 170px' }}
              maxTagCount={2}
              options={allSkills.map((skill) => ({
                value: skill,
                label: skill,
              }))}
            />

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {hasActiveFilters && (
                <Button icon={<ClearOutlined />} onClick={onReset}>
                  重置
                </Button>
              )}
              <Radio.Group
                value={viewMode}
                onChange={(e) => onViewModeChange(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="table">
                  <TableOutlined />
                </Radio.Button>
                <Radio.Button value="card">
                  <AppstoreOutlined />
                </Radio.Button>
              </Radio.Group>
            </div>
          </>
        )}
      </div>

      {/* 移动端：展开的更多筛选项 */}
      {isMobile && showMoreFilters && (
        <div style={{ 
          marginTop: 12, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12 
        }}>
          <Select
            mode="multiple"
            placeholder="筛选状态"
            value={selectedStatuses}
            onChange={onStatusSelect}
            allowClear
            style={{ width: '100%' }}
            maxTagCount={1}
            options={statusOptions.map(([value, label]) => ({
              value,
              label,
            }))}
          />

          <Select
            mode="multiple"
            placeholder="筛选技能标签"
            value={selectedSkills}
            onChange={onSkillSelect}
            allowClear
            style={{ width: '100%' }}
            maxTagCount={2}
            options={allSkills.map((skill) => ({
              value: skill,
              label: skill,
            }))}
          />

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: 8 
          }}>
            {hasActiveFilters && (
              <Button icon={<ClearOutlined />} onClick={onReset}>
                重置
              </Button>
            )}
            <Radio.Group
              value={viewMode}
              onChange={(e) => onViewModeChange(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              style={{ marginLeft: 'auto' }}
            >
              <Radio.Button value="table">
                <TableOutlined />
              </Radio.Button>
              <Radio.Button value="card">
                <AppstoreOutlined />
              </Radio.Button>
            </Radio.Group>
          </div>
        </div>
      )}

      {/* 已选中的筛选项标签 */}
      {(selectedSkills.length > 0 || selectedStatuses.length > 0) && (
        <div style={{ marginTop: isMobile ? (showMoreFilters ? 12 : 8) : 12 }}>
          <Space size={[6, 6]} wrap>
            {selectedStatuses.map((status) => (
              <Tag
                key={status}
                closable
                onClose={() =>
                  onStatusSelect(
                    selectedStatuses.filter((s) => s !== status),
                  )
                }
              >
                状态: {({ pending: '待筛选', screened: '初筛通过', interviewing: '面试中', hired: '已录用', rejected: '已淘汰' } as Record<CandidateStatus, string>)[status]}
              </Tag>
            ))}
            {selectedSkills.map((skill) => (
              <Tag
                key={skill}
                color="blue"
                closable
                onClose={() =>
                  onSkillSelect(selectedSkills.filter((s) => s !== skill))
                }
              >
                技能: {skill}
              </Tag>
            ))}
          </Space>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
