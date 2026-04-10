import React, { useState, useEffect } from 'react';
import {
  Modal,
  Select,
  Tag,
  Form,
  message,
  Space,
  Alert,
} from 'antd';
import type { Candidate, CandidateStatus } from '@demo/shared';
import {
  CandidateStatusLabels,
  CandidateStatusColors,
} from '@demo/shared';
import { updateCandidateStatus } from '../../api/candidates';

interface StatusChangeModalProps {
  open: boolean;
  candidate: Candidate | null;
  onClose: () => void;
  onSuccess: () => void;
}

const allStatusOptions = (Object.entries(CandidateStatusLabels) as [CandidateStatus, string][]).map(
  ([value, label]) => ({
    value,
    label: (
      <Space>
        <Tag color={CandidateStatusColors[value]} style={{ margin: 0 }}>
          {label}
        </Tag>
      </Space>
    ),
  }),
);

const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  open,
  candidate,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [selectedStatus, setSelectedStatus] = useState<CandidateStatus | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (open && candidate) {
      form.resetFields();
      setSelectedStatus(null);
    }
  }, [open, candidate, form]);

  const handleStatusSelect = (value: CandidateStatus) => {
    setSelectedStatus(value);
    form.setFieldsValue({ status: value });
  };

  const handleOk = async () => {
    if (!candidate || !selectedStatus) return;

    try {
      await form.validateFields();
    } catch {
      return;
    }

    if (selectedStatus === candidate.status) {
      message.warning('请选择与当前状态不同的目标状态');
      return;
    }

    setConfirmLoading(true);
    try {
      await updateCandidateStatus(candidate.id, selectedStatus);
      message.success(
        `「${candidate.basicInfo.name}」的状态已更新为：${CandidateStatusLabels[selectedStatus]}`,
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      message.error(error.message || '状态更新失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <Modal
      title={`修改候选人状态 - ${candidate?.basicInfo.name || ''}`}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="确认变更"
      cancelText="取消"
      confirmLoading={confirmLoading}
      width={520}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ status: undefined }}
        style={{ marginTop: 16 }}
      >
        {candidate && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
            message={
              <span>
                当前状态：
                <Tag color={CandidateStatusColors[candidate.status]}>
                  {CandidateStatusLabels[candidate.status]}
                </Tag>
              </span>
            }
          />
        )}

        <Form.Item
          name="status"
          label="选择目标状态"
          rules={[{ required: true, message: '请选择目标状态' }]}
        >
          <Select
            placeholder="请选择要变更的目标状态"
            options={allStatusOptions}
            onChange={handleStatusSelect}
            size="large"
            value={selectedStatus}
            popupMatchSelectWidth={false}
          />
        </Form.Item>

        {selectedStatus && selectedStatus !== candidate?.status && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ color: '#666' }}>预览：</span>
            <Tag color={CandidateStatusColors[candidate?.status]}>
              {candidate ? CandidateStatusLabels[candidate.status] : ''}
            </Tag>
            <span style={{ color: '#999', fontWeight: 600 }}>→</span>
            <Tag color={CandidateStatusColors[selectedStatus]}>
              {CandidateStatusLabels[selectedStatus]}
            </Tag>
          </div>
        )}

        {selectedStatus === candidate?.status && (
          <div
            style={{
              marginBottom: 16,
              padding: '8px 12px',
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: 6,
              fontSize: 13,
              color: '#d48806',
            }}
          >
            请选择与当前状态不同的目标状态
          </div>
        )}

      </Form>
    </Modal>
  );
};

export default StatusChangeModal;
