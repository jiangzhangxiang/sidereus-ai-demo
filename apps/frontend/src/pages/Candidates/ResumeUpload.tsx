import React from 'react';
import { Card, Button, message, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CheckCircleOutlined } from '@ant-design/icons';
import FileUpload from '../../components/FileUpload';
import { useCandidateStore } from '../../store/candidateStore';
import type { Candidate } from '@demo/shared';
import type { UploadResponse } from '../../api/upload';

const ResumeUpload: React.FC = () => {
  const navigate = useNavigate();
  const { addCandidate } = useCandidateStore();
  const [uploadSuccess, setUploadSuccess] = React.useState(false);
  const [createdCandidateId, setCreatedCandidateId] = React.useState<string>('');

  const handleFileUpload = (files: File[]) => {
    console.log('上传的文件:', files);
  };

  const handleUploadComplete = (result: UploadResponse) => {
    const totalScore =
      (Math.random() * 20 + 75) |
      0;

    const newCandidate: Candidate = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      basicInfo: { ...result.basicInfo },
      education: [...result.education],
      workExperience: [...result.workExperience],
      skills: [...result.skills],
      score: totalScore,
      scoreBreakdown: {
        technicalSkills: Math.min(100, totalScore + Math.floor(Math.random() * 10 - 5)),
        experience: Math.min(100, totalScore + Math.floor(Math.random() * 10 - 5)),
        education: Math.min(100, totalScore + Math.floor(Math.random() * 10 - 3)),
        communication: Math.min(100, totalScore + Math.floor(Math.random() * 10 - 7)),
        potential: Math.min(100, totalScore + Math.floor(Math.random() * 10 - 4)),
      },
      status: 'pending',
      resumeUrl: `/resumes/${result.basicInfo.name}.pdf`,
      uploadedAt: new Date().toISOString(),
    };

    addCandidate(newCandidate);
    setCreatedCandidateId(newCandidate.id);
    setUploadSuccess(true);
    message.success('简历已成功解析并添加到候选人列表！');
  };

  if (uploadSuccess) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto' }}>
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title="简历上传成功！"
          subTitle="简历已完成解析，候选人信息已添加到系统中"
          extra={[
            <Button
              type="primary"
              key="detail"
              onClick={() => navigate(`/candidates/${createdCandidateId}`)}
            >
              查看详情
            </Button>,
            <Button key="list" onClick={() => navigate('/candidates')}>
              返回列表
            </Button>,
            <Button
              key="again"
              onClick={() => {
                setUploadSuccess(false);
                setCreatedCandidateId('');
              }}
            >
              继续上传
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 0' }}>
      <Card
        title={
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            📄 上传并解析简历
          </span>
        }
        style={{ borderRadius: 12 }}
      >
        <FileUpload
          onFileUpload={handleFileUpload}
          onUploadComplete={handleUploadComplete}
        />
      </Card>

      <Card
        title="使用说明"
        size="small"
        style={{
          marginTop: 16,
          borderRadius: 12,
          background: '#fafafa',
        }}
        styles={{ body: { padding: '14px 20px' } }}
      >
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 2.2, fontSize: 13, color: '#666' }}>
          <li>支持上传 PDF 格式的简历文件</li>
          <li>系统将自动解析简历中的基本信息、教育经历、工作经历和技能标签</li>
          <li>解析完成后可手动编辑和修正提取的信息</li>
          <li>确认无误后点击「确认」按钮完成录入</li>
        </ul>
      </Card>
    </div>
  );
};

export default ResumeUpload;
