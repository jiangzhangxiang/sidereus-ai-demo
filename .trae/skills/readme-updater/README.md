# README Updater 使用指南

这个 README Updater 技能可以根据项目的实际结构和技术栈自动更新 README.md 文件。

## 🚀 使用方法

### 1. 直接运行更新脚本

```bash
# 在项目根目录运行
node .trae/skills/readme-updater/index.ts
```

### 2. 作为 Node.js 模块使用

```typescript
import { READMEUpdater } from './.trae/skills/readme-updater/index.ts';

const updater = new READMEUpdater();
updater.updateREADME(); // 更新 README
updater.previewChanges(); // 预览更改内容
```

### 3. 在 CI/CD 流程中使用

```yaml
# .github/workflows/update-readme.yml
name: Update README
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  update-readme:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install pnpm
        run: npm install -g pnpm
      - name: Install dependencies
        run: pnpm install
      - name: Update README
        run: node .trae/skills/readme-updater/index.ts
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add README.md
          git diff --staged --quiet || git commit -m "docs: update README based on project changes"
          git push
```

## 📊 功能特性

### 自动检测的项目信息
- 项目名称和版本
- Monorepo 或单应用类型
- 应用和包的目录结构
- 前端技术栈
- 后端技术栈
- 数据库技术
- 开发工具
- 项目脚本

### 智能文档生成
- 根据技术栈生成对应的技术说明
- 自动生成项目结构图
- 生成安装和部署指南
- 创建开发脚本说明
- 提供技术选型理由

### 安全特性
- 自动备份原有 README 文件
- 支持预览更改内容
- 提供详细的执行日志
- 错误处理和异常捕获

## 🛠️ 配置选项

### 自定义模板
你可以创建自定义模板文件来定制生成的 README 格式：

```typescript
class CustomREADMEUpdater extends READMEUpdater {
  generateREADME(projectInfo: ProjectInfo): string {
    // 自定义生成逻辑
    return customTemplate;
  }
}
```

### 项目类型支持
- **Monorepo**: 支持 pnpm workspace 管理的多项目
- **单应用**: 支持传统的单项目结构
- **混合架构**: 支持复杂的项目结构

## 🔧 依赖要求

- Node.js >= 18.0.0
- TypeScript >= 4.0.0
- fs 模块（Node.js 内置）
- path 模块（Node.js 内置）

## 📝 扩展功能

### 添加新的技术栈支持
```typescript
// 在 getTechDescription 方法中添加新的技术描述
private getTechDescription(tech: string, category: string): string {
  const customDescriptions = {
    'NewTech': {
      '前端': '新技术的描述',
      '后端': '新技术的后端描述'
    }
  };
  
  return customDescriptions[tech]?.[category] || `${tech} 技术`;
}
```

### 自定义项目特性检测
```typescript
// 在 extractProjectFeatures 方法中添加新的特性检测
private extractProjectFeatures(projectInfo: ProjectInfo) {
  const features = [];
  
  // 添加自定义特性检测
  if (this.hasCustomFeature(projectInfo)) {
    features.push('自定义特性');
  }
  
  projectInfo.features = features;
}
```

## 🚀 集成到开发流程

### 1. Git Hook 集成
```bash
# 创建 pre-commit hook
echo 'node .trae/skills/readme-updater/index.ts' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### 2. IDE 集成
在 VS Code 中创建任务：
```json
{
  "version": "2.0.0",
  "tasks": {
    "update-readme": {
      "label": "Update README",
      "type": "shell",
      "command": "node .trae/skills/readme-updater/index.ts",
      "group": "build"
    }
  }
}
```

## 🐛 故障排除

### 常见问题
1. **权限错误**: 确保有写入 README.md 文件的权限
2. **依赖缺失**: 确保 Node.js 和 TypeScript 已正确安装
3. **路径错误**: 确保在项目根目录下运行脚本

### 调试模式
```typescript
const updater = new READMEUpdater();
updater.previewChanges(); // 预览而不实际修改
```

## 📄 许可证

MIT License