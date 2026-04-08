import * as fs from 'fs';
import path from 'path';

interface ProjectInfo {
  name: string;
  description: string;
  version: string;
  type: 'monorepo' | 'single-app';
  technologies: {
    frontend: string[];
    backend: string[];
    devTools: string[];
    database: string[];
  };
  scripts: {
    [key: string]: string;
  };
  directories: {
    apps: string[];
    packages: string[];
    docs?: string[];
  };
  features: string[];
}

class READMEUpdater {
  private projectRoot: string;
  private readmePath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.readmePath = path.join(projectRoot, 'README.md');
  }

  /**
   * 分析项目结构并获取项目信息
   */
  analyzeProject(): ProjectInfo {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const pnpmWorkspacePath = path.join(this.projectRoot, 'pnpm-workspace.yaml');
    
    let projectInfo: ProjectInfo = {
      name: '',
      description: '',
      version: '',
      type: 'single-app',
      technologies: {
        frontend: [],
        backend: [],
        devTools: [],
        database: []
      },
      scripts: {},
      directories: {
        apps: [],
        packages: []
      },
      features: []
    };

    // 读取根目录 package.json
    if (fs.existsSync(packageJsonPath)) {
      const rootPackage = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      projectInfo.name = rootPackage.name || 'demo';
      projectInfo.description = rootPackage.description || '全栈 Monorepo 项目';
      projectInfo.version = rootPackage.version || '1.0.0';
      projectInfo.scripts = rootPackage.scripts || {};
    }

    // 检查是否是 Monorepo
    if (fs.existsSync(pnpmWorkspacePath)) {
      projectInfo.type = 'monorepo';
      const workspaceContent = fs.readFileSync(pnpmWorkspacePath, 'utf-8');
      const appsMatch = workspaceContent.match(/- 'apps\/\*'/);
      const packagesMatch = workspaceContent.match(/- 'packages\/\*'/);
      
      if (appsMatch) {
        projectInfo.directories.apps = this.scanAppsDirectory();
      }
      if (packagesMatch) {
        projectInfo.directories.packages = this.scanPackagesDirectory();
      }
    }

    // 分析各个应用的技术栈
    if (projectInfo.type === 'monorepo') {
      this.analyzeMonorepoTechnologies(projectInfo);
    } else {
      this.analyzeSingleAppTechnologies(projectInfo);
    }

    // 提取项目特性
    this.extractProjectFeatures(projectInfo);

    return projectInfo;
  }

  /**
   * 扫描 apps 目录
   */
  private scanAppsDirectory(): string[] {
    const appsDir = path.join(this.projectRoot, 'apps');
    if (!fs.existsSync(appsDir)) return [];
    
    return fs.readdirSync(appsDir, { withFileTypes: true })
      .filter((dirent: fs.Dirent) => dirent.isDirectory())
      .map((dirent: fs.Dirent) => dirent.name);
  }

  /**
   * 扫描 packages 目录
   */
  private scanPackagesDirectory(): string[] {
    const packagesDir = path.join(this.projectRoot, 'packages');
    if (!fs.existsSync(packagesDir)) return [];
    
    return fs.readdirSync(packagesDir, { withFileTypes: true })
      .filter((dirent: fs.Dirent) => dirent.isDirectory())
      .map((dirent: fs.Dirent) => dirent.name);
  }

  /**
   * 分析 Monorepo 技术栈
   */
  private analyzeMonorepoTechnologies(projectInfo: ProjectInfo) {
    const apps = this.scanAppsDirectory();
    
    apps.forEach(app => {
      const appPackagePath = path.join(this.projectRoot, 'apps', app, 'package.json');
      if (fs.existsSync(appPackagePath)) {
        const appPackage = JSON.parse(fs.readFileSync(appPackagePath, 'utf-8'));
        
        // 分析前端技术栈
        if (appPackage.dependencies?.['react'] || appPackage.dependencies?.['vue']) {
          projectInfo.technologies.frontend.push(app);
          if (appPackage.dependencies?.['react']) {
            projectInfo.technologies.frontend.push('React');
          }
          if (appPackage.dependencies?.['vue']) {
            projectInfo.technologies.frontend.push('Vue');
          }
          if (appPackage.dependencies?.['react-router-dom']) {
            projectInfo.technologies.frontend.push('React Router');
          }
          if (appPackage.dependencies?.['zustand']) {
            projectInfo.technologies.frontend.push('Zustand');
          }
          if (appPackage.dependencies?.['antd']) {
            projectInfo.technologies.frontend.push('Ant Design');
          }
        }
        
        // 分析后端技术栈
        if (appPackage.dependencies?.['@nestjs/core'] || appPackage.dependencies?.['express']) {
          projectInfo.technologies.backend.push(app);
          if (appPackage.dependencies?.['@nestjs/core']) {
            projectInfo.technologies.backend.push('NestJS');
          }
          if (appPackage.dependencies?.['express']) {
            projectInfo.technologies.backend.push('Express');
          }
          if (appPackage.dependencies?.['fastify']) {
            projectInfo.technologies.backend.push('Fastify');
          }
          if (appPackage.dependencies?.['typeorm']) {
            projectInfo.technologies.backend.push('TypeORM');
          }
        }
        
        // 分析数据库
        if (appPackage.dependencies?.['pg'] || appPackage.dependencies?.['mongoose']) {
          projectInfo.technologies.database.push(app);
          if (appPackage.dependencies?.['pg']) {
            projectInfo.technologies.database.push('PostgreSQL');
          }
          if (appPackage.dependencies?.['mongoose']) {
            projectInfo.technologies.database.push('MongoDB');
          }
        }
        
        // 分析开发工具
        if (appPackage.devDependencies?.['vite']) {
          projectInfo.technologies.devTools.push('Vite');
        }
        if (appPackage.devDependencies?.['typescript']) {
          projectInfo.technologies.devTools.push('TypeScript');
        }
        if (appPackage.devDependencies?.['eslint']) {
          projectInfo.technologies.devTools.push('ESLint');
        }
        if (appPackage.devDependencies?.['prettier']) {
          projectInfo.technologies.devTools.push('Prettier');
        }
      }
    });
    
    // 去重
    Object.keys(projectInfo.technologies).forEach(key => {
      projectInfo.technologies[key as keyof typeof projectInfo.technologies] = 
        [...new Set(projectInfo.technologies[key as keyof typeof projectInfo.technologies])];
    });
  }

  /**
   * 分析单应用技术栈
   */
  private analyzeSingleAppTechnologies(projectInfo: ProjectInfo) {
    // 这里可以添加单应用项目的分析逻辑
  }

  /**
   * 提取项目特性
   */
  private extractProjectFeatures(projectInfo: ProjectInfo) {
    const features = [];
    
    if (projectInfo.type === 'monorepo') {
      features.push('Monorepo 架构');
      features.push('前后端分离');
    }
    
    if (projectInfo.technologies.frontend.includes('React')) {
      features.push('现代前端框架');
    }
    
    if (projectInfo.technologies.backend.includes('NestJS')) {
      features.push('企业级后端框架');
    }
    
    if (projectInfo.technologies.database.includes('PostgreSQL')) {
      features.push('关系型数据库');
    }
    
    if (projectInfo.technologies.devTools.includes('TypeScript')) {
      features.push('类型安全');
    }
    
    if (fs.existsSync(path.join(this.projectRoot, 'docker-compose.yml'))) {
      features.push('Docker 容器化');
    }
    
    projectInfo.features = features;
  }

  /**
   * 生成 README 内容
   */
  generateREADME(projectInfo: ProjectInfo): string {
    const currentDate = new Date().toISOString().split('T')[0];
    
    return `# ${projectInfo.name}

${projectInfo.description}

## 📋 项目概述

本项目是一个面试 demo 项目，旨在展示现代前端和后端开发的技术能力、架构设计和最佳实践。项目采用 ${projectInfo.type === 'monorepo' ? 'Monorepo' : '单应用'} 架构，实现了前后端分离的开发模式，并遵循 RESTful API 设计规范。

## 🏗️ 项目架构

### 项目结构
\`\`\`
${projectInfo.name}/
${projectInfo.type === 'monorepo' ? `
├── apps/                    # 应用程序目录
│   ${projectInfo.directories.apps.length > 0 ? projectInfo.directories.apps.map(app => `├── ${app}/            # ${this.getAppDescription(app)}`).join('\n│   ') : ''}
├── packages/               # 共享包目录
│   ${projectInfo.directories.packages.length > 0 ? projectInfo.directories.packages.map(pkg => `├── ${pkg}/            # ${this.getPackageDescription(pkg)}`).join('\n│   ') : ''}
└── docker-compose.yml      # Docker 服务编排
` : `
├── src/                    # 源代码目录
└── dist/                   # 构建输出目录
`}
└── package.json            # 项目配置
\`\`\`

### 应用架构

${this.generateArchitectureSection(projectInfo)}

## 🛠️ 技术选型及理由

### 前端技术栈

${this.generateTechTable(projectInfo.technologies.frontend, '前端')}

### 后端技术栈

${this.generateTechTable(projectInfo.technologies.backend, '后端')}

### 开发工具

${this.generateTechTable(projectInfo.technologies.devTools, '开发工具')}

### 数据库

${this.generateTechTable(projectInfo.technologies.database, '数据库')}

## 🚀 本地开发环境搭建指南

### 前置要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **Docker**: >= 20.0.0 (可选，用于数据库服务)

### 安装步骤

#### 1. 克隆项目
\`\`\`bash
git clone <repository-url>
cd ${projectInfo.name}
\`\`\`

#### 2. 安装依赖
\`\`\`bash
# 安装 pnpm (如果尚未安装)
npm install -g pnpm

# 安装项目依赖
pnpm install
\`\`\`

${this.generateDatabaseSetup(projectInfo)}

#### 3. 启动开发服务器

${this.generateDevServerSetup(projectInfo)}

### 开发脚本

${this.generateScriptsSection(projectInfo)}

## 🚀 部署方式说明

### 开发环境部署

\`\`\`bash
${this.generateDevDeployment(projectInfo)}
\`\`\`

### 生产环境部署

\`\`\`bash
${this.generateProdDeployment(projectInfo)}
\`\`\`

## 💡 项目特性

${projectInfo.features.map(feature => `- ${feature}`).join('\n')}

## 📄 许可证

ISC License

---

*此文档由 README Updater 工具自动生成 - ${currentDate}*
`;
  }

  /**
   * 获取应用描述
   */
  private getAppDescription(app: string): string {
    const descriptions: { [key: string]: string } = {
      'backend': 'NestJS 后端应用',
      'frontend': 'React 前端应用',
      'admin': '管理后台应用',
      'mobile': '移动端应用',
      'api': 'API 网关服务'
    };
    return descriptions[app] || `${app} 应用`;
  }

  /**
   * 获取包描述
   */
  private getPackageDescription(pkg: string): string {
    const descriptions: { [key: string]: string } = {
      'shared': '共享类型和工具函数',
      'utils': '工具函数库',
      'types': '类型定义',
      'constants': '常量定义',
      'hooks': '自定义 Hooks'
    };
    return descriptions[pkg] || `${pkg} 包`;
  }

  /**
   * 生成架构部分
   */
  private generateArchitectureSection(projectInfo: ProjectInfo): string {
    if (projectInfo.type === 'monorepo') {
      let sections = '';
      
      if (projectInfo.technologies.frontend.length > 0) {
        sections += `#### 前端架构 (${projectInfo.directories.apps.find(app => projectInfo.technologies.frontend.includes(app)) || 'frontend'})
- **框架**: ${projectInfo.technologies.frontend.filter(tech => ['React', 'Vue'].includes(tech)).join(' + ')}
- **状态管理**: ${projectInfo.technologies.frontend.includes('Zustand') ? 'Zustand (轻量级状态管理)' : 'Redux/Context API'}
- **路由**: ${projectInfo.technologies.frontend.includes('React Router') ? 'React Router v6' : 'Vue Router'}
- **UI 库**: ${projectInfo.technologies.frontend.includes('Ant Design') ? 'Ant Design (企业级 UI 组件库)' : 'Material-UI/Element UI'}
- **构建工具**: ${projectInfo.technologies.devTools.includes('Vite') ? 'Vite (快速的前端构建工具)' : 'Webpack'}

`;
      }
      
      if (projectInfo.technologies.backend.length > 0) {
        sections += `#### 后端架构 (${projectInfo.directories.apps.find(app => projectInfo.technologies.backend.includes(app)) || 'backend'})
- **框架**: ${projectInfo.technologies.backend.filter(tech => ['NestJS', 'Express'].includes(tech)).join(' + ')}
- **HTTP 服务器**: ${projectInfo.technologies.backend.includes('Fastify') ? 'Fastify (高性能 HTTP 服务器)' : 'Express'}
- **数据库**: ${projectInfo.technologies.database.join(' + ')}
- **ORM**: ${projectInfo.technologies.backend.includes('TypeORM') ? 'TypeORM (TypeScript ORM)' : 'Sequelize/Mongoose'}
- **架构模式**: 模块化设计，遵循 DDD (领域驱动设计) 原则
- **API 设计**: RESTful API，使用 DTO 进行请求验证

`;
      }
      
      if (projectInfo.directories.packages.length > 0) {
        sections += `#### 共享包 (${projectInfo.directories.packages.join(', ')})
- **功能**: 提供前后端共享的类型定义、工具函数
- **类型安全**: 确保前后端数据结构的一致性
- **代码复用**: 避免重复代码，提高开发效率

`;
      }
      
      return sections;
    }
    
    return '单应用项目架构说明';
  }

  /**
   * 生成技术栈表格
   */
  private generateTechTable(technologies: string[], category: string): string {
    if (technologies.length === 0) {
      return `暂无${category}技术栈`;
    }
    
    const tableHeader = `| 技术 | 用途 |
|------|------|`;
    
    const tableRows = technologies.map(tech => {
      const description = this.getTechDescription(tech, category);
      return `| **${tech}** | ${description} |`;
    }).join('\n');
    
    return `${tableHeader}\n${tableRows}`;
  }

  /**
   * 获取技术描述
   */
  private getTechDescription(tech: string, category: string): string {
    const descriptions: { [key: string]: { [key: string]: string } } = {
      'React': {
        '前端': '最流行的前端框架，拥有丰富的生态系统和社区支持',
        '开发工具': '构建用户界面的 JavaScript 库'
      },
      'Vue': {
        '前端': '渐进式 JavaScript 框架，易学易用',
        '开发工具': '构建用户界面的渐进式框架'
      },
      'NestJS': {
        '后端': '基于 Express 的 Node.js 框架，采用 TypeScript，架构清晰',
        '开发工具': '企业级 Node.js 框架'
      },
      'Express': {
        '后端': '快速、极简的 Node.js Web 框架',
        '开发工具': 'Node.js Web 应用框架'
      },
      'Fastify': {
        '后端': '高性能的 HTTP 框架，性能优于 Express，适合生产环境',
        '开发工具': '快速且低开销的 Web 框架'
      },
      'TypeScript': {
        '前端': '提供静态类型检查，提高代码质量和开发体验',
        '后端': '提供静态类型检查，提高代码质量和开发体验',
        '开发工具': 'JavaScript 的超集，添加了静态类型'
      },
      'Vite': {
        '前端': '快速的构建工具，热更新速度快，开发体验优秀',
        '开发工具': '快速的前端构建工具'
      },
      'Webpack': {
        '开发工具': '模块打包工具，功能强大但配置复杂'
      },
      'ESLint': {
        '开发工具': '代码质量检查，确保代码风格一致'
      },
      'Prettier': {
        '开发工具': '代码格式化工具，保持代码风格统一'
      },
      'Zustand': {
        '前端': '轻量级状态管理库，API 简洁，学习成本低'
      },
      'React Router': {
        '前端': '官方路由解决方案，功能完善，社区活跃'
      },
      'Ant Design': {
        '前端': '企业级 UI 组件库，组件丰富，设计规范统一'
      },
      'TypeORM': {
        '后端': 'TypeScript 的 ORM 框架，支持多种数据库，类型安全'
      },
      'PostgreSQL': {
        '数据库': '开源的关系型数据库，功能强大，性能稳定'
      },
      'MongoDB': {
        '数据库': '开源的 NoSQL 数据库，灵活的文档存储'
      }
    };
    
    return descriptions[tech]?.[category] || `${tech} 技术`;
  }

  /**
   * 生成数据库设置
   */
  private generateDatabaseSetup(projectInfo: ProjectInfo): string {
    if (projectInfo.technologies.database.length === 0) {
      return '';
    }
    
    return `#### 3. 启动数据库服务
\`\`\`bash
# 使用 Docker Compose 启动 PostgreSQL
docker-compose up -d

# 或手动安装 PostgreSQL 并创建数据库
# 数据库配置：
# Host: localhost
# Port: 5432
# Database: demo
# Username: demo
# Password: demo
\`\`\`;

#### 4. 配置环境变量
在 \`${projectInfo.directories.apps[0] || 'src'}\` 目录下创建 \`.env.local\` 文件：
\`\`\`env
# 数据库配置
DATABASE_URL=postgresql://demo:demo@localhost:5432/demo

# 应用配置
PORT=3000
\`\`\`;
`;
  }

  /**
   * 生成开发服务器设置
   */
  private generateDevServerSetup(projectInfo: ProjectInfo): string {
    let setup = '';
    
    if (projectInfo.technologies.backend.length > 0) {
      setup += `**启动后端服务：**
\`\`\`bash
cd ${projectInfo.directories.apps.find(app => projectInfo.technologies.backend.includes(app)) || 'backend'}
pnpm start:dev
\`\`\`

`;
    }
    
    if (projectInfo.technologies.frontend.length > 0) {
      setup += `**启动前端服务：**
\`\`\`bash
cd ${projectInfo.directories.apps.find(app => projectInfo.technologies.frontend.includes(app)) || 'frontend'}
pnpm dev
\`\`\`

`;
    }
    
    setup += `#### 5. 访问应用
${projectInfo.technologies.frontend.length > 0 ? `- **前端**: http://localhost:5173\n` : ''}
${projectInfo.technologies.backend.length > 0 ? `- **后端**: http://localhost:3000\n` : ''}

`;
    
    return setup;
  }

  /**
   * 生成脚本部分
   */
  private generateScriptsSection(projectInfo: ProjectInfo): string {
    let scripts = '';
    
    if (projectInfo.type === 'monorepo') {
      scripts += `**根目录脚本：**
\`\`\`bash
pnpm install          # 安装所有依赖
${projectInfo.scripts.test ? `pnpm test             # 运行所有测试\n` : ''}
${projectInfo.scripts.lint ? `pnpm lint             # 代码检查\n` : ''}
${projectInfo.scripts.format ? `pnpm format           # 代码格式化\n` : ''}
\`\`\`

`;
    }
    
    // 后端脚本
    if (projectInfo.technologies.backend.length > 0) {
      const backendApp = projectInfo.directories.apps.find(app => projectInfo.technologies.backend.includes(app));
      if (backendApp) {
        scripts += `**${backendApp} 脚本：**
\`\`\`bash
cd apps/${backendApp}
pnpm start:dev        # 启动开发服务器
pnpm build            # 构建生产版本
${projectInfo.scripts.test ? `pnpm test:e2e         # 运行端到端测试\n` : ''}
\`\`\`

`;
      }
    }
    
    // 前端脚本
    if (projectInfo.technologies.frontend.length > 0) {
      const frontendApp = projectInfo.directories.apps.find(app => projectInfo.technologies.frontend.includes(app));
      if (frontendApp) {
        scripts += `**${frontendApp} 脚本：**
\`\`\`bash
cd apps/${frontendApp}
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
${projectInfo.scripts.preview ? `pnpm preview          # 预览生产版本\n` : ''}
\`\`\`
`;
      }
    }
    
    return scripts;
  }

  /**
   * 生成开发部署
   */
  private generateDevDeployment(projectInfo: ProjectInfo): string {
    let deployment = '';
    
    if (projectInfo.technologies.backend.length > 0) {
      deployment += `# 后端
cd ${projectInfo.directories.apps.find(app => projectInfo.technologies.backend.includes(app)) || 'backend'}
pnpm start:dev

`;
    }
    
    if (projectInfo.technologies.frontend.length > 0) {
      deployment += `# 前端
cd ${projectInfo.directories.apps.find(app => projectInfo.technologies.frontend.includes(app)) || 'frontend'}
pnpm dev

`;
    }
    
    if (fs.existsSync(path.join(this.projectRoot, 'docker-compose.yml'))) {
      deployment += `# 或使用 Docker
docker-compose up -d
`;
    }
    
    return deployment;
  }

  /**
   * 生成生产部署
   */
  private generateProdDeployment(projectInfo: ProjectInfo): string {
    let deployment = '';
    
    deployment += `#### 1. 构建应用
\`\`\`bash
# 构建所有应用
pnpm build

# 或分别构建
${projectInfo.technologies.backend.length > 0 ? `cd ${projectInfo.directories.apps.find(app => projectInfo.technologies.backend.includes(app)) || 'backend'} && pnpm build\n` : ''}
${projectInfo.technologies.frontend.length > 0 ? `cd ${projectInfo.directories.apps.find(app => projectInfo.technologies.frontend.includes(app)) || 'frontend'} && pnpm build\n` : ''}
\`\`\`

`;
    
    if (fs.existsSync(path.join(this.projectRoot, 'docker-compose.yml'))) {
      deployment += `#### 2. 使用 Docker 部署
\`\`\`bash
# 构建生产镜像
docker-compose -f docker-compose.prod.yml build

# 启动生产服务
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

`;
    }
    
    deployment += `#### 3. 传统部署
${projectInfo.technologies.backend.length > 0 ? `- **后端**: 使用 PM2 管理进程\n` : ''}
${projectInfo.technologies.frontend.length > 0 ? `- **前端**: 部署到 Nginx 或其他 Web 服务器\n` : ''}
${projectInfo.technologies.database.length > 0 ? `- **数据库**: 使用云数据库服务或自建 PostgreSQL\n` : ''}

#### 4. 环境变量配置

生产环境需要配置以下环境变量：
\`\`\`env
# 数据库配置
DATABASE_URL=postgresql://user:password@host:port/database

# 应用配置
NODE_ENV=production
PORT=3000
\`\`\`
`;
    
    return deployment;
  }

  /**
   * 更新 README 文件
   */
  updateREADME(): void {
    try {
      const projectInfo = this.analyzeProject();
      const newContent = this.generateREADME(projectInfo);
      
      // 检查文件是否存在，如果存在则备份
      if (fs.existsSync(this.readmePath)) {
        const backupPath = path.join(this.projectRoot, 'README.backup.md');
        fs.copyFileSync(this.readmePath, backupPath);
      }
      
      // 写入新内容
      fs.writeFileSync(this.readmePath, newContent, 'utf-8');
      
      console.log(`✅ README.md 已成功更新！`);
      console.log(`📊 项目统计：`);
      console.log(`   - 应用数量: ${projectInfo.directories.apps.length}`);
      console.log(`   - 包数量: ${projectInfo.directories.packages.length}`);
      console.log(`   - 前端技术: ${projectInfo.technologies.frontend.length}`);
      console.log(`   - 后端技术: ${projectInfo.technologies.backend.length}`);
      console.log(`   - 数据库: ${projectInfo.technologies.database.join(', ') || '无'}`);
      
    } catch (error) {
      console.error('❌ 更新 README.md 时出错:', error);
      throw error;
    }
  }

  /**
   * 预览更改内容
   */
  previewChanges(): void {
    try {
      const projectInfo = this.analyzeProject();
      const newContent = this.generateREADME(projectInfo);
      
      console.log('📝 README.md 预览内容：');
      console.log('='.repeat(50));
      console.log(newContent);
      console.log('='.repeat(50));
      
    } catch (error) {
      console.error('❌ 预览更改时出错:', error);
      throw error;
    }
  }
}

// 导出技能类
export { READMEUpdater };

// 如果直接运行此脚本，执行更新操作
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 开始执行 README 更新...');
  const updater = new READMEUpdater();
  console.log('✅ READMEUpdater 实例创建成功');
  updater.updateREADME();
}