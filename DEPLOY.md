# Demo 项目 - 部署指南（简化版 v3.0）

## 🎯 快速开始（3步部署）

### 1️⃣ 配置环境变量
```bash
# 复制配置模板
cp .env.example .env

# 编辑配置文件
nano .env  # 填入你的服务器IP和数据库密码
```

**必填项：**
- `SERVER_IP` - 服务器公网IP
- `DB_PASSWORD` - 数据库密码（建议使用强密码）

### 2️⃣ 执行部署
```bash
# 方式一：使用配置文件（推荐）
chmod +x deploy.sh
sudo ./deploy.sh

# 方式二：命令行传参
sudo SERVER_IP=115.29.195.88 DB_PASSWORD=your_password ./deploy.sh
```

### 3️⃣ 验证服务
```bash
# 查看服务状态
cd /opt/demo && docker compose ps

# 查看日志
docker compose logs -f

# 访问测试
curl http://YOUR_SERVER_IP:80    # 前端
curl http://YOUR_SERVER_IP:3000  # 后端API
```

---

## 📁 文件说明

### 配置文件结构
```
project-root/
├── .env                          # 🔒 主配置文件（包含敏感信息，不提交Git）
├── .env.example                  # 📄 配置模板（可提交）
├── deploy.sh                     # 🚀 一键部署脚本（296行）
│
├── apps/
│   ├── backend/
│   │   ├── .env.local            # 🔒 后端配置（由脚本自动生成）
│   │   └── .env.local.example    # 📄 后端配置模板
│   └── frontend/
│       ├── .env.production       # 🔒 前端配置（由脚本自动生成）
│       └── .env.production.example  # 📄 前端配置模板
│
└── docker-compose.yml            # 基础Docker配置
    └── docker-compose.prod.yml   # 生产环境优化配置
```

### 环境变量优先级
```
命令行参数 > .env 文件 > 脚本默认值
```

---

## 🔧 常用操作

### 更新部署
```bash
cd /opt/demo
git pull
sudo ./deploy.sh
```

### 重启服务
```bash
cd /opt/demo
docker compose restart
```

### 停止服务
```bash
cd /opt/demo
docker compose down
```

### 查看日志
```bash
# 所有服务日志
docker compose logs -f

# 单个服务日志
docker compose logs -f backend
docker compose logs -f postgres
```

### 重置数据库（⚠️ 会丢失数据）
```bash
cd /opt/demo
docker compose down -v  # 删除数据卷
sudo ./deploy.sh        # 重新部署
```

---

## 🐛 故障排查

### 问题1: 部署失败 - 磁盘空间不足
```bash
# 检查磁盘空间
df -h /

# 清理Docker资源
docker system prune -a
```

### 问题2: 数据库连接失败
```bash
# 检查数据库容器状态
docker ps | grep postgres

# 查看数据库日志
docker logs demo-postgres

# 测试数据库连接
docker exec demo-postgres psql -U demo -d demo -c "SELECT 1"
```

### 问题3: 后端API无响应
```bash
# 检查后端容器状态
docker ps | grep backend

# 查看后端日志
docker logs demo-backend

# 手动测试API
curl -v http://localhost:3000/
```

### 问题4: 端口被占用
```bash
# 查找占用端口的进程
lsof -i :3000
lsof -i :80

# 杀掉进程或修改端口（在 .env 中修改 BACKEND_PORT/FRONTEND_PORT）
```

---

## 🔄 从旧版本迁移

如果你之前使用的是 v2.0 版本的部署脚本：

### ✅ 需要做的：
1. **删除旧配置文件**
   ```bash
   rm -f .secrets.env
   ```

2. **创建新配置**
   ```bash
   cp .env.example .env
   nano .env  # 从旧的 .secrets.env 复制配置值
   ```

3. **使用新脚本部署**
   ```bash
   sudo ./deploy.sh
   ```

### ❌ 不再需要的功能（已移除）：
- ~~钉钉通知~~ → 使用外部监控工具
- ~~防火墙自动配置~~ → 单独的安全脚本处理
- ~~备份/回滚机制~~ → 使用 Git 管理版本
- ~~复杂的日志系统~~ → 使用 Docker 日志 + journalctl
- ~~干跑模式~~ → 直接查看脚本逻辑即可
- ~~多环境staging~~ → 仅保留 development/production

---

## 📊 对比：v2.0 vs v3.0

| 特性 | v2.0 (旧版) | v3.0 (新版) |
|------|------------|------------|
| **代码行数** | 978 行 | **296 行 (-70%)** |
| **配置文件数** | 6 个 | **3 个 (-50%)** |
| **部署时间** | 5-10 分钟 | **3-5 分钟** |
| **失败率** | 较高（依赖多） | **低（简化流程）** |
| **维护难度** | 复杂 | **简单** |

---

## ⚙️ 高级配置

### 开发环境部署
```bash
# 修改 .env 文件
ENVIRONMENT=development

# 执行部署
sudo ./deploy.sh
```

### 自定义端口
```bash
# 在 .env 中修改
BACKEND_PORT=8080
FRONTEND_PORT=8888
```

### 使用自定义Git仓库
```bash
GIT_REPO=https://github.com/yourusername/your-repo.git sudo ./deploy.sh
```

---

## 🔒 安全建议

1. **数据库密码**：使用强密码（≥16位，包含大小写字母、数字、特殊字符）
2. **服务器安全**：定期更新系统 `apt update && apt upgrade`
3. **防火墙**：建议单独配置 UFW 或云厂商安全组
4. **备份**：定期备份数据库 `docker exec demo-postgres pg_dump -U demo demo > backup.sql`
5. **监控**：推荐使用 Prometheus + Grafana 监控服务状态

---

## 📞 技术支持

如遇到问题，请按以下顺序排查：
1. 查看部署日志中的错误信息
2. 运行 `docker compose logs` 查看容器日志
3. 检查本文档的"故障排查"章节
4. 查看项目 README.md 了解更多技术细节

---

**最后更新**: 2026-04-21
**适用版本**: deploy.sh v3.0+
