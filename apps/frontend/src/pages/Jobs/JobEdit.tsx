/**
 * @fileoverview 岗位编辑页面
 * @description 支持新增和编辑岗位，包含岗位名称、描述、必备技能、加分技能的表单配置。
 *              通过 URL 参数判断新增/编辑模式，编辑模式下自动加载已有数据。
 *              使用 Ant Design Form 组件进行表单验证和数据管理。
 * @module pages/Jobs/JobEdit
 * @version 1.0.0
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Tag,
  Space,
  Spin,
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import type { Job } from '@demo/shared';
import { fetchJobById, createJob, updateJob } from '../../api/jobs';

const { TextArea } = Input;

const JobEdit: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [plusSkills, setPlusSkills] = useState<string[]>([]);
  const [requiredInput, setRequiredInput] = useState('');
  const [plusInput, setPlusInput] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      fetchJobById(id)
        .then((data: Job) => {
          form.setFieldsValue({
            title: data.title,
            description: data.description,
          });
          setRequiredSkills(data.required_skills || []);
          setPlusSkills(data.plus_skills || []);
        })
        .catch(() => message.error('加载岗位数据失败'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, form]);

  const addRequiredSkill = () => {
    const trimmed = requiredInput.trim();
    if (!trimmed) return;
    if (requiredSkills.includes(trimmed)) {
      message.warning('该技能已存在');
      return;
    }
    setRequiredSkills([...requiredSkills, trimmed]);
    setRequiredInput('');
  };

  const removeRequiredSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  const addPlusSkill = () => {
    const trimmed = plusInput.trim();
    if (!trimmed) return;
    if (plusSkills.includes(trimmed)) {
      message.warning('该技能已存在');
      return;
    }
    setPlusSkills([...plusSkills, trimmed]);
    setPlusInput('');
  };

  const removePlusSkill = (skill: string) => {
    setPlusSkills(plusSkills.filter((s) => s !== skill));
  };

  const handleFinish = async (values: { title: string; description: string }) => {
    if (requiredSkills.length === 0) {
      message.warning('请至少填写一项必备技能');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: values.title,
        description: values.description,
        required_skills: requiredSkills,
        plus_skills: plusSkills,
      };

      if (isEdit && id) {
        await updateJob(id, payload);
        message.success('岗位更新成功');
      } else {
        await createJob(payload);
        message.success('岗位创建成功');
      }
      navigate('/candidates');
    } catch {
      message.error(isEdit ? '更新失败' : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/candidates')}
        >
          返回候选人列表
        </Button>
      </div>

      <Card title={isEdit ? '编辑岗位' : '新建岗位'} style={{ maxWidth: 800 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ title: '', description: '' }}
        >
          <Form.Item
            label="岗位名称"
            name="title"
            rules={[
              { required: true, message: '请输入岗位名称' },
              { max: 50, message: '岗位名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入岗位名称（最大50字符）" />
          </Form.Item>

          <Form.Item
            label="岗位描述"
            name="description"
            rules={[{ required: true, message: '请输入岗位描述' }]}
          >
            <TextArea
              rows={6}
              placeholder="请输入岗位描述，支持基本格式化内容"
            />
          </Form.Item>

          <Form.Item
            label={
              <span>
                必备技能{' '}
                <span style={{ color: '#ff4d4f' }}>*</span>
                （至少1项）
              </span>
            }
            required
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  value={requiredInput}
                  onChange={(e) => setRequiredInput(e.target.value)}
                  onPressEnter={addRequiredSkill}
                  placeholder="输入技能名称后按回车添加"
                  style={{ flex: 1 }}
                />
                <Button icon={<PlusOutlined />} onClick={addRequiredSkill}>
                  添加
                </Button>
              </Space.Compact>
              <div>
                {requiredSkills.map((skill) => (
                  <Tag
                    key={skill}
                    closable
                    onClose={() => removeRequiredSkill(skill)}
                    color="red"
                    style={{ marginBottom: 4 }}
                  >
                    {skill}
                  </Tag>
                ))}
                {requiredSkills.length === 0 && (
                  <span style={{ color: '#999', fontSize: 13 }}>
                    暂无必备技能，请添加
                  </span>
                )}
              </div>
            </Space>
          </Form.Item>

          <Form.Item label="加分技能（选填）">
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  value={plusInput}
                  onChange={(e) => setPlusInput(e.target.value)}
                  onPressEnter={addPlusSkill}
                  placeholder="输入加分技能后按回车添加"
                  style={{ flex: 1 }}
                />
                <Button icon={<PlusOutlined />} onClick={addPlusSkill}>
                  添加
                </Button>
              </Space.Compact>
              <div>
                {plusSkills.map((skill) => (
                  <Tag
                    key={skill}
                    closable
                    onClose={() => removePlusSkill(skill)}
                    color="green"
                    style={{ marginBottom: 4 }}
                  >
                    {skill}
                  </Tag>
                ))}
                {plusSkills.length === 0 && (
                  <span style={{ color: '#999', fontSize: 13 }}>
                    暂无加分技能
                  </span>
                )}
              </div>
            </Space>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={submitting}
            >
              {isEdit ? '保存修改' : '创建岗位'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default JobEdit;
