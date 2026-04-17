#!/bin/bash

set -e

echo "=========================================="
echo "  Demo 项目 - Linux 服务器一键部署脚本"
echo "=========================================="

PROJECT_DIR="/opt/demo"
GIT_REPO="https://github.com/jiangzhangxiang/sidereus-ai-demo.git"
SERVER_IP="115.29.195.88"
BACKEND_PORT=3000
FRONTEND_PORT=80

check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "❌ 请使用 root 用户执行此脚本"
        echo "   使用方式: sudo bash deploy.sh"
        exit 1
    fi
}

install_dependencies() {
    echo "📦 [1/6] 安装系统依赖..."

    echo "   → apt-get update..."
    if ! apt-get update -qq > /dev/null 2>&1; then
        echo "❌ 失败: apt-get update 执行失败"
        exit 1
    fi

    echo "   → 安装基础依赖 (curl, git, ca-certificates, gnupg, ufw)..."
    if ! apt-get install -y -qq curl git ca-certificates gnupg ufw > /dev/null 2>&1; then
        echo "❌ 失败: 安装基础依赖失败"
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        echo "   → Docker 未安装，开始安装..."

        echo "   → 创建 GPG 密钥目录..."
        if ! install -m 0755 -d /etc/apt/keyrings; then
            echo "❌ 失败: 创建 /etc/apt/keyrings 目录失败"
            exit 1
        fi

        echo "   → 下载 Docker GPG 密钥..."
        if ! curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/debian/gpg -o /etc/apt/keyrings/docker.asc; then
            echo "   → 阿里云镜像失败，尝试清华镜像..."
            if ! curl -fsSL https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/debian/gpg -o /etc/apt/keyrings/docker.asc; then
                echo "   → 清华镜像失败，尝试官方源..."
                if ! curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc; then
                    echo "❌ 失败: 所有 Docker GPG 密钥源均无法访问 (网络问题?)"
                    exit 1
                fi
            fi
        fi
        chmod a+r /etc/apt/keyrings/docker.asc

        echo "   → 添加 Docker APT 软件源..."
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://mirrors.aliyun.com/docker-ce/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

        echo "   → apt-get update (Docker 源)..."
        if ! apt-get update -qq > /dev/null 2>&1; then
            echo "❌ 失败: apt-get update (含 Docker 源) 执行失败"
            exit 1
        fi

        echo "   → 安装 Docker CE..."
        if ! apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin > /dev/null 2>&1; then
            echo "❌ 失败: Docker CE 安装失败 (可能源地址不匹配当前系统版本)"
            echo "   当前系统: $(cat /etc/os-release | grep PRETTY_NAME)"
            exit 1
        fi
    else
        echo "   → Docker 已安装，跳过"
    fi

    echo "   → 启用 Docker 服务..."
    systemctl enable docker > /dev/null 2>&1 || { echo "❌ 失败: systemctl enable docker"; exit 1; }
    systemctl start docker > /dev/null 2>&1 || { echo "❌ 失败: systemctl start docker"; exit 1; }

    echo "✅ 系统依赖安装完成"
}

clone_project() {
    echo "📂 [2/6] 克隆项目代码..."

    if [ -d "$PROJECT_DIR" ]; then
        cd "$PROJECT_DIR"
        git fetch origin main
        git reset --hard origin/main
        git clean -fd
    else
        git clone "$GIT_REPO" "$PROJECT_DIR"
        cd "$PROJECT_DIR"
    fi

    echo "✅ 项目代码准备完成"
}

configure_docker_mirror() {
    echo "🐳 [3.5/6] 配置 Docker 镜像加速..."

    mkdir -p /etc/docker

    cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me",
    "https://dockerpull.org"
  ]
}
EOF

    systemctl restart docker > /dev/null 2>&1

    echo "✅ Docker 配置完成"
}

configure_env() {
    echo "⚙️  [3/6] 配置环境变量..."

    # 设置数据库环境变量
    export POSTGRES_USER="demo"
    export POSTGRES_PASSWORD="demo_prod_2026"
    export POSTGRES_DB="demo"

    if [ ! -f "$PROJECT_DIR/apps/backend/.env.local" ]; then
        cp "$PROJECT_DIR/apps/backend/.env.production.template" "$PROJECT_DIR/apps/backend/.env.local"
        sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=demo_prod_2026|" "$PROJECT_DIR/apps/backend/.env.local"
        sed -i "s|DB_USERNAME=.*|DB_USERNAME=demo|" "$PROJECT_DIR/apps/backend/.env.local"
        sed -i "s|DB_DATABASE=.*|DB_DATABASE=demo|" "$PROJECT_DIR/apps/backend/.env.local"
        sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=http://${SERVER_IP}:${FRONTEND_PORT}|" "$PROJECT_DIR/apps/backend/.env.local"
        sed -i "s|DB_HOST=localhost|DB_HOST=postgres|" "$PROJECT_DIR/apps/backend/.env.local"
    fi

    if [ ! -f "$PROJECT_DIR/apps/frontend/.env.production" ]; then
        cp "$PROJECT_DIR/apps/frontend/.env.production.template" "$PROJECT_DIR/apps/frontend/.env.production"
        sed -i "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://${SERVER_IP}:${BACKEND_PORT}|" "$PROJECT_DIR/apps/frontend/.env.production"
    fi

    echo "✅ 环境变量配置完成"
}

