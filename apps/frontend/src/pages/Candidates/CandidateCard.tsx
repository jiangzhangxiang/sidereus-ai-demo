/**
 * @fileoverview 候选人卡片组件
 * @description 以卡片形式展示候选人核心信息，包括姓名、城市、联系方式、评分（带颜色编码）、
 *              状态标签、技能列表和最近一段工作经历。点击卡片可跳转到详情页。
 * @module pages/Candidates/CandidateCard
 * @version 1.0.0
 */
import React from 'react';
import { Card, Tag, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  EyeOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  StarFilled,
} from '@ant-design/icons';
import type {
  Candidate,
  CandidateStatus,
} from '@demo/shared';
import {
  CandidateStatusLabels,
  CandidateStatusColors,
} from '@demo/shared';

/** 候选人卡片 Props 接口 */
interface CandidateCardProps {
  candidate: Candidate;
}

const statusLabels = CandidateStatusLabels;
const statusColors = CandidateStatusColors;

/** 根据评分值返回对应颜色 */
const getScoreColor = (score: number): string => {
  if (score >= 90) return '#52c41a';
  if (score >= 80) return '#1677ff';
  if (score >= 70) return '#faad14';
  return '#ff4d4f';
};

/** 候选人卡片组件 */
const CandidateCard: React.FC<CandidateCardProps> = ({ candidate }) => {
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      style={{
        height: '100%',
        borderRadius: 12,
        transition: 'all 0.3s ease',
        borderLeft: `4px solid ${getScoreColor(candidate.score)}`,
      }}
      bodyStyle={{ padding: '20px' }}
      onClick={() => navigate(`/candidates/${candidate.id}`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            {candidate.basicInfo.name}
          </h3>
          <div style={{ color: '#999', fontSize: 13, marginTop: 4 }}>
            <EnvironmentOutlined style={{ marginRight: 4 }} />
            {candidate.basicInfo.city}
            <span style={{ margin: '0 8px' }}>|</span>
            <PhoneOutlined style={{ marginRight: 4 }} />
            {candidate.basicInfo.phone}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: getScoreColor(candidate.score),
              lineHeight: 1,
            }}
          >
            {candidate.score}
          </div>
          <StarFilled style={{ color: '#faad14', fontSize: 14 }} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <Tag color={statusColors[candidate.status]} style={{ marginBottom: 8 }}>
          {statusLabels[candidate.status]}
        </Tag>
      </div>

      <div
        style={{
          marginTop: 8,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        {candidate.skills.map((skill) => (
          <Tag key={skill} color="blue" style={{ marginBottom: 2 }}>
            {skill}
          </Tag>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        {candidate.workExperience.slice(0, 1).map((work, idx) => (
          <div key={idx} style={{ fontSize: 13, color: '#666' }}>
            <strong>{work.company}</strong> · {work.position}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 12, color: '#999' }}>
          {new Date(candidate.uploadedAt).toLocaleDateString('zh-CN')}
        </span>
        <a style={{ color: '#1677ff' }}>
          <EyeOutlined /> 查看详情
        </a>
      </div>

      <div style={{ marginTop: 8 }}>
        <Progress
          percent={(candidate.score / 100) * 100}
          strokeColor={getScoreColor(candidate.score)}
          showInfo={false}
          size="small"
        />
      </div>
    </Card>
  );
};

export default CandidateCard;
