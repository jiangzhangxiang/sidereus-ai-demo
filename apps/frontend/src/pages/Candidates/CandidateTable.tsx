 import React, { useState } from 'react';
import { Tag, Button, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type {
  Candidate,
  CandidateStatus,
} from '@demo/shared';
import {
  CandidateStatusLabels,
  CandidateStatusColors,
} from '@demo/shared';
import StatusChangeModal from './StatusChangeModal';

interface CandidateTableProps {
  candidates: Candidate[];
  onRefresh?: () => void;
}

const statusLabels = CandidateStatusLabels;
const statusColors = CandidateStatusColors;

const CandidateTable: React.FC<CandidateTableProps> = ({ candidates, onRefresh }) => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const openStatusModal = (record: Candidate) => {
    setSelectedCandidate(record);
    setModalOpen(true);
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
      render: (_, record) => (
        <Space size="small">
          <a
            onClick={() => navigate(`/candidates/${record.id}`)}
            style={{ color: '#1677ff' }}
          >
            详情
          </a>
          <Button
            type="link"
            size="small"
            onClick={() => openStatusModal(record)}
            style={{ paddingLeft: 0 }}
          >
            修改状态
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        dataSource={candidates}
        columns={columns}
        rowKey="id"
        pagination={false}
      />
      <StatusChangeModal
        open={modalOpen}
        candidate={selectedCandidate}
        onClose={() => setModalOpen(false)}
        onSuccess={() => onRefresh?.()}
      />
    </>
  );
};

export default CandidateTable;
