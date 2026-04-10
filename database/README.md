# 数据库表结构说明

> 导出时间：2026-04-10
> 数据库：PostgreSQL 15
> 数据库名：demo

## 概述

本数据库包含 4 张核心表，用于支持候选人管理系统的数据存储需求。

---

## 表结构详情

### 1. candidate（候选人表）

存储候选人的基本信息、技能标签、评分和状态。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY, NOT NULL | 候选人唯一标识 |
| basicInfo | JSONB | NOT NULL | 基本信息（姓名、电话、邮箱、城市） |
| skills | TEXT[] | NOT NULL, DEFAULT '{}' | 技能标签数组 |
| score | NUMERIC(3,0) | NOT NULL, DEFAULT 0 | 综合评分（0-100） |
| scoreBreakdown | JSONB | NOT NULL | 评分明细（5个维度） |
| status | ENUM | NOT NULL, DEFAULT 'pending' | 状态（pending/screened/interviewing/hired/rejected） |
| resumeUrl | VARCHAR | NOT NULL | 简历文件 URL |
| notes | VARCHAR | NULLABLE | 备注信息 |
| uploadedAt | TIMESTAMP | NOT NULL, DEFAULT now() | 创建时间 |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：主键索引（id）

---

### 2. education（教育经历表）

存储候选人的教育背景信息，与 candidate 表为一对多关系。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY, NOT NULL | 教育记录唯一标识 |
| school | VARCHAR | NOT NULL | 学校名称 |
| major | VARCHAR | NOT NULL | 专业 |
| degree | VARCHAR | NOT NULL | 学历层次 |
| graduationDate | VARCHAR | NOT NULL | 毕业时间 |
| candidateId | UUID | FOREIGN KEY | 关联的候选人 ID |

**外键约束**：
- `candidateId` → `candidate.id` (ON DELETE CASCADE)

---

### 3. work_experience（工作经历表）

存储候选人的工作经历信息，与 candidate 表为一对多关系。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY, NOT NULL | 工作记录唯一标识 |
| company | VARCHAR | NOT NULL | 公司名称 |
| position | VARCHAR | NOT NULL | 职位 |
| period | VARCHAR | NOT NULL | 工作时间段 |
| description | VARCHAR | NOT NULL | 工作描述 |
| candidateId | UUID | FOREIGN KEY | 关联的候选人 ID |

**外键约束**：
- `candidateId` → `candidate.id` (ON DELETE CASCADE)

---

### 4. job（岗位表）

存储招聘岗位的需求信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY, NOT NULL | 岗位唯一标识 |
| title | VARCHAR(50) | NOT NULL | 岗位名称 |
| description | TEXT | NOT NULL | 岗位描述 |
| required_skills | TEXT[] | NOT NULL, DEFAULT '{}' | 必备技能列表 |
| plus_skills | TEXT[] | NOT NULL, DEFAULT '{}' | 加分技能列表 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：主键索引（id）

---

## 枚举类型

### candidate_status_enum

```sql
CREATE TYPE candidate_status_enum AS ENUM (
    'pending',      -- 待筛选
    'screened',     -- 初筛通过
    'interviewing', -- 面试中
    'hired',        -- 已录用
    'rejected'      -- 已淘汰
);
```

---

## 扩展依赖

### uuid-ossp

用于生成 UUID 主键值。

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 关系图

```
candidate (1)
    ├── (N) education      [candidateId → id, CASCADE DELETE]
    └── (N) work_experience [candidateId → id, CASCADE DELETE]

job (独立表，无外键关联)
```

---

## 部署注意事项

1. **初始化顺序**：先创建扩展 → 创建枚举类型 → 创建表 → 添加外键约束
2. **字符集**：使用 UTF-8 编码
3. **时区**：timestamp 使用不带时区的类型（timestamp without time zone）
4. **JSONB 字段**：basicInfo 和 scoreBreakdown 使用 JSONB 类型，支持高效查询
5. **数组字段**：skills、required_skills、plus_skills 使用 PostgreSQL 数组类型

---

## 完整 SQL 脚本

详细的建表 SQL 语句请参考同目录下的 [schema.sql](./schema.sql) 文件。
