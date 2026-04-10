import React from 'react';
import {
  Modal,
  Upload,
  Button,
  message,
  Card,
  Spin,
  Input,
  Space,
  Steps,
  Result,
} from 'antd';
import type { UploadProps } from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  EditOutlined,
} from '@ant-design/icons';
import {
  uploadResumeStream,
  type UploadResponse,
} from '../../api/upload';
import { useCandidateStore } from '../../store/candidateStore';
import type { Candidate } from '@demo/shared';

const { TextArea } = Input;

interface AddCandidatesModalProps {
  open: boolean;
  onClose: () => void;
}

type StepType = 'upload' | 'preview' | 'success';

const AddCandidatesModal: React.FC<AddCandidatesModalProps> = ({
  open,
  onClose,
}) => {
  const { addCandidate } = useCandidateStore();
  const [currentStep, setCurrentStep] = React.useState<StepType>('upload');
  const [fileList, setFileList] = React.useState<any[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadResults, setUploadResults] =
    React.useState<UploadResponse | null>(null);
  const [streaming, setStreaming] = React.useState(false);
  const [streamText, setStreamText] = React.useState('');
  const [createdCandidateId, setCreatedCandidateId] = React.useState<string>('');
  const maxFiles = 5;
  const maxFileSize = 10 * 1024 * 1024;

  React.useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  const resetState = () => {
    setCurrentStep('upload');
    setFileList([]);
    setUploading(false);
    setUploadResults(null);
    setStreaming(false);
    setStreamText('');
    setCreatedCandidateId('');
  };

  const handleBeforeUpload = (file: File) => {
    if (!file.type.includes('pdf')) {
      message.error('只能上传PDF格式文件');
      return Upload.LIST_IGNORE;
    }

    if (file.size > maxFileSize) {
      message.error(
        `文件大小不能超过${maxFileSize / (1024 * 1024)}MB`,
      );
      return Upload.LIST_IGNORE;
    }

    if (fileList.length >= maxFiles) {
      message.error(`最多只能上传${maxFiles}个文件`);
      return Upload.LIST_IGNORE;
    }

    return false;
  };

  const handleChange: UploadProps['onChange'] = (info) => {
    setFileList([...info.fileList]);
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    const files = fileList.map((item) => item.originFileObj as File);

    try {
      setUploading(true);
      setStreaming(true);
      setStreamText('');
      setUploadResults(null);

      let fullText = '';

      for await (const event of uploadResumeStream(files[0])) {
        if (event.type === 'token' && typeof event.data === 'string') {
          fullText += event.data;
          setStreamText(fullText);
        }

        if (event.type === 'complete') {
          try {
            const jsonMatch = fullText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const result: UploadResponse = JSON.parse(jsonMatch[0]);
              setUploadResults(result);
            }
          } catch {
            console.error('解析流式结果失败:', fullText);
          }
        }
      }

      message.success('简历解析完成');
      setCurrentStep('preview');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '上传失败');
    } finally {
      setUploading(false);
      setStreaming(false);
    }
  };

  const updateBasicInfo = (
    field: keyof UploadResponse['basicInfo'],
    value: string,
  ) => {
    setUploadResults((prev) => {
      if (!prev) return prev;
      return { ...prev, basicInfo: { ...prev.basicInfo, [field]: value } };
    });
  };

  const updateEducation = (
    index: number,
    field: keyof UploadResponse['education'][0],
    value: string,
  ) => {
    setUploadResults((prev) => {
      if (!prev) return prev;
      const education = [...prev.education];
      education[index] = { ...education[index], [field]: value };
      return { ...prev, education };
    });
  };

  const addEducation = () => {
    setUploadResults((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        education: [
          ...prev.education,
          { school: '', major: '', degree: '', graduationDate: '' },
        ],
      };
    });
  };

  const removeEducation = (index: number) => {
    setUploadResults((prev) => {
      if (!prev) return prev;
      const education = prev.education.filter((_, i) => i !== index);
      return { ...prev, education };
    });
  };

  const updateWorkExperience = (
    index: number,
    field: keyof UploadResponse['workExperience'][0],
    value: string,
  ) => {
    setUploadResults((prev) => {
      if (!prev) return prev;
      const workExperience = [...prev.workExperience];
      workExperience[index] = { ...workExperience[index], [field]: value };
      return { ...prev, workExperience };
    });
  };

  const addWorkExperience = () => {
    setUploadResults((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        workExperience: [
          ...prev.workExperience,
          { company: '', position: '', period: '', description: '' },
        ],
      };
    });
  };

  const removeWorkExperience = (index: number) => {
    setUploadResults((prev) => {
      if (!prev) return prev;
      const workExperience = prev.workExperience.filter(
        (_, i) => i !== index,
      );
      return { ...prev, workExperience };
    });
  };

  const updateSkills = (index: number, value: string) => {
    setUploadResults((prev) => {
      if (!prev) return prev;
      const skills = [...prev.skills];
      skills[index] = value;
      return { ...prev, skills };
    });
  };

  const addSkill = () => {
    setUploadResults((prev) => {
      if (!prev) return prev;
      return { ...prev, skills: [...prev.skills, ''] };
    });
  };

  const removeSkill = (index: number) => {
    setUploadResults((prev) => {
      if (!prev) return prev;
      const skills = prev.skills.filter((_, i) => i !== index);
      return { ...prev, skills };
    });
  };

  const handleConfirm = async () => {
    if (!uploadResults) return;

    const totalScore =
      (Math.random() * 20 + 75) | 0;

    const newCandidate: Candidate = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      basicInfo: { ...uploadResults.basicInfo },
      education: [...uploadResults.education],
      workExperience: [...uploadResults.workExperience],
      skills: [...uploadResults.skills],
      score: totalScore,
      scoreBreakdown: {
        technicalSkills: Math.min(
          100,
          totalScore + Math.floor(Math.random() * 10 - 5),
        ),
        experience: Math.min(
          100,
          totalScore + Math.floor(Math.random() * 10 - 5),
        ),
        education: Math.min(
          100,
          totalScore + Math.floor(Math.random() * 10 - 3),
        ),
        communication: Math.min(
          100,
          totalScore + Math.floor(Math.random() * 10 - 7),
        ),
        potential: Math.min(
          100,
          totalScore + Math.floor(Math.random() * 10 - 4),
        ),
      },
      status: 'pending',
      resumeUrl: `/resumes/${uploadResults.basicInfo.name}.pdf`,
      uploadedAt: new Date().toISOString(),
    };

    try {
      await addCandidate(newCandidate);
      setCreatedCandidateId(newCandidate.id);
      setCurrentStep('success');
      message.success('候选人已成功添加！');
    } catch (error) {
      message.error('添加候选人失败，请重试');
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    accept: '.pdf',
    fileList,
    beforeUpload: handleBeforeUpload,
    onChange: handleChange,
    showUploadList: {
      showRemoveIcon: true,
      showPreviewIcon: true,
    },
  };

  const renderUploadStep = () => (
    <div>
      <Upload.Dragger {...uploadProps} style={{ marginBottom: 16 }}>
        <p className="ant-upload-drag-icon">
          <UploadOutlined style={{ fontSize: 48, color: '#1677ff' }} />
        </p>
        <p className="ant-upload-text" style={{ fontSize: 16 }}>
          点击或拖拽PDF简历文件到此处上传
        </p>
        <p className="ant-upload-hint" style={{ color: '#999' }}>
          支持批量上传，最多上传
          {maxFiles}
          个PDF文件，单个文件大小不超过
          {maxFileSize / (1024 * 1024)}
          MB
        </p>
      </Upload.Dragger>

      {(streaming || uploadResults) && (
        <Card
          size="small"
          title="解析进度"
          style={{ marginTop: 16 }}
        >
          <Spin spinning={streaming}>
            {streaming && !uploadResults && (
              <div style={{ textAlign: 'left', minHeight: 150, maxHeight: 250, overflow: 'auto' }}>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    lineHeight: 1.6,
                    margin: 0,
                    color: '#555',
                  }}
                >
                  {streamText}
                  <span
                    style={{
                      display: 'inline-block',
                      width: 2,
                      height: 14,
                      background: '#1677ff',
                      marginLeft: 2,
                      verticalAlign: 'text-bottom',
                      animation: 'blink 1s step-end infinite',
                    }}
                  />
                </pre>
                <style>{`
                  @keyframes blink {
                    50% { opacity: 0; }
                  }
                `}</style>
              </div>
            )}
          </Spin>
        </Card>
      )}

      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <Button onClick={onClose} style={{ marginRight: 8 }}>
          取消
        </Button>
        <Button
          type="primary"
          onClick={handleUpload}
          loading={uploading}
          disabled={fileList.length === 0}
        >
          开始解析
        </Button>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div>
      {!uploadResults ? null : (
        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
          <h4 style={{ marginBottom: 12 }}>基本信息</h4>
          <Space direction="vertical" style={{ width: '100%', marginBottom: 20 }} size="middle">
            <div style={{ display: 'flex', gap: 12 }}>
              <Input
                placeholder="姓名"
                value={uploadResults.basicInfo.name}
                onChange={(e) => updateBasicInfo('name', e.target.value)}
                style={{ flex: 1 }}
              />
              <Input
                placeholder="电话"
                value={uploadResults.basicInfo.phone}
                onChange={(e) => updateBasicInfo('phone', e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Input
                placeholder="邮箱"
                value={uploadResults.basicInfo.email}
                onChange={(e) => updateBasicInfo('email', e.target.value)}
                style={{ flex: 1 }}
              />
              <Input
                placeholder="城市"
                value={uploadResults.basicInfo.city}
                onChange={(e) => updateBasicInfo('city', e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </Space>

          <h4 style={{ marginBottom: 12 }}>
            教育经历
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={addEducation}
              style={{ marginLeft: 8 }}
            >
              添加
            </Button>
          </h4>
          {uploadResults.education.map((edu, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #e8e8e8',
                borderRadius: 8,
                padding: 14,
                marginBottom: 14,
                position: 'relative',
                background: '#fafbfc',
              }}
            >
              <MinusCircleOutlined
                onClick={() => removeEducation(index)}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  color: '#ff4d4f',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              />
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <div style={{ display: 'flex', gap: 10 }}>
                  <Input
                    placeholder="学校"
                    value={edu.school}
                    onChange={(e) =>
                      updateEducation(index, 'school', e.target.value)
                    }
                    style={{ flex: 2 }}
                  />
                  <Input
                    placeholder="专业"
                    value={edu.major}
                    onChange={(e) =>
                      updateEducation(index, 'major', e.target.value)
                    }
                    style={{ flex: 1 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Input
                    placeholder="学历"
                    value={edu.degree}
                    onChange={(e) =>
                      updateEducation(index, 'degree', e.target.value)
                    }
                    style={{ flex: 1 }}
                  />
                  <Input
                    placeholder="毕业时间"
                    value={edu.graduationDate}
                    onChange={(e) =>
                      updateEducation(
                        index,
                        'graduationDate',
                        e.target.value,
                      )
                    }
                    style={{ flex: 1 }}
                  />
                </div>
              </Space>
            </div>
          ))}

          <h4 style={{ marginBottom: 12, marginTop: 20 }}>
            工作经历
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={addWorkExperience}
              style={{ marginLeft: 8 }}
            >
              添加
            </Button>
          </h4>
          {uploadResults.workExperience.map((work, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #e8e8e8',
                borderRadius: 8,
                padding: 14,
                marginBottom: 14,
                position: 'relative',
                background: '#fafbfc',
              }}
            >
              <MinusCircleOutlined
                onClick={() => removeWorkExperience(index)}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  color: '#ff4d4f',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              />
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <div style={{ display: 'flex', gap: 10 }}>
                  <Input
                    placeholder="公司名称"
                    value={work.company}
                    onChange={(e) =>
                      updateWorkExperience(
                        index,
                        'company',
                        e.target.value,
                      )
                    }
                    style={{ flex: 2 }}
                  />
                  <Input
                    placeholder="职位"
                    value={work.position}
                    onChange={(e) =>
                      updateWorkExperience(
                        index,
                        'position',
                        e.target.value,
                      )
                    }
                    style={{ flex: 1 }}
                  />
                </div>
                <Input
                  placeholder="时间段"
                  value={work.period}
                  onChange={(e) =>
                    updateWorkExperience(index, 'period', e.target.value)
                  }
                />
                <TextArea
                  placeholder="工作内容摘要"
                  value={work.description}
                  onChange={(e) =>
                    updateWorkExperience(
                      index,
                      'description',
                      e.target.value,
                    )
                  }
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
              </Space>
            </div>
          ))}

          <h4 style={{ marginBottom: 12, marginTop: 20 }}>
            技能标签
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={addSkill}
              style={{ marginLeft: 8 }}
            >
              添加
            </Button>
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {uploadResults.skills.map((skill, index) => (
              <div
                key={index}
                style={{ display: 'inline-flex', alignItems: 'center' }}
              >
                <Input
                  placeholder="技能"
                  value={skill}
                  onChange={(e) => updateSkills(index, e.target.value)}
                  style={{ width: 140 }}
                />
                <MinusCircleOutlined
                  onClick={() => removeSkill(index)}
                  style={{
                    marginLeft: 6,
                    color: '#ff4d4f',
                    cursor: 'pointer',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid #f0f0f0',
          textAlign: 'right',
        }}
      >
        <Button
          onClick={() => setCurrentStep('upload')}
          style={{ marginRight: 8 }}
        >
          上一步
        </Button>
        <Button type="primary" onClick={handleConfirm}>
          确认添加
        </Button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div style={{ padding: '20px 0', textAlign: 'center' }}>
      <Result
        status="success"
        icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 64 }} />}
        title={<span style={{ fontSize: 18 }}>候选人添加成功！</span>}
        subTitle="简历已完成解析并成功添加到候选人列表"
        extra={[
          <Button
            type="primary"
            key="detail"
            onClick={() => {
              onClose();
              window.location.href = `/candidates/${createdCandidateId}`;
            }}
          >
            查看详情
          </Button>,
          <Button
            key="again"
            onClick={() => {
              resetState();
              setCurrentStep('upload');
            }}
          >
            继续添加
          </Button>,
        ]}
      />
    </div>
  );

  const stepItems = [
    { title: '上传简历', icon: <FileTextOutlined /> },
    { title: '编辑信息', icon: <EditOutlined /> },
    { title: '完成', icon: <CheckCircleOutlined /> },
  ];

  const getStepIndex = () => {
    switch (currentStep) {
      case 'upload':
        return 0;
      case 'preview':
        return 1;
      case 'success':
        return 2;
      default:
        return 0;
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>添加候选人</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={720}
      footer={null}
      destroyOnClose
      centered
      styles={{
        body: { padding: '24px 24px 8px', maxHeight: '80vh', overflowY: 'auto' },
      }}
    >
      <Steps
        current={getStepIndex()}
        items={stepItems}
        size="small"
        style={{ marginBottom: 24 }}
      />

      {currentStep === 'upload' && renderUploadStep()}
      {currentStep === 'preview' && renderPreviewStep()}
      {currentStep === 'success' && renderSuccessStep()}
    </Modal>
  );
};

export default AddCandidatesModal;
