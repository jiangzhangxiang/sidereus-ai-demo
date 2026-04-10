/**
 * @fileoverview PDF 简历预览卡片组件
 * @description 展示候选人的原始简历文件信息，提供预览和下载按钮。
 *              点击预览按钮弹出 Modal 对话框，展示模拟的 PDF 预览区域（实际项目可集成 PDF.js）。
 * @module pages/Candidates/Detail/PdfPreviewCard
 * @version 1.0.0
 */
import React, { useState } from 'react';
import { Card, Button, Modal } from 'antd';
import {
  FilePdfOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';

/** PDF 预览卡片 Props 接口 */
interface PdfPreviewCardProps {
  resumeUrl: string;
  candidateName: string;
}

/** PDF 简历预览卡片组件 */
const PdfPreviewCard: React.FC<PdfPreviewCardProps> = ({
  resumeUrl,
  candidateName,
}) => {
  const [previewVisible, setPreviewVisible] = useState(false);

  return (
    <>
      <Card
        title={
          <span>
            <FilePdfOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
            简历文档
          </span>
        }
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '20px',
            background: '#fff1f0',
            borderRadius: 10,
            border: '1px dashed #ffa39e',
          }}
        >
          <div
            style={{
              width: 48,
              height: 56,
              background: '#ff4d4f',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 22,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            PDF
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>
              {candidateName}_简历.pdf
            </div>
            <div style={{ color: '#999', fontSize: 13 }}>
              原始简历文档 · 支持在线预览
            </div>
          </div>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => setPreviewVisible(true)}
          >
            预览
          </Button>
          <Button icon={<DownloadOutlined />}>下载</Button>
        </div>

        <div
          style={{
            marginTop: 12,
            padding: '10px 14px',
            background: '#e6f7ff',
            borderRadius: 6,
            color: '#1677ff',
            fontSize: 13,
          }}
        >
          💡 提示：点击预览按钮可在新窗口中查看完整PDF简历
        </div>
      </Card>

      <Modal
        title={`${candidateName} - 简历预览`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
        centered
      >
        <div
          style={{
            height: 500,
            background: '#525659',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#fff',
          }}
        >
          <FilePdfOutlined
            style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 16 }}
          />
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {candidateName}_简历.pdf
          </div>
          <div style={{ color: '#aaa', marginTop: 8 }}>
            PDF 预览区域 - 实际项目中可集成 PDF.js 渲染引擎
          </div>
          <div
            style={{
              marginTop: 20,
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 6,
              fontSize: 13,
              color: '#ccc',
            }}
          >
            文件路径：{resumeUrl}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PdfPreviewCard;
