/**
 * @fileoverview 候选人详情页
 * @description 展示候选人完整信息，包括基本信息卡片、工作经历卡片、教育经历卡片、
 *              技能标签展示、PDF 简历预览和评分明细（固定在右侧）。
 *              支持从本地 Store 或 API 加载数据，提供返回列表导航。
 * @module pages/Candidates/Detail/CandidateDetail
 * @version 1.0.0
 */
import React, { useState, useEffect } from 'react';
import { Row, Col, Tag, Button, Space, Typography, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { useCandidateStore } from '../../../store/candidateStore';
import { fetchCandidateById } from '../../../api/candidates';
import BasicInfoCard from './BasicInfoCard';
import ScoreBreakdownCard from './ScoreBreakdownCard';
import EducationCard from './EducationCard';
import WorkExperienceCard from './WorkExperienceCard';

import type { Candidate } from '@demo/shared';

const { Title, Paragraph } = Typography;

/** 候选人详情页组件 */
const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { candidates } = useCandidateStore();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCandidateDetail = async () => {
      if (!id) return;

      // 首先从本地 store 中查找
      const localCandidate = candidates.find((c) => c.id === id);
      if (localCandidate) {
        setCandidate(localCandidate);
        setLoading(false);
        return;
      }

      // 本地没有则从 API 获取
      try {
        setLoading(true);
        setError(null);
        const candidateData = await fetchCandidateById(id);
        setCandidate(candidateData);
      } catch (err) {
        setError('获取候选人详情失败');
        console.error('获取候选人详情失败:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCandidateDetail();
  }, [id, candidates]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
        <Title level={4} style={{ marginTop: 20 }}>加载中...</Title>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Title level={3}>{error || '未找到该候选人'}</Title>
        <Paragraph color="secondary">请检查链接是否正确</Paragraph>
        <Button type="primary" onClick={() => navigate('/candidates')}>
          返回列表
        </Button>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    pending: '待筛选',
    screened: '初筛通过',
    interviewing: '面试中',
    hired: '已录用',
    rejected: '已淘汰',
  };

  const statusColors: Record<string, string> = {
    pending: 'default',
    screened: 'processing',
    interviewing: 'warning',
    hired: 'success',
    rejected: 'error',
  };

  return (
    <div style={{ padding: '0 0 24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/candidates')}
          >
            返回列表
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            候选人详情
          </Title>
        </Space>
      </div>

      <Row gutter={[16, 20]}>
        <Col xs={24} lg={16}>
          <BasicInfoCard
            info={candidate.basicInfo}
            status={candidate.status}
            statusLabel={statusLabels[candidate.status]}
            statusColor={statusColors[candidate.status]}
          />

          <div style={{ marginTop: 20 }} />

          <WorkExperienceCard workExperience={candidate.workExperience} />

          <div style={{ marginTop: 20 }} />

          <EducationCard education={candidate.education} />

          <div style={{ marginTop: 20 }} />

          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '20px 24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 15 }}>
              <TagsOutlined style={{ marginRight: 8, color: '#1677ff' }} />
              技能标签
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {candidate.skills.map((skill: string) => (
                <Tag
                  key={skill}
                  color="blue"
                  style={{
                    padding: '4px 14px',
                    borderRadius: 14,
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  {skill}
                </Tag>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 20 }} />

        </Col>

        <Col xs={24} lg={8}>
          <div style={{ position: 'sticky', top: 20 }}>
            <ScoreBreakdownCard
              score={candidate.score}
              breakdown={candidate.scoreBreakdown}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default CandidateDetail;
