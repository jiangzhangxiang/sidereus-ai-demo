import React from 'react';
import { Upload, Button, message } from 'antd';
import type { UploadProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

interface FileUploadProps {
  onFileUpload?: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB
}) => {
  const [fileList, setFileList] = React.useState<any[]>([]);

  const handleBeforeUpload = (file: File) => {
    // 检查文件类型
    if (!file.type.includes('pdf')) {
      message.error('只能上传PDF格式文件');
      return Upload.LIST_IGNORE;
    }

    // 检查文件大小
    if (file.size > maxFileSize) {
      message.error(`文件大小不能超过${maxFileSize / (1024 * 1024)}MB`);
      return Upload.LIST_IGNORE;
    }

    // 检查文件数量
    if (fileList.length >= maxFiles) {
      message.error(`最多只能上传${maxFiles}个文件`);
      return Upload.LIST_IGNORE;
    }

    return false; // 阻止自动上传，使用手动上传
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

  const handleUpload = () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    const files = fileList.map(item => item.originFileObj as File);
    if (onFileUpload) {
      onFileUpload(files);
    }
    message.success(`成功上传${files.length}个文件`);
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
          支持批量上传，最多上传{maxFiles}个PDF文件，单个文件大小不超过{maxFileSize / (1024 * 1024)}MB
        </p>
      </Upload.Dragger>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Button type="primary" onClick={handleUpload}>
          开始上传
        </Button>
      </div>
    </div>
  );
};

export default FileUpload;