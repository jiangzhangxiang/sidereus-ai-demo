# demo

全栈 Monorepo 候选人管理系统

## 项目概述

本项目是一个面试 demo 项目，基于 Monorepo 架构构建的**候选人管理系统**。实现了简历上传与解析、候选人信息管理、面试流程状态跟踪等核心功能，旨在展示现代前后端开发的技术能力与工程实践。

## 项目架构

### 目录结构

```
demo/
├── apps/
│   ├── backend/              # NestJS 后端应用
│   │   ├── src/
│   │   │   ├── candidates/   # 候选人模块（实体/控制器/服务/DTO）
│   │   │   ├── file-upload/  # 文件上传模块（简历解析）
│   │   │   ├── app.module.ts # 根模块（数据库/配置/模块注册）
│   │   │   └── main.ts       # 应用入口
│   │   └── test/             # E2E 测试
│   ├── frontend/             # React 前端应用
│   │   ├── src/
│   │   │   ├── api/          # API 请求封装
│   │   │   ├── components/   # 公共组件
│   │   │   ├── layouts/      # 布局组件
│   │   │   ├── pages/        # 页面（候选人列表/详情/新增）
│   │   │   └── store/        # Zustand 状态管理
│   │   └── index.html
├── packages/
│   └── shared/               # 共享类型定义与工具函数
├── docker-compose.yml        # PostgreSQL 本地服务
├── pnpm-workspace.yaml       # pnpm 工作区配置
└── package.json              # 根配置
```

### 技术栈

#### 前端 (frontend)

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TypeScript | ~6.0 | 类型安全 |
| Vite | 8 | 构建工具 |
| React Router | 7 | 路由管理 |
| Zustand | 5 | 状态管理 |
| Ant Design | 6 | UI 组件库 |

#### 后端 (backend)

| 技术 | 版本 | 用途 |
|------|------|------|
| NestJS | 11 | 服务端框架 |
| TypeORM | 0.3 | ORM |
| PostgreSQL | 15 | 关系型数据库 |
| class-validator | 0.15 | DTO 校验 |
| pdf-parse | 2.4 | 简历 PDF 解析 |

#### 开发工具

| 技术 | 用途 |
|------|------|
| pnpm | 包管理器（Monorepo） |
| ESLint + Prettier | 代码质量与格式化 |
| Docker Compose | 数据库本地环境 |

## 功能模块

### 候选人管理 (Candidates)

- **候选人 CRUD**：创建、查询、更新候选人基本信息
- **教育经历 / 工作经历**：关联实体，支持多段记录
- **状态管理**：`pending` → `screened` → `interviewing` → `hired` 面试流程跟踪
- **筛选与排序**：按状态、关键词等条件过滤候选人列表

### 简历上传与解析 (FileUpload)

- 支持 PDF 格式简历文件上传
- 使用 `pdf-parse` 自动提取简历文本内容
- 文件存储与解析结果返回

### 共享包 (shared)

- 统一的 TypeScript 类型定义（Candidate、Education、WorkExperience 等）
- 通用工具函数（日期格式化等）
- 确保前后端数据结构一致性

## 快速开始

### 前置要求

- Node.js >= 18
- pnpm >= 8
- Docker >= 20（用于 PostgreSQL）

### 安装与启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd demo

# 2. 安装依赖
pnpm install

# 3. 启动 PostgreSQL
docker-compose up -d

# 4. 配置后端环境变量
# 创建 apps/backend/.env.local：
#   DB_HOST=localhost
#   DB_PORT=5432
#   DB_USERNAME=demo
#   DB_PASSWORD=demo
#   DB_DATABASE=demo

# 5. 启动后端服务
cd apps/backend
pnpm start:dev

# 6. 启动前端服务（新终端）
cd apps/frontend
pnpm dev
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:5173 |
| 后端 API | http://localhost:3000 |

## 开发脚本

```bash
# 根目录
pnpm install                # 安装所有依赖

# 后端 (apps/backend)
pnpm start:dev              # 开发模式启动
pnpm build                  # 构建生产版本
pnpm lint                   # 代码检查
pnpm test:e2e               # E2E 测试

# 前端 (apps/frontend)
pnpm dev                    # 开发模式启动
pnpm build                  # 构建生产版本
pnpm lint                   # 代码检查
```

## API 接口

### 候选人

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/candidates` | 获取候选人列表 |
| POST | `/candidates` | 创建候选人 |
| GET | `/candidates/:id` | 获取候选人详情 |
| PATCH | `/candidates/:id` | 更新候选人信息 |

### 文件上传

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/upload` | 上传并解析简历 PDF |
