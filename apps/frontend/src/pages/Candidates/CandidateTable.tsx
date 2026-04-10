/**
 * @fileoverview 候选人表格组件
 * @description 以 Ant Design Table 形式展示候选人列表，包含姓名、联系方式、技能标签、评分、
 *              状态、上传时间和操作列。支持排序和行点击跳转。
 * @module pages/Candidates/CandidateTable
 * @version 1.0.0
 */
import React from 'react';
import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import {
  EyeOutlined,
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

/** 候选人表格 Props 接口 */
interface CandidateTableProps {
  candidates: Candidate[];
}

const statusLabels = CandidateStatusLabels;
const statusColors = CandidateStatusColors;

/** 候选人表格组件 */
const CandidateTable: React.FC<CandidateTableProps> = ({ candidates }) => {
  const navigate = useNavigate();

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
      sorter: true,
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
      onFilter: () => true,
      render: (status: CandidateStatus) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 160,
      sorter: true,
      render: (date: string) =>
        new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <a
          onClick={() => navigate(`/candidates/${record.id}`)}
          style={{ color: '#1677ff' }}
        >
          <EyeOutlined /> 详情
        </a>
      ),
    },
  ];

  return null;
};

export default CandidateTable;
