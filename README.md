# demo

全栈 Monorepo 项目

## 📋 项目概述

本项目是一个面试 demo 项目，旨在展示现代前端和后端开发的技术能力、架构设计和最佳实践。项目采用 Monorepo 架构，实现了前后端分离的开发模式，并遵循 RESTful API 设计规范。

## 🏗️ 项目架构

### 项目结构
```
demo/

├── apps/                    # 应用程序目录
│   ├── backend/            # NestJS 后端应用
│   ├── frontend/            # React 前端应用
├── packages/               # 共享包目录
│   ├── shared/            # 共享类型和工具函数
└── docker-compose.yml      # Docker 服务编排

└── package.json            # 项目配置
```

### 应用架构

#### 前端架构 (frontend)
- **框架**: React
- **状态管理**: Zustand (轻量级状态管理)
- **路由**: React Router v6
- **UI 库**: Ant Design (企业级 UI 组件库)
- **构建工具**: Vite (快速的前端构建工具)

#### 后端架构 (backend)
- **框架**: NestJS
- **HTTP 服务器**: Express
- **数据库**: backend + PostgreSQL
- **ORM**: TypeORM (TypeScript ORM)
- **架构模式**: 模块化设计，遵循 DDD (领域驱动设计) 原则
- **API 设计**: RESTful API，使用 DTO 进行请求验证

#### 共享包 (shared)
- **功能**: 提供前后端共享的类型定义、工具函数
- **类型安全**: 确保前后端数据结构的一致性
- **代码复用**: 避免重复代码，提高开发效率



## 🛠️ 技术选型及理由

### 前端技术栈

| 技术 | 用途 |
|------|------|
| **frontend** | frontend 技术 |
| **React** | 最流行的前端框架，拥有丰富的生态系统和社区支持 |
| **React Router** | 官方路由解决方案，功能完善，社区活跃 |
| **Zustand** | 轻量级状态管理库，API 简洁，学习成本低 |
| **Ant Design** | 企业级 UI 组件库，组件丰富，设计规范统一 |

### 后端技术栈

| 技术 | 用途 |
|------|------|
| **backend** | backend 技术 |
| **NestJS** | 基于 Express 的 Node.js 框架，采用 TypeScript，架构清晰 |
| **TypeORM** | TypeScript 的 ORM 框架，支持多种数据库，类型安全 |

### 开发工具

| 技术 | 用途 |
|------|------|
| **TypeScript** | JavaScript 的超集，添加了静态类型 |
| **ESLint** | 代码质量检查，确保代码风格一致 |
| **Prettier** | 代码格式化工具，保持代码风格统一 |
| **Vite** | 快速的前端构建工具 |

### 数据库

| 技术 | 用途 |
|------|------|
| **backend** | backend 技术 |
| **PostgreSQL** | 开源的关系型数据库，功能强大，性能稳定 |

## 🚀 本地开发环境搭建指南

### 前置要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **Docker**: >= 20.0.0 (可选，用于数据库服务)

### 安装步骤

#### 1. 克隆项目
```bash
git clone <repository-url>
cd demo
```

#### 2. 安装依赖
```bash
# 安装 pnpm (如果尚未安装)
npm install -g pnpm

# 安装项目依赖
pnpm install
```

#### 3. 启动数据库服务
```bash
# 使用 Docker Compose 启动 PostgreSQL
docker-compose up -d

# 或手动安装 PostgreSQL 并创建数据库
# 数据库配置：
# Host: localhost
# Port: 5432
# Database: demo
# Username: demo
# Password: demo
```;

#### 4. 配置环境变量
在 `backend` 目录下创建 `.env.local` 文件：
```env
# 数据库配置
DATABASE_URL=postgresql://demo:demo@localhost:5432/demo

# 应用配置
PORT=3000
```;


#### 3. 启动开发服务器

**启动后端服务：**
```bash
cd backend
pnpm start:dev
```

**启动前端服务：**
```bash
cd frontend
pnpm dev
```

#### 5. 访问应用
- **前端**: http://localhost:5173

- **后端**: http://localhost:3000




### 开发脚本

**根目录脚本：**
```bash
pnpm install          # 安装所有依赖
pnpm test             # 运行所有测试



```

**backend 脚本：**
```bash
cd apps/backend
pnpm start:dev        # 启动开发服务器
pnpm build            # 构建生产版本
pnpm test:e2e         # 运行端到端测试

```

**frontend 脚本：**
```bash
cd apps/frontend
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本

```


## 🚀 部署方式说明

### 开发环境部署

```bash
# 后端
cd backend
pnpm start:dev

# 前端
cd frontend
pnpm dev

# 或使用 Docker
docker-compose up -d

```

### 生产环境部署

```bash
#### 1. 构建应用
```bash
# 构建所有应用
pnpm build

# 或分别构建
cd backend && pnpm build

cd frontend && pnpm build

```

#### 2. 使用 Docker 部署
```bash
# 构建生产镜像
docker-compose -f docker-compose.prod.yml build

# 启动生产服务
docker-compose -f docker-compose.prod.yml up -d
```

#### 3. 传统部署
- **后端**: 使用 PM2 管理进程

- **前端**: 部署到 Nginx 或其他 Web 服务器

- **数据库**: 使用云数据库服务或自建 PostgreSQL


#### 4. 环境变量配置

生产环境需要配置以下环境变量：
```env
# 数据库配置
DATABASE_URL=postgresql://user:password@host:port/database

# 应用配置
NODE_ENV=production
PORT=3000
```

```

## 💡 项目特性

- Monorepo 架构
- 前后端分离
- 现代前端框架
- 企业级后端框架
- 关系型数据库
- 类型安全
- Docker 容器化

## 📄 许可证

ISC License

---

*此文档由 README Updater 工具自动生成 - 2026-04-08*
