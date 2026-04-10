/**
 * @fileoverview 基本信息卡片组件
 * @description 展示候选人核心信息，包括头像（姓名首字母）、姓名、状态标签和联系方式（电话、邮箱、城市）。
 *              使用 Ant Design Descriptions 组件布局，状态标签根据状态值动态着色。
 * @module pages/Candidates/Detail/BasicInfoCard
 * @version 1.0.0
 */
import React from 'react';
import { Descriptions, Tag } from 'antd';
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import type { CandidateBasicInfo } from '@demo/shared';

/** 基本信息卡片 Props 接口 */
interface BasicInfoCardProps {
  info: CandidateBasicInfo;
  status: string;
  statusLabel: string;
  statusColor: string;
}

/** 基本信息卡片组件 */
const BasicInfoCard: React.FC<BasicInfoCardProps> = ({
  info,
  statusLabel,
  statusColor,
}) => {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '24px 28px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          {info.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            {info.name}
          </h2>
          <div style={{ marginTop: 6, color: '#666', fontSize: 14 }}>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 12px',
                borderRadius: 12,
                background:
                  statusColor === 'success'
                    ? '#f6ffed'
                    : statusColor === 'error'
                      ? '#fff2f0'
                      : statusColor === 'warning'
                        ? '#fffbe6'
                        : statusColor === 'processing'
                          ? '#e6f4ff'
                          : '#f5f5f5',
                color:
                  statusColor === 'success'
                    ? '#52c41a'
                    : statusColor === 'error'
                      ? '#ff4d4f'
                      : statusColor === 'warning'
                        ? '#faad14'
                        : statusColor === 'processing'
                          ? '#1677ff'
                          : '#666',
                fontWeight: 500,
                fontSize: 13,
              }}
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <Descriptions
        column={2}
        size="middle"
        style={{ marginTop: 20 }}
        labelStyle={{ color: '#999', width: 80 }}
      >
        <Descriptions.Item label={<><PhoneOutlined /> 电话</>}>
          {info.phone}
        </Descriptions.Item>
        <Descriptions.Item label={<><MailOutlined /> 邮箱</>}>
          {info.email}
        </Descriptions.Item>
        <Descriptions.Item label={<><EnvironmentOutlined /> 所在城市</>}>
          {info.city}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
};

export default BasicInfoCard;
