/**
 * @fileoverview 候选人表格组件
 * @description 以 Ant Design Table 形式展示候选人列表，包含姓名、联系方式、技能标签、评分、
 *              状态、上传时间和操作列。支持排序、行点击跳转和状态流转操作。
 * @module pages/Candidates/CandidateTable
 * @version 2.0.0
 */
import React from 'react';
import { Tag, Button, Modal, message, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import type {
  Candidate,
  CandidateStatus,
} from '@demo/shared';
import {
  CandidateStatusLabels,
  CandidateStatusColors,
} from '@demo/shared';
import { updateCandidateStatus } from '../../api/candidates';

/** 候选人表格 Props 接口 */
interface CandidateTableProps {
  candidates: Candidate[];
  onRefresh?: () => void;
}

const statusLabels = CandidateStatusLabels;
const statusColors = CandidateStatusColors;

/** 状态流转规则：定义每个状态的下一个可执行状态 */
const statusFlowMap: Record<CandidateStatus, CandidateStatus | null> = {
  pending: 'screened',
  screened: 'interviewing',
  interviewing: 'hired',
  hired: null,
  rejected: 'pending',
};

/** 候选人表格组件 */
const CandidateTable: React.FC<CandidateTableProps> = ({ candidates, onRefresh }) => {
  const navigate = useNavigate();

  const handleStatusChange = async (record: Candidate, newStatus: CandidateStatus) => {
    Modal.confirm({
      title: '确认状态变更',
      content: `确定要将「${record.basicInfo.name}」的状态从「${statusLabels[record.status]}」变更为「${statusLabels[newStatus]}」吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await updateCandidateStatus(record.id, newStatus);
          message.success(`状态已更新为：${statusLabels[newStatus]}`);
          if (onRefresh) {
            onRefresh();
          }
        } catch (error: any) {
          message.error(error.message || '状态更新失败');
        }
      },
    });
  };

  const columns: ColumnsType<Candidate> = [
    {
      title: '候选人',
      dataIndex: ['basicInfo', 'name'],
      key: 'name',
      width: 120,
      render: (name: string, record) => (
        <div>
          <div
            style={{ fontWeight: 600, cursor: 'pointer', color: '#1677ff' }}
            onClick={() => navigate(`/candidates/${record.id}`)}
          >
            {name}
          </div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
            <EnvironmentOutlined style={{ marginRight: 4 }} />
            {record.basicInfo.city}
          </div>
        </div>
      ),
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 200,
      render: (_, record) => (
        <div style={{ fontSize: 13 }}>
          <div>
            <PhoneOutlined style={{ marginRight: 6, color: '#999' }} />
            {record.basicInfo.phone}
          </div>
          <div style={{ marginTop: 4 }}>
            <MailOutlined style={{ marginRight: 6, color: '#999' }} />
            {record.basicInfo.email}
          </div>
        </div>
      ),
    },
    {
      title: '技能标签',
      dataIndex: 'skills',
      key: 'skills',
      width: 280,
      render: (skills: string[]) => (
        <span>
          {skills.slice(0, 3).map((skill) => (
            <Tag key={skill} color="blue" style={{ marginBottom: 4 }}>
              {skill}
            </Tag>
          ))}
          {skills.length > 3 && (
            <Tag>+{skills.length - 3}</Tag>
          )}
        </span>
      ),
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score: number) => (
        <span
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: score >= 90 ? '#52c41a' : score >= 80 ? '#1677ff' : '#faad14',
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
      filters: [
        { text: '待筛选', value: 'pending' },
        { text: '初筛通过', value: 'screened' },
        { text: '面试中', value: 'interviewing' },
        { text: '已录用', value: 'hired' },
        { text: '已淘汰', value: 'rejected' },
      ],
      render: (status: CandidateStatus) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 160,
      render: (date: string) =>
        new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const nextStatus = statusFlowMap[record.status];
        return (
          <Space size="small">
            <a
              onClick={() => navigate(`/candidates/${record.id}`)}
              style={{ color: '#1677ff' }}
            >
              详情
            </a>
            {nextStatus && (
              <Button
                type="link"
                size="small"
                onClick={() => handleStatusChange(record, nextStatus)}
                style={{
                  color: statusColors[nextStatus] === 'success' ? '#52c41a' : 
                         statusColors[nextStatus] === 'processing' ? '#1677ff' :
                         statusColors[nextStatus] === 'warning' ? '#faad14' : '#999',
                  paddingLeft: 0,
                }}
              >
                {statusLabels[nextStatus]}
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      dataSource={candidates}
      columns={columns}
      rowKey="id"
      pagination={false}
    />
  );
};

export default CandidateTable;
