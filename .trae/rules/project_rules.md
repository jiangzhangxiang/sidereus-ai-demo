# 全栈 Monorepo 项目规范

## 1. 项目性质
- **项目类型**：面试 demo 项目，用于展示技术能力和代码风格。
- **技术栈原则**：在满足功能需求的前提下，技术栈应尽量简单，避免过度复杂的架构和依赖。

## 2. Monorepo 架构约束
- **包管理器**：必须使用 `pnpm`，严禁使用 `npm` 或 `yarn`。
- **目录结构**：
  - `apps/frontend`: React + Vite 应用
  - `apps/backend`: NestJS + Fastify 应用
  - `packages/shared`: 共享类型、工具函数
  - `docker-compose.yml`: PostgreSQL 本地服务

## 3. 前端技术规范 (React)
- **核心**：React 19 + TypeScript + Vite
- **代码风格**：使用函数组件和 Hooks，Props 必须定义 TypeScript 接口。
- **路由**：使用 React Router v6。
- **状态管理**：使用 Zustand。
- **UI 库**：使用 Ant Design。

## 4. 后端技术规范 (NestJS)
- **核心**：NestJS 10+ + Fastify 适配器 + TypeORM
- **架构**：遵循模块化设计 (`app.module`, `feature.module`)。
- **数据库**：TypeORM 连接 PostgreSQL，通过 `ConfigService` 管理环境变量。
- **API 风格**：RESTful API，使用 DTO 进行请求验证。

## 5. 数据库与 Docker
- **本地环境**：使用 Docker Compose 运行 PostgreSQL。
- **环境变量**：在后端 `.env.local` 文件中配置数据库连接信息，不提交至 Git。

## 6. API 规范
- RESTful API 规范