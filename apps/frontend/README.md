# 前端应用 (frontend)

候选人管理系统的 React 前端应用，基于 Vite + TypeScript + Ant Design 技术栈。

## 项目概述

本前端应用是「全栈 Monorepo 候选人管理系统」的客户端部分，提供候选人列表、详情、新增、筛选、岗位编辑、智能匹配结果展示等页面功能，通过 RESTful API 与后端 NestJS 服务交互。

## 页面结构

```
src/
├── api/                    # API 请求封装
│   ├── candidates.ts       # 候选人接口
│   ├── jobs.ts             # 岗位接口
│   ├── match.ts            # 匹配接口
│   └── upload.ts           # 文件上传接口
├── components/             # 公共组件
│   ├── FileUpload.tsx      # 简历文件上传组件
│   └── MatchResultDrawer.tsx  # 匹配结果抽屉组件
├── layouts/                # 布局组件
│   └── MainLayout.tsx      # 主布局（侧边栏 + 内容区）
├── pages/
│   ├── Candidates/         # 候选人模块页面
│   │   ├── CandidateList.tsx        # 候选人列表页
│   │   ├── CandidateTable.tsx       # 候选人表格
│   │   ├── CandidateCard.tsx        # 候选人卡片
│   │   ├── FilterBar.tsx            # 筛选工具栏
│   │   ├── AddCandidatesModal.tsx   # 新增候选人弹窗
│   │   ├── ResumeUpload.tsx         # 简历上传区域
│   │   ├── StatusChangeModal.tsx    # 状态变更弹窗
│   │   └── Detail/                  # 候选人详情页
│   │       ├── CandidateDetail.tsx  # 详情主容器
│   │       ├── BasicInfoCard.tsx    # 基本信息卡片
│   │       ├── EducationCard.tsx    # 教育经历卡片
│   │       ├── WorkExperienceCard.tsx  # 工作经历卡片
│   │       ├── ScoreBreakdownCard.tsx  # 评分明细卡片
│   │       └── StatusManagement.tsx    # 状态管理组件
│   └── Jobs/               # 岗位模块页面
│       └── JobEdit.tsx     # 岗位编辑页
├── store/                  # Zustand 状态管理
│   └── candidateStore.ts   # 候选人状态 Store
├── App.tsx                 # 路由配置（React Router）
├── main.tsx                # 应用入口
├── App.css / index.css     # 全局样式
└── assets/                 # 静态资源（图片等）
```

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TypeScript | ~6.0 | 类型安全 |
| Vite | 5 | 构建工具 |
| React Router | 7 | 路由管理 |
| Zustand | 5 | 状态管理 |
| Ant Design | 6 | UI 组件库 |
| @ant-design/icons | 5 | 图标库 |

## 功能页面

### 候选人管理 (Candidates)

- **列表页**：候选人卡片/表格展示、关键词搜索、状态筛选
- **详情页**：基本信息、教育经历、工作经历、评分明细、状态流转
- **新增**：手动录入或 PDF 简历上传解析
- **状态管理**：待筛选 → 初筛 → 面试中 → 已录用 / 已淘汰

### 岗位管理 (Jobs)

- **岗位编辑**：创建和编辑岗位信息（名称、描述、必备技能、加分技能）

### 智能匹配 (Match)

- **匹配结果**：抽屉式展示多维度评分与 AI 评语

## 开发脚本

```bash
# 安装依赖
pnpm install

# 开发模式启动（热重载）
pnpm dev

# 类型检查 + 构建
pnpm build

# 代码检查
pnpm lint

# 预览生产构建
pnpm preview
```

## 访问地址

开发模式启动后访问：**http://localhost:5173**
