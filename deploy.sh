#!/bin/bash
#===============================================================================
# Demo 项目 - 简化部署脚本
#===============================================================================
# 用法:
#   ./deploy.sh              # 使用 .env 配置文件
#   SERVER_IP=x.x.x.x DB_PASSWORD=xxx ./deploy.sh  # 命令行传参
#
# 流程: 检查环境 → 安装依赖 → 拉取代码 → 生成配置 → 构建启动 → 验证服务
#===============================================================================

set -euo pipefail

#-----------------------------------------------------------------------------#
# 配置区域
#-----------------------------------------------------------------------------#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/opt/demo"
GIT_REPO="${GIT_REPO:-https://github.com/jiangzhangxiang/sidereus-ai-demo.git}"

# 默认值（可通过环境变量或 .env 文件覆盖）
SERVER_IP="${SERVER_IP:-}"
DB_USERNAME="${DB_USERNAME:-demo}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_DATABASE="${DB_DATABASE:-demo}"
BACKEND_PORT="${BACKEND_PORT:-3000}"
FRONTEND_PORT="${FRONTEND_PORT:-80}"
ENVIRONMENT="${ENVIRONMENT:-production}"

#-----------------------------------------------------------------------------#
# 工具函数
#-----------------------------------------------------------------------------#

log() {
    local type="$1"; shift
    local timestamp=$(date '+%H:%M:%S')
    case "$type" in
        INFO)    echo -e "\033[34mℹ️  [${timestamp}] $*\033[0m" ;;
        SUCCESS) echo -e "\033[32m✅ [${timestamp}] $*\033[0m" ;;
        WARNING) echo -e "\033[33m⚠️  [${timestamp}] $*\033[0m" ;;
        ERROR)   echo -e "\033[31m❌ [${timestamp}] $*\033[0m" >&2 ;;
    esac
}

die() {
    log ERROR "$@"
    exit 1
}

#-----------------------------------------------------------------------------#
# 步骤 1: 加载配置
#-----------------------------------------------------------------------------#

load_config() {
    log INFO "加载环境配置..."

    # 优先级：命令行 > .env 文件 > 默认值
    if [[ -f "${SCRIPT_DIR}/.env" ]]; then
        log INFO "发现 .env 配置文件，正在加载..."
        set -a; source "${SCRIPT_DIR}/.env"; set +a
    fi

    # 必填项检查
    [[ -z "$SERVER_IP" ]]   && die "未设置 SERVER_IP（服务器IP地址）"
    [[ -z "$DB_PASSWORD" ]] && die "未设置 DB_PASSWORD（数据库密码）"

    # 导出给 Docker Compose 使用
    export POSTGRES_USER="$DB_USERNAME"
    export POSTGRES_PASSWORD="$DB_PASSWORD"
    export POSTGRES_DB="$DB_DATABASE"
    export SERVER_IP BACKEND_PORT FRONTEND_PORT ENVIRONMENT

    log SUCCESS "配置加载完成 (环境: ${ENVIRONMENT}, IP: ${SERVER_IP})"
}

#-----------------------------------------------------------------------------#
# 步骤 2: 环境检查
#-----------------------------------------------------------------------------#

check_environment() {
    log INFO "检查运行环境..."

    # 权限检查
    [[ "$EUID" -ne 0 ]] && die "请使用 root 用户执行: sudo $0"

    # 磁盘空间（需要 ≥5GB）
    local free_space=$(df -BG / | awk 'NR==2 {print $4}' | tr -d 'G')
    (( free_space < 5 )) && die "磁盘空间不足 (${free_space}GB < 5GB)"

    # Docker 检查
    if ! command -v docker &>/dev/null; then
        log WARNING "Docker 未安装，开始自动安装..."
        install_docker
    fi

    log SUCCESS "环境检查通过"
}

#-----------------------------------------------------------------------------#
# 步骤 3: 安装 Docker（如需要）
#-----------------------------------------------------------------------------#

install_docker() {
    log INFO "安装 Docker CE..."

    apt-get update -qq
    apt-get install -y -qq curl git ca-certificates gnupg

    # 检测操作系统类型（Debian 或 Ubuntu）
    local os_id="$(. /etc/os-release && echo "$ID")"
    local os_codename="$(. /etc/os-release && echo "$VERSION_CODENAME")"
    log INFO "检测到系统: ${os_id} (${os_codename})"

    # 根据系统选择对应的 Docker 源
    local docker_repo_url=""
    case "$os_id" in
        ubuntu)
            docker_repo_url="https://mirrors.aliyun.com/docker-ce/linux/ubuntu"
            ;;
        debian)
            docker_repo_url="https://mirrors.aliyun.com/docker-ce/linux/debian"
            ;;
        *)
            log WARNING "未知系统 (${os_id})，使用 Docker 官方源"
            docker_repo_url="https://download.docker.com/linux/${os_id}"
            ;;
    esac

    # 安装 GPG 密钥
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL "${docker_repo_url}/gpg" -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc

    # 添加 Docker 软件源（使用阿里云镜像加速）
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
        ${docker_repo_url} ${os_codename} stable" | \
        tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

    systemctl enable docker && systemctl start docker

    log SUCCESS "Docker 安装完成"
}

#-----------------------------------------------------------------------------#
# 步骤 4: 准备项目代码
#-----------------------------------------------------------------------------#

