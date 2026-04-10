/**
 * @fileoverview 工作经历卡片组件
 * @description 以时间线形式展示候选人的工作经历列表，每条记录包含公司、职位、时间段和工作描述。
 *              支持多段工作经历展示，顶部显示总段数统计。
 * @module pages/Candidates/Detail/WorkExperienceCard
 * @version 1.0.0
 */
import React from 'react';
import { Card, Tag } from 'antd';
import {
  CarryOutOutlined,
  CalendarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { WorkExperience } from '@demo/shared';

/** 工作经历卡片 Props 接口 */
interface WorkExperienceCardProps {
  workExperience: WorkExperience[];
}

/** 工作经历卡片组件 */
const WorkExperienceCard: React.FC<WorkExperienceCardProps> = ({
  workExperience,
}) => {
  return (
    <Card
      title={
        <span>
          <CarryOutOutlined style={{ marginRight: 8, color: '#faad14' }} />
          工作经历
        </span>
      }
      style={{ borderRadius: 12 }}
      styles={{ body: { padding: '16px 24px' } }}
      extra={<Tag color="blue">共 {workExperience.length} 段</Tag>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {workExperience.map((work, index) => (
          <div
            key={index}
            style={{
              position: 'relative',
              paddingLeft: 20,
              borderLeft:
                index < workExperience.length - 1
                  ? '2px solid #e8e8e8'
                  : '2px solid #faad14',
              paddingBottom: index < workExperience.length - 1 ? 20 : 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: -7,
                top: 4,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#faad14',
                border: '2px solid #fff',
              }}
            />
            <div style={{ marginBottom: 6 }}>
              <TeamOutlined style={{ marginRight: 6, color: '#faad14' }} />
              <strong style={{ fontSize: 15 }}>{work.company}</strong>
            </div>
            <div style={{ marginBottom: 4 }}>
              <Tag color="gold">{work.position}</Tag>
              <span style={{ color: '#999', fontSize: 13, marginLeft: 8 }}>
                <CalendarOutlined style={{ marginRight: 4 }} />
                {work.period}
              </span>
            </div>
            {work.description && (
              <div
                style={{
                  marginTop: 8,
                  padding: '10px 14px',
                  background: '#fafafa',
                  borderRadius: 8,
                  color: '#555',
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                {work.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default WorkExperienceCard;
