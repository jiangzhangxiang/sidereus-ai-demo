/**
 * @fileoverview 状态管理卡片组件
 * @description 提供候选人状态的可视化管理和变更功能，包括 Steps 进度条展示、
 *              当前状态高亮、可执行的操作按钮以及状态变更历史记录（Timeline 形式）。
 *              支持添加变更原因备注，状态流转遵循预定义的业务规则。
 * @module pages/Candidates/Detail/StatusManagement
 * @version 1.0.0
 */
import React, { useState } from 'react';
import {
  Card,
  Button,
  Tag,
  Modal,
  Input,
  Timeline,
  Steps,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type {
  CandidateStatus,
  StatusHistoryRecord,
} from '@demo/shared';

/** 状态管理卡片 Props 接口 */
interface StatusManagementProps {
  currentStatus: CandidateStatus;
  candidateId: string;
  statusHistory: StatusHistoryRecord[];
  onStatusChange: (
    id: string,
    newStatus: CandidateStatus,
    reason?: string,
  ) => void;
}

/** 候选人状态中文标签映射 */
const statusLabels: Record<CandidateStatus, string> = {
  pending: '待筛选',
  screened: '初筛通过',
  interviewing: '面试中',
  hired: '已录用',
  rejected: '已淘汰',
};

/** 候选人状态颜色映射 */
const statusColors: Record<CandidateStatus, string> = {
  pending: 'default',
  screened: 'processing',
  interviewing: 'warning',
  hired: 'success',
  rejected: 'error',
};

/** 候选人状态图标映射 */
const statusIcons: Record<CandidateStatus, React.ReactNode> = {
  pending: <ClockCircleOutlined />,
  screened: <CheckCircleOutlined />,
  interviewing: <ExclamationCircleOutlined />,
  hired: <TrophyOutlined />,
  rejected: <CloseCircleOutlined />,
};

/** 状态流转顺序（用于 Steps 进度条） */
const statusOrder: CandidateStatus[] = [
  'pending',
  'screened',
  'interviewing',
];

/** 状态选项接口定义 */
interface StatusOption {
  key: CandidateStatus;
  label: string;
  color: string;
  icon: React.ReactNode;
}

/** 状态流转规则映射表：定义每个状态可流转到的下一状态 */
const nextStatusMap: Record<CandidateStatus, StatusOption[]> = {
  pending: [
    {
      key: 'screened',
      label: '初筛通过',
      color: 'processing',
      icon: <CheckCircleOutlined />,
    },
    {
      key: 'rejected',
      label: '淘汰',
      color: 'error',
      icon: <CloseCircleOutlined />,
    },
  ],
  screened: [
    {
      key: 'interviewing',
      label: '进入面试',
      color: 'warning',
      icon: <ExclamationCircleOutlined />,
    },
    {
      key: 'rejected',
      label: '淘汰',
      color: 'error',
      icon: <CloseCircleOutlined />,
    },
  ],
  interviewing: [
    {
      key: 'hired',
      label: '录用',
      color: 'success',
      icon: <TrophyOutlined />,
    },
    {
      key: 'rejected',
      label: '淘汰',
      color: 'error',
      icon: <CloseCircleOutlined />,
    },
  ],
  hired: [],
  rejected: [
    {
      key: 'pending',
      label: '重新筛选',
      color: 'default',
      icon: <ClockCircleOutlined />,
    },
  ],
};

/** Steps 组件状态类型 */
type StepStatusType = 'wait' | 'process' | 'finish' | 'error';

/** 状态管理卡片组件 */
const StatusManagement: React.FC<StatusManagementProps> = ({
  currentStatus,
  candidateId,
  statusHistory,
  onStatusChange,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<CandidateStatus | null>(null);
  const [reason, setReason] = useState('');

  const currentIndex = statusOrder.indexOf(currentStatus);
  const stepItems: Array<{
    title: string;
    status: StepStatusType;
    icon: React.ReactNode;
  }> = statusOrder.map((status) => ({
    title: statusLabels[status],
    status:
      statusOrder.indexOf(status) <= currentIndex
        ? currentStatus === status
          ? ('process' as StepStatusType)
          : ('finish' as StepStatusType)
        : ('wait' as StepStatusType),
    icon: statusIcons[status],
  }));

  if (currentStatus === 'hired') {
    stepItems.push({
      title: statusLabels.hired,
      status: 'finish',
      icon: statusIcons.hired,
    });
  }
  if (currentStatus === 'rejected' && !statusOrder.includes(currentStatus)) {
    stepItems.push({
      title: statusLabels.rejected,
      status: 'error',
      icon: statusIcons.rejected,
    });
  }

  const handleStatusClick = (newStatus: CandidateStatus) => {
    setSelectedStatus(newStatus);
    setReason('');
    setModalVisible(true);
  };

  const handleConfirm = () => {
    if (selectedStatus) {
      onStatusChange(candidateId, selectedStatus, reason || undefined);
      message.success(`状态已更新为：${statusLabels[selectedStatus]}`);
    }
    setModalVisible(false);
    setSelectedStatus(null);
    setReason('');
  };

  const nextOptions = nextStatusMap[currentStatus] || [];

  return (
    <Card
      title={
        <span>
          <ExclamationCircleOutlined style={{ marginRight: 8 }} />
          状态管理
        </span>
      }
      style={{ borderRadius: 12 }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <div style={{ marginBottom: 20 }}>
        <Steps
          current={currentIndex}
          items={stepItems}
          size="small"
          style={{ marginBottom: 16 }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            padding: '14px 18px',
            background: '#fafafa',
            borderRadius: 8,
          }}
        >
          <span style={{ fontWeight: 500 }}>当前状态：</span>
          <Tag
            color={statusColors[currentStatus]}
            style={{
              fontSize: 14,
              padding: '2px 12px',
              transition: 'all 0.3s ease',
              animation: 'statusPulse 2s ease-in-out infinite',
            }}
          >
            {statusIcons[currentStatus]} {statusLabels[currentStatus]}
          </Tag>

          {nextOptions.length > 0 && (
            <>
              <span style={{ margin: '0 4px', color: '#ccc' }}>→</span>
              <span style={{ color: '#999' }}>可操作：</span>
              {nextOptions.map((option) => (
                <Button
                  key={option.key}
                  type={
                    option.color === 'success'
                      ? 'primary'
                      : option.color === 'error'
                        ? 'default'
                        : 'default'
                  }
                  danger={option.color === 'error'}
                  size="small"
                  onClick={() => handleStatusClick(option.key)}
                  style={{ transition: 'transform 0.2s' }}
                >
                  {option.icon} {option.label}
                </Button>
              ))}
            </>
          )}
        </div>
      </div>

      {statusHistory.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontWeight: 600,
              marginBottom: 12,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            状态变更记录
          </div>
          <Timeline
            items={statusHistory
              .filter((r) => r.candidateId === candidateId)
              .slice()
              .reverse()
              .map((record) => ({
                color:
                  record.toStatus === 'hired'
                    ? 'green'
                    : record.toStatus === 'rejected'
                      ? 'red'
                      : 'blue',
                children: (
                  <div key={record.id}>
                    <div style={{ fontWeight: 500 }}>
                      {record.fromStatus
                        ? `${statusLabels[record.fromStatus]} → `
                        : ''}
                      <Tag color={statusColors[record.toStatus]}>
                        {statusLabels[record.toStatus]}
                      </Tag>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#999',
                        marginTop: 2,
                      }}
                    >
                      {new Date(record.changedAt).toLocaleString('zh-CN')} ·{' '}
                      {record.changedBy}
                    </div>
                    {record.reason && (
                      <div
                        style={{
                          fontSize: 13,
                          color: '#666',
                          marginTop: 4,
                          padding: '4px 10px',
                          background: '#f9f9f9',
                          borderRadius: 4,
                        }}
                      >
                        备注：{record.reason}
                      </div>
                    )}
                  </div>
                ),
              }))}
          />
        </div>
      )}

      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>

      <Modal
        title="确认状态变更"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleConfirm}
        okText="确认变更"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          将候选人状态从{' '}
          <Tag color={statusColors[currentStatus]}>
            {statusLabels[currentStatus]}
          </Tag>{' '}
          变更为{' '}
          <Tag color={statusColors[selectedStatus || 'pending']}>
            {selectedStatus ? statusLabels[selectedStatus] : ''}
          </Tag>
        </div>
        <Input.TextArea
          placeholder="请输入变更原因（可选）..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={200}
          showCount
        />
      </Modal>
    </Card>
  );
};

export default StatusManagement;
