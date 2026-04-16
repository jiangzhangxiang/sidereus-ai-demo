/**
 * @fileoverview 匹配结果展示组件（侧边栏）
 * @description 以 Drawer 侧边栏形式展示候选人-岗位匹配分析结果，包含：
 *              - 环形进度条显示综合匹配度（0-100分）
 *              - 柱状图展示三个维度评分对比
 *              - 卡片式布局展示AI自然语言评语，支持文本复制
 *              支持加载状态、关闭操作和切换不同候选人的结果。
 *              支持移动端响应式：移动端从底部滑出全屏显示，PC端右侧固定宽度抽屉。
 * @module components/MatchResultDrawer
 * @version 1.1.0
 */
import React, { useState } from 'react';
import {
  Drawer,
  Progress,
  Card,
  Button,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import {
  CloseOutlined,
  CopyOutlined,
  CheckOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { MatchResult, Candidate, Job } from '@demo/shared';
import useIsMobile from '../hooks/useIsMobile';

const { Paragraph, Text, Title } = Typography;

interface MatchResultDrawerProps {
  open: boolean;
  result: MatchResult | null;
  loading: boolean;
  candidate: Candidate | null;
  job: Job | null;
  onClose: () => void;
}

const dimensionLabels: Record<keyof MatchResult['dimensions'], string> = {
  skill_match: '技能匹配度',
  experience_relevance: '经验相关性',
  education_fit: '教育背景契合度',
};

const dimensionColors: Record<keyof MatchResult['dimensions'], string> = {
  skill_match: '#1677ff',
  experience_relevance: '#52c41a',
  education_fit: '#faad14',
};

function getScoreColor(score: number): string {
  if (score >= 80) return '#52c41a';
  if (score >= 60) return '#1677ff';
  if (score >= 40) return '#faad14';
  return '#ff4d4f';
}

function getScoreLevel(score: number): string {
  if (score >= 90) return '高度匹配';
  if (score >= 75) return '较好匹配';
  if (score >= 60) return '基本匹配';
  if (score >= 40) return '匹配度较低';
  return '匹配度低';
}

const MatchResultDrawer: React.FC<MatchResultDrawerProps> = ({
  open,
  result,
  loading,
  candidate,
  job,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const { isMobile } = useIsMobile();

  const handleCopyComment = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.comment).then(() => {
      setCopied(true);
      message.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>匹配分析结果</span>
          {loading && <LoadingOutlined spin style={{ color: '#1677ff' }} />}
        </div>
      }
      placement={isMobile ? 'bottom' : 'right'}
      width={isMobile ? '100%' : 520}
      height={isMobile ? '80%' : undefined}
      open={open}
      onClose={onClose}
      closeIcon={<CloseOutlined />}
    >
      {loading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '60px 0' : '80px 0',
          }}
        >
          <Spin size="large" />
          <p style={{ marginTop: 16, color: '#999', fontSize: isMobile ? 14 : undefined }}>正在执行智能匹配分析...</p>
        </div>
      ) : result ? (
        <Space direction="vertical" size={isMobile ? 'middle' : 'large'} style={{ width: '100%' }}>
          {/* 岗位与候选人信息 */}
          {job && (
            <Card size="small" title="岗位信息">
              <Text strong>{job.title}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                必备技能：{(job.required_skills || []).join('、') || '无'}
              </Text>
            </Card>
          )}

          {candidate && (
            <Card size="small" title="候选人信息">
              <Text strong>{candidate.basicInfo.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                技能标签：{(candidate.skills || []).join('、') || '无'}
              </Text>
            </Card>
          )}

          {/* 综合匹配度 - 环形进度条 */}
          <Card size="small">
            <Title level={5}>综合匹配度</Title>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                padding: isMobile ? '16px 0' : '20px 0',
              }}
            >
              <Progress
                type="circle"
                percent={result.overall_score}
                strokeColor={getScoreColor(result.overall_score)}
                size={isMobile ? 120 : 160}
                format={(percent) => (
                  <span style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700 }}>
                    {percent}
                  </span>
                )}
              />
              <Text
                strong
                style={{
                  fontSize: isMobile ? 14 : 16,
                  color: getScoreColor(result.overall_score),
                  marginTop: isMobile ? 8 : 12,
                }}
              >
                {getScoreLevel(result.overall_score)}
              </Text>
            </div>
          </Card>

          {/* 维度评分 - 柱状图 */}
          <Card size="small" title="维度评分详情">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {(Object.entries(result.dimensions) as [keyof MatchResult['dimensions'], number][]).map(
                ([key, value]) => (
                  <div key={String(key)}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <Text>{dimensionLabels[key]}</Text>
                      <Text strong style={{ color: dimensionColors[key] }}>
                        {value}分
                      </Text>
                    </div>
                    <Progress
                      percent={value}
                      strokeColor={dimensionColors[key]}
                      showInfo={false}
                      size="small"
                    />
                  </div>
                ),
              )}
            </Space>
          </Card>

          {/* AI 评语 */}
          <Card
            size="small"
            title={
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <span>AI 分析评语</span>
                <Button
                  type="text"
                  size="small"
                  icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                  onClick={handleCopyComment}
                >
                  {copied ? '已复制' : '复制'}
                </Button>
              </div>
            }
          >
            <Paragraph
              style={{
                whiteSpace: 'pre-line',
                lineHeight: 1.8,
                maxHeight: isMobile ? 200 : 300,
                overflowY: 'auto',
                margin: 0,
                fontSize: isMobile ? 14 : undefined,
              }}
            >
              {result.comment}
            </Paragraph>
          </Card>
        </Space>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 0',
            color: '#999',
          }}
        >
          暂无匹配数据
        </div>
      )}
    </Drawer>
  );
};

export default MatchResultDrawer;
