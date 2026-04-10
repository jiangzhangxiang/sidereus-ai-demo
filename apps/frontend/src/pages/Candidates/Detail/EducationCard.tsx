import React from 'react';
import { Card, Tag } from 'antd';
import {
  BankOutlined,
  ReadOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { Education } from '@demo/shared';

interface EducationCardProps {
  education: Education[];
}

const degreeColors: Record<string, string> = {
  '博士': 'purple',
  '硕士': 'blue',
  '本科': 'green',
  '大专': 'orange',
};

const EducationCard: React.FC<EducationCardProps> = ({ education }) => {
  return (
    <Card
      title={
        <span>
          <ReadOutlined style={{ marginRight: 8 }} />
          教育背景
        </span>
      }
      style={{ borderRadius: 12 }}
      styles={{ body: { padding: '16px 24px' } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {education.map((edu, index) => (
          <div
            key={index}
            style={{
              position: 'relative',
              paddingLeft: 20,
              borderLeft:
                index < education.length - 1
                  ? '2px solid #e8e8e8'
                  : '2px solid #1677ff',
              paddingBottom: index < education.length - 1 ? 16 : 0,
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
                background: '#1677ff',
                border: '2px solid #fff',
              }}
            />
            <div style={{ marginBottom: 6 }}>
              <BankOutlined style={{ marginRight: 6, color: '#1677ff' }} />
              <strong style={{ fontSize: 15 }}>{edu.school}</strong>
              <Tag
                color={degreeColors[edu.degree] || 'default'}
                style={{ marginLeft: 8 }}
              >
                {edu.degree}
              </Tag>
            </div>
            <div style={{ color: '#666', fontSize: 14 }}>
              {edu.major}
            </div>
            <div style={{ color: '#999', fontSize: 13, marginTop: 4 }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              毕业时间：{edu.graduationDate}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default EducationCard;
