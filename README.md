# demo

全栈 Monorepo 候选人管理系统

## 项目概述

本项目是一个面试 demo 项目，基于 Monorepo 架构构建的**候选人管理系统**。实现了简历上传与解析、候选人信息管理、岗位管理、智能人岗匹配等核心功能，旨在展示现代前后端开发的技术能力与工程实践。

## 项目架构

### 目录结构

```
demo/
├── apps/
│   ├── backend/              # NestJS 后端应用
│   │   ├── src/
│   │   │   ├── candidates/   # 候选人模块（实体/控制器/服务/DTO）
│   │   │   ├── jobs/         # 岗位管理模块（实体/控制器/服务/DTO）
│   │   │   ├── match/        # 智能匹配模块（控制器/服务/DTO）
│   │   │   ├── file-upload/  # 文件上传模块（简历解析）
│   │   │   ├── app.module.ts # 根模块（数据库/配置/模块注册）
│   │   │   └── main.ts       # 应用入口
│   │   └── test/             # E2E 测试
│   ├── frontend/             # React 前端应用
│   │   ├── src/
│   │   │   ├── api/          # API 请求封装（candidates/jobs/match/upload）
│   │   │   ├── components/   # 公共组件（FileUpload/MatchResultDrawer）
│   │   │   ├── layouts/      # 布局组件（MainLayout）
│   │   │   ├── pages/
│   │   │   │   ├── Candidates/# 候选人页面（列表/详情/新增/筛选）
│   │   │   │   └── Jobs/     # 岗位编辑页面
│   │   │   ├── store/        # Zustand 状态管理
│   │   │   └── App.tsx       # 路由配置
│   │   └── index.html
├── packages/
│   └── shared/               # 共享类型定义与工具函数
├── database/
│   └── schema.sql            # 数据库建表脚本
├── docker-compose.yml        # PostgreSQL 本地开发环境
├── docker-compose.prod.yml   # 生产环境 Docker Compose（含 Nginx）
├── Dockerfile.backend        # 后端 Docker 镜像
├── Dockerfile.frontend       # 前端 Docker 镜像
├── nginx.conf                # Nginx 反向代理配置
├── deploy.sh                 # Linux 服务器一键部署脚本
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
| @ant-design/icons | 6 | 图标库 |

#### 后端 (backend)

| 技术 | 版本 | 用途 |
|------|------|------|
| NestJS | 11 | 服务端框架 |
| Fastify | - | HTTP 适配器 |
| TypeORM | 0.3 | ORM |
| PostgreSQL | 15 | 关系型数据库 |
| class-validator | 0.15 | DTO 校验 |
| @fastify/multipart | 10 | 文件上传处理 |
| multer | 2.1 | 文件解析中间件 |
| pdf-parse | 2.4 | 简历 PDF 解析 |
| axios | 1.15 | HTTP 客户端 |

#### 开发工具

| 技术 | 用途 |
|------|------|
| pnpm | 包管理器（Monorepo） |
| ESLint + Prettier | 代码质量与格式化 |
| Docker Compose | 数据库本地环境 / 生产部署 |
| Jest | 单元测试 & E2E 测试 |

## 功能模块

### 候选人管理 (Candidates)

- **候选人 CRUD**：创建、查询、更新候选人基本信息
- **教育经历 / 工作经历**：关联实体，支持多段记录
- **状态管理**：`pending` → `screened` → `interviewing` → `hired` / `rejected` 面试流程跟踪
- **筛选与排序**：按状态、关键词等条件过滤候选人列表
- **评分系统**：多维度评分（技术能力 / 项目经验 / 教育背景 / 沟通表达 / 发展潜力）

### 岗位管理 (Jobs)

- **岗位 CRUD**：创建、查询、更新、删除岗位信息
- **技能标签**：必备技能 (`required_skills`) 与加分技能 (`plus_skills`) 管理
- **岗位详情**：岗位名称、描述、技能要求的完整维护

### 智能匹配 (Match)

- **人岗匹配分析**：基于岗位需求与候选人简历的多维度智能匹配
- **评分算法**：综合技术能力、项目经验、教育背景、沟通表达、发展潜力五个维度打分
- **AI 评语**：生成匹配结果的自然语言评语

### 简历上传与解析 (FileUpload)

- 支持 PDF 格式简历文件上传
- 使用 `pdf-parse` 自动提取简历文本内容
- 文件存储与解析结果返回

### 共享包 (shared)

- 统一的 TypeScript 类型定义（Candidate、Education、WorkExperience、Job、ScoreBreakdown 等）
- 候选人状态枚举与中文标签映射
- 通用工具函数（日期格式化等）
- 确保前后端数据结构一致性

## 数据库设计

使用 PostgreSQL 15，主要表结构：

| 表名 | 说明 | 主键类型 |
|------|------|----------|
| `candidate` | 候选人基本信息（JSONB 存储） | UUID |
| `education` | 教育经历 | UUID |
| `work_experience` | 工作经历 | UUID |
| `job` | 岗位信息 | UUID |

- 使用 `uuid-ossp` 扩展自动生成 UUID 主键
- 候选人状态使用自定义枚举类型 `candidate_status_enum`
- `candidate` 表的 `basicInfo` 和 `scoreBreakdown` 字段使用 JSONB 类型存储灵活数据

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

# 3. 启动 PostgreSQL（本地开发）
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
pnpm start:dev              # 开发模式启动（热重载）
pnpm build                  # 构建生产版本
pnpm start:prod             # 生产模式启动
pnpm lint                   # 代码检查
pnpm format                 # 代码格式化
pnpm test                   # 单元测试
pnpm test:e2e               # E2E 测试
pnpm test:cov               # 测试覆盖率

# 前端 (apps/frontend)
pnpm dev                    # 开发模式启动（热重载）
pnpm build                  # 构建生产版本
pnpm preview                # 预览生产构建
pnpm lint                   # 代码检查

# 共享包 (packages/shared)
pnpm build                  # 构建 TypeScript 类型声明
```

