# 后端服务 (backend)

候选人管理系统的 NestJS 后端应用，基于 Fastify 适配器 + TypeORM + PostgreSQL 技术栈。

## 项目概述

本后端服务是「全栈 Monorepo 候选人管理系统」的服务端部分，提供 RESTful API 接口，支持候选人 CRUD、岗位管理、智能匹配、简历上传与解析等核心功能。

## 模块结构

```
src/
├── candidates/          # 候选人模块
│   ├── candidate.entity.ts        # 候选人实体（JSONB 存储）
│   ├── education.entity.ts        # 教育经历实体
│   ├── work-experience.entity.ts  # 工作经历实体
│   ├── candidates.controller.ts   # REST 控制器
│   ├── candidates.service.ts      # 业务逻辑层
│   ├── candidates.module.ts       # 模块定义
│   └── dto/                       # 数据传输对象
├── jobs/                # 岗位管理模块
│   ├── job.entity.ts               # 岗位实体
│   ├── jobs.controller.ts          # REST 控制器
│   ├── jobs.service.ts             # 业务逻辑层
│   └── dto/job.dto.ts              # 岗位 DTO
├── match/               # 智能匹配模块
│   ├── match.controller.ts         # 匹配控制器
│   ├── match.service.ts            # 匹配算法服务
│   └── dto/match.dto.ts            # 匹配请求 DTO
├── file-upload/          # 文件上传模块
│   ├── file-upload.controller.ts   # 文件上传接口
│   ├── file-upload.service.ts      # 文件存储服务
│   └── resume-parser.service.ts    # PDF 简历解析服务
├── app.module.ts        # 根模块（数据库配置 / 模块注册）
└── main.ts              # 应用入口（Fastify 适配器）
```

## 技术栈

| 技术 | 用途 |
|------|------|
| NestJS 11 | 服务端框架 |
| Fastify | HTTP 适配器（高性能） |
| TypeORM 0.3 | ORM（PostgreSQL） |
| PostgreSQL 15 | 关系型数据库 |
| class-validator | DTO 校验 |
| @fastify/multipart | 文件上传处理 |
| pdf-parse | PDF 简历文本提取 |

## API 接口

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 候选人 | GET | `/candidates` | 获取候选人列表 |
| 候选人 | GET | `/candidates/:id` | 获取候选人详情 |
| 候选人 | POST | `/candidates` | 创建候选人 |
| 候选人 | PATCH | `/candidates/:id/status` | 更新候选人状态 |
| 岗位 | GET | `/jobs` | 获取岗位列表 |
| 岗位 | POST | `/jobs` | 创建岗位 |
| 匹配 | POST | `/match` | 执行人岗智能匹配 |
| 上传 | POST | `/upload/resume` | 上传并解析简历 PDF |

## 开发脚本

```bash
# 安装依赖
pnpm install

# 开发模式启动（热重载）
pnpm start:dev

# 构建生产版本
pnpm build

# 生产模式启动
pnpm start:prod

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 单元测试
pnpm test

# 测试覆盖率
pnpm test:cov

# E2E 测试
pnpm test:e2e
```

## 环境变量

在项目根目录创建 `.env.local` 文件：

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=demo
DB_PASSWORD=demo
DB_DATABASE=demo
```
