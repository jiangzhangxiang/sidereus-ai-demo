import React from 'react';
import {
  Upload,
  Button,
  message,
  Card,
  Spin,
  Input,
  Space,
} from 'antd';
import type { UploadProps } from 'antd';
import { UploadOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import {
  uploadResumeStream,
  type UploadResponse,
} from '../api/upload';

const { TextArea } = Input;

interface FileUploadProps {
  onFileUpload?: (files: File[]) => void;
  onUploadComplete?: (result: UploadResponse) => void;
  maxFiles?: number;
  maxFileSize?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  onUploadComplete,
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024,
}) => {
  const [fileList, setFileList] = React.useState<any[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadResults, setUploadResults] =
    React.useState<UploadResponse | null>(null);
  const [streaming, setStreaming] = React.useState(false);
  const [streamText, setStreamText] = React.useState('');

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
    const { status } = info.file;

    if (status === 'done') {
      message.success(`${info.file.name} 上传成功`);
    } else if (status === 'error') {
      message.error(`${info.file.name} 上传失败`);
    }

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

      message.success('文件上传成功');

      if (onFileUpload) {
        onFileUpload(files);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '上传失败');
    } finally {
      setUploading(false);
      setStreaming(false);
    }
  };

  const updateBasicInfo = (field: keyof UploadResponse['basicInfo'], value: string) => {
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
      const workExperience = prev.workExperience.filter((_, i) => i !== index);
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

  const handleConfirm = () => {
    console.log('编辑后的简历数据：', JSON.stringify(uploadResults, null, 2));
    if (onUploadComplete && uploadResults) {
      onUploadComplete(uploadResults);
    }
    message.success('已确认提交');
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

  return (
    <div style={{ margin: '20px 0' }}>
      <Upload.Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
        <p className="ant-upload-hint">
          支持批量上传，最多上传
          {maxFiles}
          个PDF文件，单个文件大小不超过
          {maxFileSize / (1024 * 1024)}
          MB
        </p>
      </Upload.Dragger>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Button
          type="primary"
          onClick={handleUpload}
          loading={uploading}
          disabled={fileList.length === 0}
        >
          开始上传
        </Button>
      </div>

      {(streaming || uploadResults) && (
        <Card title="上传结果" style={{ marginTop: 20 }} extra={
          uploadResults && !streaming ? (
            <Button type="primary" onClick={handleConfirm}>
              确认
            </Button>
          ) : null
        }>
          <Spin spinning={streaming}>
            {streaming && !uploadResults && (
              <div style={{ textAlign: 'left', minHeight: 200 }}>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                    fontSize: 14,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {streamText}
                  <span
                    style={{
                      display: 'inline-block',
                      width: 2,
                      height: 16,
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

            {uploadResults && (
              <div style={{ textAlign: 'left' }}>
                <h4>基本信息</h4>
                <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }} size="small">
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

                <h4>
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
                      border: '1px solid #d9d9d9',
                      borderRadius: 6,
                      padding: 12,
                      marginBottom: 12,
                      position: 'relative',
                    }}
                  >
                    <MinusCircleOutlined
                      onClick={() => removeEducation(index)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: '#ff4d4f',
                        cursor: 'pointer',
                      }}
                    />
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div style={{ display: 'flex', gap: 12 }}>
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
                      <div style={{ display: 'flex', gap: 12 }}>
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

                <h4>
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
                      border: '1px solid #d9d9d9',
                      borderRadius: 6,
                      padding: 12,
                      marginBottom: 12,
                      position: 'relative',
                    }}
                  >
                    <MinusCircleOutlined
                      onClick={() => removeWorkExperience(index)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: '#ff4d4f',
                        cursor: 'pointer',
                      }}
                    />
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div style={{ display: 'flex', gap: 12 }}>
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

                <h4>
                  技能
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {uploadResults.skills.map((skill, index) => (
                    <div key={index} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <Input
                        placeholder="技能"
                        value={skill}
                        onChange={(e) => updateSkills(index, e.target.value)}
                        style={{ width: 140 }}
                      />
                      <MinusCircleOutlined
                        onClick={() => removeSkill(index)}
                        style={{
                          marginLeft: 4,
                          color: '#ff4d4f',
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Spin>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;