## 前端路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | → `/candidates` | 根路径重定向 |
| `/candidates` | 候选人列表 | 支持筛选、搜索、状态管理 |
| `/candidates/:id` | 候选人详情 | 基本信息 / 教育经历 / 工作经历 / 评分明细 |
| `/job/edit` | 新增岗位 | 岗位信息表单 |
| `/job/:id` | 编辑岗位 | 加载已有数据并编辑 |

## API 接口

### 候选人 (/api/candidates)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/candidates` | 获取候选人列表 |
| POST | `/api/candidates` | 创建候选人 |
| GET | `/api/candidates/:id` | 获取候选人详情 |
| PATCH | `/api/candidates/:id` | 更新候选人信息（含状态变更） |

### 岗位管理 (/api/jobs)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/jobs` | 获取岗位列表 |
| POST | `/api/jobs` | 创建岗位 |
| GET | `/api/jobs/:id` | 获取岗位详情 |
| PUT | `/api/jobs/:id` | 更新岗位信息 |
| DELETE | `/api/jobs/:id` | 删除岗位 |

### 智能匹配 (/api/match)

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/match` | 执行人岗匹配分析，返回多维度评分与 AI 评语 |

### 文件上传

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/upload` | 上传并解析简历 PDF |

## 部署

### Docker 生产部署

项目提供完整的生产环境 Docker 部署方案：

```bash
# 使用生产环境 Compose 一键启动全部服务
docker-compose -f docker-compose.prod.yml up -d --build
```

生产环境包含三个服务：

| 服务 | 端口 | 说明 |
|------|------|------|
| postgres | 5432 (内部) | PostgreSQL 数据库（含健康检查） |
| backend | 3000 | NestJS 后端 API 服务 |
| frontend | 80 | React 前端（Nginx 静态托管 + 反向代理） |

### Linux 服务器一键部署

```bash
# 在目标服务器上执行（需 root 权限）
sudo bash deploy.sh
```

部署脚本会自动完成：
1. 安装系统依赖（Docker、Git 等）
2. 克隆项目代码
3. 配置环境变量
4. 构建并启动 Docker 容器
5. 配置 Nginx 反向代理