prepare_code() {
    log INFO "准备项目代码..."

    if [[ -d "$PROJECT_DIR" ]]; then
        cd "$PROJECT_DIR"
        log INFO "更新现有代码..."
        git fetch origin main && git reset --hard origin/main
    else
        log INFO "克隆项目仓库..."
        git clone "$GIT_REPO" "$PROJECT_DIR"
        cd "$PROJECT_DIR"
    fi

    log SUCCESS "代码准备完成 ($(git rev-parse --short HEAD))"
}

#-----------------------------------------------------------------------------#
# 步骤 5: 生成环境变量文件
#-----------------------------------------------------------------------------#

generate_env_files() {
    log INFO "生成应用配置文件..."

    # 后端配置
    local backend_env="${PROJECT_DIR}/apps/backend/.env.local"
    cat > "$backend_env" <<EOF
NODE_ENV=${ENVIRONMENT}
PORT=3000

DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=${DB_DATABASE}

CORS_ORIGIN=http://${SERVER_IP}:${FRONTEND_PORT}

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
EOF
    chmod 600 "$backend_env"
    log INFO "✓ 已生成 ${backend_env}"

    # 前端配置
    local frontend_env="${PROJECT_DIR}/apps/frontend/.env.production"
    cat > "$frontend_env" <<EOF
VITE_API_BASE_URL=http://${SERVER_IP}:${BACKEND_PORT}
EOF
    chmod 644 "$frontend_env"
    log INFO "✓ 已生成 ${frontend_env}"

    log SUCCESS "配置文件生成完成"
}

#-----------------------------------------------------------------------------#
# 步骤 6: 构建并启动服务
#-----------------------------------------------------------------------------#

deploy_services() {
    log INFO "构建并启动 Docker 服务..."

    cd "$PROJECT_DIR"

    # 选择 Compose 文件
    local compose_files="-f docker-compose.yml"
    if [[ "$ENVIRONMENT" == "production" ]] && [[ -f "docker-compose.prod.yml" ]]; then
        compose_files+=" -f docker-compose.prod.yml"
    elif [[ "$ENVIRONMENT" == "development" ]] && [[ -f "docker-compose.dev.yml" ]]; then
        compose_files+=" -f docker-compose.dev.yml"
    fi

    # 停止旧容器
    docker compose $compose_files down 2>/dev/null || true

    # 构建并启动
    log INFO "构建 Docker 镜像..."
    docker compose $compose_files build --no-cache

    log INFO "启动所有服务..."
    docker compose $compose_files up -d

    log SUCCESS "服务启动完成"
}

#-----------------------------------------------------------------------------#
# 步骤 7: 健康检查
#-----------------------------------------------------------------------------#

health_check() {
    log INFO "执行健康检查..."

    sleep 20  # 等待服务启动

    local all_ok=true

    # 检查数据库
    if docker inspect --format='{{.State.Status}}' demo-postgres 2>/dev/null | grep -q "running"; then
        log SUCCESS "✓ 数据库运行正常"
    else
        log ERROR "✗ 数据库启动失败"
        docker logs demo-postgres 2>&1 | tail -20
        all_ok=false
    fi

    # 检查后端 API
    if curl -sf "http://localhost:${BACKEND_PORT}/api" > /dev/null 2>&1; then
        log SUCCESS "✓ 后端 API 正常响应"
    else
        log ERROR "✗ 后端 API 无响应"
        docker logs demo-backend 2>&1 | tail -20
        all_ok=false
    fi

    # 检查前端
    if curl -sf "http://localhost:${FRONTEND_PORT}" > /dev/null 2>&1; then
        log SUCCESS "✓ 前端服务正常"
    else
        log WARNING "⚠ 前端无响应（可能仍在初始化）"
    fi

    [[ "$all_ok" == "false" ]] && die "健康检查失败，请查看上方日志"
}

#-----------------------------------------------------------------------------#
# 结果展示
#-----------------------------------------------------------------------------#

show_result() {
    echo ""
    echo "=========================================="
    echo "  🎉 部署成功！"
    echo "=========================================="
    echo ""
    echo "  📍 访问地址:"
    echo "     前端: http://${SERVER_IP}:${FRONTEND_PORT}"
    echo "     后端: http://${SERVER_IP}:${BACKEND_PORT}"
    echo ""
    echo "  🔧 常用命令:"
    echo "     查看日志: cd ${PROJECT_DIR} && docker compose logs -f"
    echo "     重启服务: cd ${PROJECT_DIR} && docker compose restart"
    echo "     停止服务: cd ${PROJECT_DIR} && docker compose down"
    echo "     更新版本: cd ${PROJECT_DIR} && git pull && ./deploy.sh"
    echo ""
}

#-----------------------------------------------------------------------------#
# 主流程
#-----------------------------------------------------------------------------#

main() {
    echo "=========================================="
    echo "  Demo 项目一键部署脚本 v3.0 (简化版)"
    echo "=========================================="
    echo ""

    load_config          # 1. 加载配置
    check_environment    # 2. 环境检查
    prepare_code         # 3. 准备代码
    generate_env_files   # 4. 生成配置
    deploy_services      # 5. 构建启动
    health_check         # 6. 健康验证
    show_result          # 7. 展示结果
}

main "$@"
