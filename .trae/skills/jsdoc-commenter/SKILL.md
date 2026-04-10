# Skill：JavaScript/Node.js 专业注释生成器

## 技能描述
本技能用于为 JavaScript/Node.js 代码添加高质量、符合行业规范的专业注释。注释将遵循 JSDoc 标准，侧重解释业务逻辑与设计意图，并统一文件结构说明。

## 适用场景
- 为已有代码补充或重构注释
- 新项目建立代码注释规范模板
- 生成 API 文档前的代码准备

---

## 注释规范细则

### 1. 文件头注释
每个 `.js` / `.mjs` / `.cjs` 文件开头必须包含以下结构：

```javascript
/**
 * @fileoverview 模块名称及简要描述
 * @description 详细说明该模块的核心职责、在系统中的位置以及主要交互对象。
 * @author 作者姓名 <邮箱> | 团队名称
 * @version 1.0.0
 * @license ISC
 */