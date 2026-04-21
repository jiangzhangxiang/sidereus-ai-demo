#!/bin/sh
set -e

echo "🔄 检查必要的环境变量..."
if [ -z "$DB_PASSWORD" ]; then
  echo "❌ 错误: DB_PASSWORD 环境变量未设置"
  echo "   请在 docker-compose.yml 或 .env.local 中配置数据库密码"
  exit 1
fi
echo "   ✅ 环境变量检查通过"

echo "🔄 等待数据库就绪..."
until node -e "
const { Client } = require('pg');
const c = new Client({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'demo',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'demo',
});
c.connect().then(() => { c.end(); process.exit(0); }).catch((err) => { console.error('连接错误:', err.message); process.exit(1); });
"; do
  echo "   ⏳ 数据库未就绪，等待重试..."
  sleep 2
done
echo "   ✅ 数据库连接成功"

echo "🔄 同步数据库 Schema..."
node -e "
require('reflect-metadata');
const { DataSource } = require('typeorm');
const { Candidate } = require('./dist/candidates/candidate.entity');
const { Education } = require('./dist/candidates/education.entity');
const { WorkExperience } = require('./dist/candidates/work-experience.entity');
const { Job } = require('./dist/jobs/job.entity');

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'demo',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'demo',
  entities: [Candidate, Education, WorkExperience, Job],
  synchronize: true,
});
ds.initialize().then(() => {
  console.log('   ✅ 数据库 Schema 同步完成');
  return ds.destroy();
}).catch((err) => {
  console.error('❌ Schema 同步失败:', err.message);
  process.exit(1);
});
"

echo "🚀 启动后端服务..."
exec node dist/main
