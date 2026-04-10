/**
 * @fileoverview 数据库种子数据脚本
 * @description 用于初始化数据库的种子数据，向 candidates 表插入示例候选人记录。
 *              包含完整的候选人信息：基本信息、教育经历、工作经历、技能标签、评分明细等。
 *              通过 TypeORM DataSource 直接操作数据库，绕过 NestJS 应用层。
 * @module seed
 * @version 1.0.0
 */
import { Candidate } from '../src/candidates/candidate.entity';
import { Education } from '../src/candidates/education.entity';
import { WorkExperience } from '../src/candidates/work-experience.entity';
import { DataSource } from 'typeorm';

/** TypeORM 数据源配置，连接本地 PostgreSQL */
const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'demo',
  password: 'demo',
  database: 'demo',
  entities: [Candidate, Education, WorkExperience],
  synchronize: true,
});

/** 种子数据列表（示例候选人） */
const seedData = [
  {
    basicInfo: {
      name: '张三',
      phone: '13800138001',
      email: 'zhangsan@example.com',
      city: '北京',
    },
    education: [
      {
        school: '清华大学',
        major: '计算机科学与技术',
        degree: '硕士',
        graduationDate: '2022-06',
      },
    ],
    workExperience: [
      {
        company: '字节跳动',
        position: '高级前端工程师',
        period: '2022-07 至今',
        description:
          '负责抖音Web端核心业务开发，主导性能优化项目，将首屏加载时间降低40%',
      },
      {
        company: '阿里巴巴',
        position: '前端开发工程师',
        period: '2019-07 - 2022-06',
        description:
          '参与淘宝商家后台系统开发，负责组件库建设和工程化体系建设',
      },
    ],
    skills: ['React', 'TypeScript', 'Node.js', 'Webpack', '性能优化'],
    score: 92,
    scoreBreakdown: {
      technicalSkills: 95,
      experience: 90,
      education: 95,
      communication: 88,
      potential: 92,
    },
    status: 'interviewing',
    resumeUrl: '/resumes/zhangsan.pdf',
    uploadedAt: new Date('2026-04-01T10:30:00Z'),
  },
];

/**
 * 执行种子数据导入
 * 初始化数据库连接并逐条写入候选人数据
 */
async function seed() {
  await AppDataSource.initialize();
  console.log('✅ 数据库连接成功');

  const candidateRepo = AppDataSource.getRepository(Candidate);
  const educationRepo = AppDataSource.getRepository(Education);
  const workRepo = AppDataSource.getRepository(WorkExperience);

  for (const data of seedData) {
    const { education, workExperience, ...candidateData } = data;

    const candidate = new Candidate();
    Object.assign(candidate, candidateData);

    if (education && education.length > 0) {
      const eduEntities = educationRepo.create(education);
      eduEntities.forEach((edu) => (edu.candidate = candidate));
      candidate.education = eduEntities;
    }

    if (workExperience && workExperience.length > 0) {
      const workEntities = workRepo.create(workExperience);
      workEntities.forEach((work) => (work.candidate = candidate));
      candidate.workExperience = workEntities;
    }

    await candidateRepo.save(candidate);
    console.log(`✅ 已添加候选人: ${candidate.basicInfo.name}`);
  }

  console.log('\n🎉 种子数据导入完成！');
  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('❌ 种子数据导入失败:', error);
  process.exit(1);
});
