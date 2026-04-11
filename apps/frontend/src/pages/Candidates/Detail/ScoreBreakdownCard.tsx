/**
 * @fileoverview 评分明细卡片组件
 * @description 展示候选人综合评分及五个维度的详细评分（技术能力、项目经验、教育背景、
 *              沟通表达、发展潜力），每个维度使用 Progress 进度条可视化展示。
 *              顶部显示综合评分圆形徽章和评级文字（卓越/优秀/良好/合格/待提升）。
 * @module pages/Candidates/Detail/ScoreBreakdownCard
 * @version 1.0.0
 */
import React from 'react';
import { Progress, Card, Typography } from 'antd';
import type { ScoreBreakdown } from '@demo/shared';

const { Text } = Typography;

/** 评分明细卡片 Props 接口 */
interface ScoreBreakdownCardProps {
  score: number;
  breakdown: ScoreBreakdown;
}

/** 评分维度配置项 */
const scoreItems: { key: keyof ScoreBreakdown; label: string; description: string }[] = [
  {
    key: 'technicalSkills',
    label: '技术能力',
    description: '编程语言、框架使用、系统设计等技术水平评估',
  },
  {
    key: 'experience',
    label: '项目经验',
    description: '工作年限、项目复杂度、业务领域经验等',
  },
  {
    key: 'education',
    label: '教育背景',
    description: '学历层次、毕业院校、专业匹配度等',
  },
  {
    key: 'communication',
    label: '沟通表达',
    description: '团队协作、文档撰写、口头表达能力等',
  },
  {
    key: 'potential',
    label: '发展潜力',
    description: '学习能力、成长空间、职业规划清晰度等',
  },
];

/** 根据评分返回评级文字 */
const getScoreLevel = (score: number): string => {
  if (score >= 95) return '卓越';
  if (score >= 90) return '优秀';
  if (score >= 80) return '良好';
  if (score >= 70) return '合格';
  return '待提升';
};

/** 根据评分返回对应颜色 */
const getScoreColor = (score: number): string => {
  if (score >= 90) return '#52c41a';
  if (score >= 80) return '#1677ff';
  if (score >= 70) return '#faad14';
  return '#ff4d4f';
};

/** 评分明细卡片组件 */
const ScoreBreakdownCard: React.FC<ScoreBreakdownCardProps> = ({
  score,
  breakdown,
}) => {
  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>评分详情</span>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background:
                score >= 90
                  ? '#f6ffed'
                  : score >= 80
                    ? '#e6f4ff'
                    : score >= 70
                      ? '#fffbe6'
                      : '#fff2f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 800,
              color: getScoreColor(score),
            }}
          >
            {score}
          </div>
        </div>
      }
      style={{ borderRadius: 12 }}
      styles={{ body: { padding: '16px 24px' } }}
    >
      <div style={{ marginBottom: 8, color: '#999', fontSize: 13 }}>
        综合评级：<Text strong style={{ color: getScoreColor(score) }}>
          {getScoreLevel(score)}
        </Text>
      </div>

      {scoreItems.map((item) => (
        <div key={String(item.key)} style={{ marginBottom: 18 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <span style={{ fontWeight: 500 }}>{item.label}</span>
            <span style={{ fontWeight: 700, color: getScoreColor(breakdown[item.key]) }}>
              {breakdown[item.key]}
            </span>
          </div>
          <Progress
            percent={breakdown[item.key]}
            strokeColor={getScoreColor(breakdown[item.key])}
            trailColor="#f5f5f5"
            showInfo={false}
            size="small"
          />
          <div style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>
            {item.description}
          </div>
        </div>
      ))}
    </Card>
  );
};

export default ScoreBreakdownCard;