build_and_start() {
    echo "🔨 [4/6] 构建 Docker 镜像..."

    cd "$PROJECT_DIR"

    # 停止所有容器（保留数据库卷以保护数据）
    docker compose -f docker-compose.yml -f docker-compose.prod.yml down

    # 检查是否首次部署（无 postgres_data 卷）
    if ! docker volume inspect demo_postgres_data &> /dev/null; then
        echo "📝 首次部署：将创建新的数据库卷"
    else
        echo "📝 更新部署：保留现有数据库数据"
        echo "   ⚠️  如需重置数据库，请手动执行: docker volume rm -f demo_postgres_data"
    fi

    docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

    echo "✅ Docker 镜像构建完成"
}

start_services() {
    echo "🚀 [5/6] 启动服务..."

    cd "$PROJECT_DIR"

    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

    sleep 15

    local all_healthy=true

    # 检查数据库服务
    local postgres_status=$(docker inspect --format='{{.State.Status}}' demo-postgres 2>/dev/null || echo "not_found")
    if [ "$postgres_status" != "running" ]; then
        echo "❌ 数据库容器状态: $postgres_status"
        all_healthy=false
    fi

    # 检查后端服务
    local backend_status=$(docker inspect --format='{{.State.Status}}' demo-backend 2>/dev/null || echo "not_found")
    if [ "$backend_status" = "running" ]; then
        sleep 5
        if ! curl -sf http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1 && \
           ! curl -sf http://localhost:${BACKEND_PORT}/api > /dev/null 2>&1 && \
           ! curl -sf http://localhost:${BACKEND_PORT} > /dev/null 2>&1; then
            sleep 10
            if ! curl -sf http://localhost:${BACKEND_PORT}/api > /dev/null 2>&1; then
                echo "❌ 后端 API 无法访问"
                all_healthy=false
            fi
        fi
    else
        echo "❌ 后端容器状态: $backend_status"
        all_healthy=false
    fi

    if [ "$all_healthy" = true ]; then
        echo "✅ 所有服务启动成功"
    else
        echo "❌ 部分服务启动失败，请检查日志"
        # 仅在失败时输出日志
        echo "容器状态："
        docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
        if [ "$postgres_status" != "running" ]; then
            echo "数据库日志："
            docker logs demo-postgres 2>&1 | tail -30
        fi
        if [ "$backend_status" != "running" ]; then
            echo "后端日志："
            docker logs demo-backend 2>&1 | tail -30
        fi
        exit 1
    fi
}

setup_firewall() {
    echo "🔒 [6/6] 配置防火墙..."

    ufw default deny incoming > /dev/null 2>&1
    ufw default allow outgoing > /dev/null 2>&1
    ufw allow ssh > /dev/null 2>&1
    ufw allow "${FRONTEND_PORT}/tcp" > /dev/null 2>&1
    ufw allow "${BACKEND_PORT}/tcp" > /dev/null 2>&1

    echo "y" | ufw enable > /dev/null 2>&1

    echo "✅ 防火墙配置完成"
}

show_result() {
    echo ""
    echo "=========================================="
    echo "  🎉 部署完成！"
    echo "=========================================="
    echo ""
    echo "  📍 访问地址:"
    echo "     前端: http://${SERVER_IP}:${FRONTEND_PORT}"
    echo "     后端: http://${SERVER_IP}:${BACKEND_PORT}"
    echo ""
    echo "  📋 常用命令:"
    echo "     查看日志:   docker compose -f ${PROJECT_DIR}/docker-compose.yml -f ${PROJECT_DIR}/docker-compose.prod.yml logs -f"
    echo "     重启服务:   docker compose -f ${PROJECT_DIR}/docker-compose.yml -f ${PROJECT_DIR}/docker-compose.prod.yml restart"
    echo "     停止服务:   docker compose -f ${PROJECT_DIR}/docker-compose.yml -f ${PROJECT_DIR}/docker-compose.prod.yml down"
    echo "     更新部署:   cd ${PROJECT_DIR} && git pull && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build"
    echo ""
    echo "  ⚠️  注意事项:"
    echo "     1. 数据库密码已自动设置为 demo_prod_2026（测试用）"
    echo "     2. 如需修改配置，编辑 ${PROJECT_DIR}/apps/backend/.env.local"
    echo "     3. 首次启动可能需要 1-2 分钟初始化数据库"
    echo ""
}

main() {
    check_root
    install_dependencies
    clone_project
    configure_docker_mirror
    configure_env
    build_and_start
    start_services
    setup_firewall
    show_result
}

main "$@"
