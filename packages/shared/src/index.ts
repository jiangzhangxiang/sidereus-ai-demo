// 共享类型定义
export interface User {
  id: number;
  name: string;
  email: string;
}

// 共享工具函数
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
