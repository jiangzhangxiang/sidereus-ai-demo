#!/bin/bash

#===============================================================================
# 脚本名称: deploy.sh
# 功能描述: Demo项目Linux服务器一键部署脚本（云原生优化版）
# 作者: jiangzhangxiang
# 版本: v2.0.0
# 创建日期: 2026-04-17
# 更新日期: 2026-04-17
# 适用环境: Debian/Ubuntu + Docker CE
# 依赖项: bash 4.0+, curl, git, docker-ce, ufw
#
# 用法:
#   sudo bash deploy.sh [选项]
#
# 选项:
#   --env, -e <环境>        指定部署环境 (development|staging|production)，默认: production
#   --mode, -m <模式>       部署模式 (full|config-only|rollback)，默认: full
#   --dry-run               模拟运行，不执行实际操作
#   --verbose, -v           显示详细调试信息
#   --auto-approve          跳过交互确认（用于CI/CD自动化）
#   --help, -h              显示帮助信息
#
# 环境变量 (推荐通过 .env 文件或命令行传入):
#   SERVER_IP              服务器公网IP地址 (必填)
#   DB_PASSWORD            数据库密码 (必填，或通过 .secrets.env 配置)
#   DB_USERNAME            数据库用户名 (默认: demo)
#   DB_DATABASE            数据库名称 (默认: demo)
#   BACKEND_PORT           后端服务端口 (默认: 3000)
#   FRONTEND_PORT          前端服务端口 (默认: 80)
#   DINGTALK_WEBHOOK       钉钉机器人Webhook URL (可选，用于部署通知)
#
# 注意事项:
#   1. 必须使用 root 用户执行此脚本
#   2. 会修改系统防火墙规则 (UFW)，请确保SSH端口已放行
#   3. 数据库密码请勿硬编码在脚本中，建议通过环境变量或 .secrets.env 文件配置
#   4. 首次启动可能需要 1-2 分钟初始化数据库
#   5. 脚本会自动创建备份目录用于回滚
#
# 示例:
#   # 标准生产部署
#   sudo SERVER_IP=115.29.195.88 DB_PASSWORD=your_password bash deploy.sh
#
#   # 使用配置文件
#   sudo bash deploy.sh --env production
#
#   # 仅更新配置（不重新构建镜像）
#   sudo bash deploy.sh --mode config-only
#
#   # 回滚到上一版本
#   sudo bash deploy.sh --mode rollback
#
# 参考标准:
#   - CIS Docker Benchmark 1.3.0
#   - NIST Cybersecurity Framework
#   - 12-Factor App Methodology
#   - CNCF Cloud Native Definition v1.0
#===============================================================================

set -euo pipefail
IFS=$'\n\t'

#===============================================================================
# 全局变量与配置
#===============================================================================

SCRIPT_VERSION="v2.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/opt/demo"
GIT_REPO="${GIT_REPO:-https://github.com/jiangzhangxiang/sidereus-ai-demo.git}"
LOG_FILE="/var/log/demo-deploy.log"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

# 默认配置值（可通过环境变量覆盖）
SERVER_IP="${SERVER_IP:-}"
BACKEND_PORT="${BACKEND_PORT:-3000}"
FRONTEND_PORT="${FRONTEND_PORT:-80}"
DB_USERNAME="${DB_USERNAME:-demo}"
DB_DATABASE="${DB_DATABASE:-demo}"
DB_PASSWORD="${DB_PASSWORD:-}"

# 运行时状态变量
ENVIRONMENT="production"
DEPLOY_MODE="full"
DRY_RUN=false
VERBOSE=false
AUTO_APPROVE=false
COMPOSE_FILES=""
ALL_HEALTHY=true

#===============================================================================
# 日志系统
#===============================================================================

log() {
    local level="$1"
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local prefix=""
    local color=""

    case "$level" in
        "INFO")
            prefix="ℹ️  "
            color="\033[0;34m"
            ;;
        "SUCCESS")
            prefix="✅"
            color="\033[0;32m"
            ;;
        "WARNING")
            prefix="⚠️  "
            color="\033[0;33m"
            ;;
        "ERROR")
            prefix="❌"
            color="\033[0;31m"
            ;;
        "DEBUG")
            if [ "$VERBOSE" != "true" ]; then
                return 0
            fi
            prefix="🔍"
            color="\033[0;35m"
            ;;
        *)
            prefix="→"
            color="\033[0m"
            ;;
    esac

    echo -e "${color}${prefix} [${timestamp}] ${message}\033[0m"

    if mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null; then
        echo "[${timestamp}] [${level}] ${message}" >> "$LOG_FILE"
        chmod 640 "$LOG_FILE" 2>/dev/null || true
    fi
}

log_step() {
    local step_num="$1"
    local total="$2"
    local message="$3"
    log INFO "[${step_num}/${total}] ${message}"
}

#===============================================================================
# 错误处理机制
#===============================================================================

error_handler() {
    local line_number=$1
    local error_code=$2
    local command="${3:-unknown}"

    log ERROR "脚本在第 ${line_number} 行出错 (错误码: ${error_code})"
    log ERROR "执行的命令: ${command}"
    log ERROR "请检查日志文件: ${LOG_FILE}"

    if [ "$DEPLOY_MODE" = "full" ] && [ -d "${BACKUP_DIR}" ]; then
        log WARNING "检测到部署失败，可使用以下命令回滚:"
        log INFO "  sudo bash $0 --mode rollback"
    fi

    exit $error_code
}

trap 'error_handler ${LINENO} $? "${BASH_COMMAND}"' ERR

cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log WARNING "脚本异常退出，清理临时资源..."
    fi
    exit $exit_code
}

trap cleanup EXIT

#===============================================================================
# 参数解析
#===============================================================================

show_help() {
    head -55 "$0" | grep -E "^#" | sed 's/^#//'
    exit 0
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env|-e)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --mode|-m)
                DEPLOY_MODE="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                LOG_LEVEL="DEBUG"
                shift
                ;;
            --auto-approve)
                AUTO_APPROVE=true
                shift
                ;;
            --help|-h)
                show_help
                ;;
            *)
                log ERROR "未知参数: $1"
                show_help
                ;;
        esac
    done

    log DEBUG "参数解析完成: 环境=${ENVIRONMENT}, 模式=${DEPLOY_MODE}, 干跑=${DRY_RUN}"
}

#===============================================================================
# 输入验证
#===============================================================================

validate_inputs() {
    log INFO "执行输入参数验证..."
    local issues=0

    if [ -z "$SERVER_IP" ]; then
        log ERROR "未设置服务器IP地址 (SERVER_IP)"
        log INFO "设置方式: export SERVER_IP=115.29.195.88 或在 .secrets.env 中配置"
        ((issues++))
    elif ! [[ "$SERVER_IP" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        log ERROR "无效的IP地址格式: $SERVER_IP"
        ((issues++))
    fi

    if ! [[ "$BACKEND_PORT" =~ ^[0-9]+$ ]] || [ "$BACKEND_PORT" -lt 1 ] || [ "$BACKEND_PORT" -gt 65535 ]; then
        log ERROR "无效的后端端口: $BACKEND_PORT (有效范围: 1-65535)"
        ((issues++))
    fi

    if ! [[ "$FRONTEND_PORT" =~ ^[0-9]+$ ]] || [ "$FRONTEND_PORT" -lt 1 ] || [ "$FRONTEND_PORT" -gt 65535 ]; then
        log ERROR "无效的前端端口: $FRONTEND_PORT (有效范围: 1-65535)"
        ((issues++))
    fi

    if [[ ! "$GIT_REPO" =~ ^(https?|git):// ]]; then
        log ERROR "无效的Git仓库地址格式: $GIT_REPO"
        ((issues++))
    fi

    if [ -z "$DB_PASSWORD" ]; then
        log ERROR "未设置数据库密码 (DB_PASSWORD)"
        log INFO "安全配置方式（按优先级）:"
        log INFO "  1. 环境变量: export DB_PASSWORD=your_password"
        log INFO "  2. 配置文件: 在项目根目录创建 .secrets.env 文件"
        ((issues++))
    fi

    if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
        log ERROR "不支持的环境: $ENVIRONMENT (支持: development|staging|production)"
        ((issues++))
    fi

    if [ $issues -gt 0 ]; then
        log ERROR "发现 ${issues} 个验证错误，终止部署"
        exit 1
    fi

    log SUCCESS "输入参数验证通过"
}

#===============================================================================
# 安全配置加载
#===============================================================================

load_secure_config() {
    log INFO "加载安全配置..."

    local secrets_file="${SCRIPT_DIR}/.secrets.env"
    local system_secrets="/etc/demo/secrets.env"

    if [ -z "$DB_PASSWORD" ]; then
        if [ -f "$secrets_file" ]; then
            log INFO "从项目级配置文件加载: ${secrets_file}"
            set -a
            source "$secrets_file"
            set +a
        elif [ -f "$system_secrets" ]; then
            log INFO "从系统级配置文件加载: ${system_secrets}"
            set -a
            source "$system_secrets"
            set +a
        elif [ -t 0 ] && [ "$AUTO_APPROVE" != "true" ]; then
            log WARNING "未找到配置文件，进入交互式输入模式"
            read -s -p "请输入数据库密码: " DB_PASSWORD
            echo ""
            export DB_PASSWORD
        else
            log ERROR "非交互模式下无法获取数据库密码"
            exit 1
        fi
    fi

    if [ -z "$DB_PASSWORD" ]; then
        log ERROR "数据库密码仍未设置，终止部署"
        exit 1
    fi

    export POSTGRES_USER="$DB_USERNAME"
    export POSTGRES_PASSWORD="$DB_PASSWORD"
    export POSTGRES_DB="$DB_DATABASE"

    log SUCCESS "安全配置加载完成 (用户: ${DB_USERNAME}, 数据库: ${DB_DATABASE})"
    log DEBUG "密码长度: ${#DB_PASSWORD} 字符"
}

#===============================================================================
# 环境预检
#===============================================================================

pre_flight_check() {
    log_step 0 8 "执行部署前环境检查..."

    local issues=0

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "干跑模式：跳过环境检查"
        return 0
    fi

    local available_space=$(df -BG / | awk 'NR==2 {print $4}' | tr -d 'G' || echo "0")
    if [ "${available_space:-0}" -lt 10 ]; then
        log ERROR "磁盘空间不足: 仅剩 ${available_space}GB (需要 ≥10GB)"
        ((issues++))
    else
        log DEBUG "磁盘空间充足: ${available_space}GB"
    fi

    local total_mem=$(free -g 2>/dev/null | awk '/Mem:/ {print $2}' || echo "0")
    if [ "${total_mem:-0}" -lt 2 ]; then
        log WARNING "内存较低: ${total_mem}GB (推荐 ≥2GB，可能影响构建性能)"
    else
        log DEBUG "内存充足: ${total_mem}GB"
    fi

    if command -v ping &>/dev/null; then
        if ping -c 1 -W 3 github.com &>/dev/null; then
            log DEBUG "网络连通性正常 (github.com 可达)"
        else
            log WARNING "无法连接 github.com (网络问题? 将尝试备用源)"
        fi
    fi

    if netstat -tlnp 2>/dev/null | grep -q ":${BACKEND_PORT} "; then
        log WARNING "端口 ${BACKEND_PORT} 已被占用，部署后端可能会失败"
    fi

    if netstat -tlnp 2>/dev/null | grep -q ":${FRONTEND_PORT} "; then
        log WARNING "端口 ${FRONTEND_PORT} 已被占用，部署前端可能会失败"
    fi

    if ! command -v docker &>/dev/null && ! command -v apt-get &>/dev/null; then
        log ERROR "系统缺少 Docker 且无法自动安装 (需要 apt 包管理器)"
        ((issues++))
    fi

    if [ $issues -gt 0 ]; then
        log ERROR "发现 ${issues} 个环境问题，终止部署"
        exit 1
    fi

    log SUCCESS "环境预检通过"
}

#===============================================================================
# 权限检查
#===============================================================================

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log ERROR "请使用 root 用户执行此脚本"
        log INFO "使用方式: sudo bash $0"
        exit 1
    fi
    log DEBUG "权限验证通过 (当前用户: $(whoami), UID: $EUID)"
}

#===============================================================================
# 依赖安装
#===============================================================================

install_dependencies() {
    log_step 1 8 "安装系统依赖..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "干跑模式：跳过依赖安装"
        return 0
    fi

    log INFO "→ 执行 apt-get update..."
    if ! apt-get update -qq > /dev/null 2>&1; then
        log ERROR "apt-get update 执行失败"
        exit 1
    fi

    log INFO "→ 安装基础依赖 (curl, git, ca-certificates, gnupg, ufw)..."
    if ! apt-get install -y -qq curl git ca-certificates gnupg ufw > /dev/null 2>&1; then
        log ERROR "安装基础依赖失败"
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        log INFO "→ Docker 未安装，开始安装..."

        log INFO "→ 创建 GPG 密钥目录..."
        if ! install -m 0755 -d /etc/apt/keyrings; then
            log ERROR "创建 /etc/apt/keyrings 目录失败"
            exit 1
        fi

        log INFO "→ 下载 Docker GPG 密钥..."
        local gpg_downloaded=false
        for mirror in \
            "https://mirrors.aliyun.com/docker-ce/linux/debian/gpg" \
            "https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/debian/gpg" \
            "https://download.docker.com/linux/debian/gpg"; do
            log DEBUG "尝试镜像源: ${mirror}"
            if curl -fsSL "$mirror" -o /etc/apt/keyrings/docker.asc; then
                gpg_downloaded=true
                log INFO "→ GPG 密钥下载成功 (${mirror})"
                break
            fi
            log WARNING "镜像源失败: ${mirror}"
        done

        if [ "$gpg_downloaded" = "false" ]; then
            log ERROR "所有 Docker GPG 密钥源均无法访问 (网络问题?)"
            exit 1
        fi

        chmod a+r /etc/apt/keyrings/docker.asc

        log INFO "→ 添加 Docker APT 软件源..."
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://mirrors.aliyun.com/docker-ce/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

        log INFO "→ apt-get update (Docker 源)..."
        if ! apt-get update -qq > /dev/null 2>&1; then
            log ERROR "apt-get update (含 Docker 源) 执行失败"
            exit 1
        fi

        log INFO "→ 安装 Docker CE..."
        if ! apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin > /dev/null 2>&1; then
            log ERROR "Docker CE 安装失败 (可能源地址不匹配当前系统版本)"
            log INFO "当前系统: $(cat /etc/os-release | grep PRETTY_NAME)"
            exit 1
        fi
    else
        log INFO "→ Docker 已安装，跳过"
    fi

    log INFO "→ 启用 Docker 服务..."
    systemctl enable docker > /dev/null 2>&1 || { log ERROR "systemctl enable docker 失败"; exit 1; }
    systemctl start docker > /dev/null 2>&1 || { log ERROR "systemctl start docker 失败"; exit 1; }

    log SUCCESS "系统依赖安装完成"
}

#===============================================================================
# Docker镜像加速配置
#===============================================================================

configure_docker_mirror() {
    log_step 2 8 "配置 Docker 镜像加速..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "干跑模式：跳过Docker配置"
        return 0
    fi

    mkdir -p /etc/docker

    cat > /etc/docker/daemon.json << EOF
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me",
    "https://dockerpull.org"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  }
}
EOF

    chmod 644 /etc/docker/daemon.json

    log INFO "→ 重启 Docker 服务以应用新配置..."
    systemctl restart docker > /dev/null 2>&1

    log SUCCESS "Docker 镜像加速配置完成"
}

#===============================================================================
# 项目代码管理
#===============================================================================

clone_project() {
    log_step 3 8 "克隆/更新项目代码..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "干跑模式：跳过代码操作"
        return 0
    fi

    if [ -d "$PROJECT_DIR" ]; then
        cd "$PROJECT_DIR"
        log INFO "→ 项目目录已存在，更新代码..."
        git fetch origin main
        git reset --hard origin/main
        git clean -fd
    else
        log INFO "→ 克隆项目代码到 ${PROJECT_DIR}..."
        git clone "$GIT_REPO" "$PROJECT_DIR"
        cd "$PROJECT_DIR"
    fi

    log SUCCESS "项目代码准备完成 (分支: $(git branch --show-current), 提交: $(git rev-parse --short HEAD))"
}

#===============================================================================
# 环境变量配置
#===============================================================================

configure_env() {
    log_step 4 8 "配置环境变量..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "干跑模式：跳过环境配置"
        return 0
    fi

    local backend_env="${PROJECT_DIR}/apps/backend/.env.local"
    local frontend_env="${PROJECT_DIR}/apps/frontend/.env.production"
    local backend_template="${PROJECT_DIR}/apps/backend/.env.production.template"
    local frontend_template="${PROJECT_DIR}/apps/frontend/.env.production.template"

    if [ ! -f "$backend_env" ] && [ -f "$backend_template" ]; then
        log INFO "→ 生成后端环境配置..."
        cp "$backend_template" "$backend_env"
        sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" "$backend_env"
        sed -i "s|DB_USERNAME=.*|DB_USERNAME=${DB_USERNAME}|" "$backend_env"
        sed -i "s|DB_DATABASE=.*|DB_DATABASE=${DB_DATABASE}|" "$backend_env"
        sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=http://${SERVER_IP}:${FRONTEND_PORT}|" "$backend_env"
        sed -i "s|DB_HOST=localhost|DB_HOST=postgres|" "$backend_env"
        chmod 600 "$backend_env"
    else
        log INFO "→ 后端环境配置已存在，跳过生成"
    fi

    if [ ! -f "$frontend_env" ] && [ -f "$frontend_template" ]; then
        log INFO "→ 生成前端环境配置..."
        cp "$frontend_template" "$frontend_env"
        sed -i "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://${SERVER_IP}:${BACKEND_PORT}|" "$frontend_env"
        chmod 644 "$frontend_env"
    else
        log INFO "→ 前端环境配置已存在，跳过生成"
    fi

    log SUCCESS "环境变量配置完成"
}

#===============================================================================
# 备份与回滚机制
#===============================================================================

backup_current_deployment() {
    log INFO "备份当前部署版本..."

    if [ ! -d "$PROJECT_DIR" ]; then
        log DEBUG "项目目录不存在，跳过备份"
        return 0
    fi

    local current_backup="${BACKUP_DIR}/${TIMESTAMP}"
    mkdir -p "$current_backup"

    for file in docker-compose.yml docker-compose.prod.yml; do
        if [ -f "${PROJECT_DIR}/${file}" ]; then
            cp "${PROJECT_DIR}/${file}" "$current_backup/"
            log DEBUG "已备份: ${file}"
        fi
    done

    if [ -f "${PROJECT_DIR}/apps/backend/.env.local" ]; then
        cp "${PROJECT_DIR}/apps/backend/.env.local" "$current_backup/"
        log DEBUG "已备份: backend/.env.local"
    fi

    if docker compose -f "${PROJECT_DIR}/docker-compose.yml" -f "${PROJECT_DIR}/docker-compose.prod.yml" ps &>/dev/null 2>&1; then
        docker compose -f "${PROJECT_DIR}/docker-compose.yml" -f "${PROJECT_DIR}/docker-compose.prod.yml" images > "$current_backup/images.txt" 2>/dev/null || true
        log DEBUG "已记录当前镜像信息"
    fi

    echo "$current_backup" > "${PROJECT_DIR}/.last_backup"

    ls -dt ${BACKUP_DIR}/* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true

    log SUCCESS "备份完成: ${current_backup}"
}

rollback_deployment() {
    log WARNING "开始回滚到上一版本..."

    local last_backup=""
    if [ -f "${PROJECT_DIR}/.last_backup" ]; then
        last_backup=$(cat "${PROJECT_DIR}/.last_backup")
    else
        last_backup=$(ls -dt ${BACKUP_DIR}/* 2>/dev/null | head -1)
    fi

    if [ -z "$last_backup" ] || [ ! -d "$last_backup" ]; then
        log ERROR "没有找到可用的备份，无法回滚"
        exit 1
    fi

    log INFO "使用备份: ${last_backup}"

    cd "$PROJECT_DIR"

    docker compose -f docker-compose.yml -f docker-compose.prod.yml down 2>/dev/null || true

    for file in docker-compose.yml docker-compose.prod.yml apps/backend/.env.local; do
        if [ -f "${last_backup}/${file##*/}" ]; then
            cp "${last_backup}/${file##*/}" "${PROJECT_DIR}/${file}"
            log INFO "已恢复: ${file}"
        fi
    done

    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

    sleep 15

    log SUCCESS "回滚完成，正在验证服务状态..."
    verify_services_health
}

#===============================================================================
# 构建与启动
#===============================================================================

build_and_start() {
    log_step 5 8 "构建并启动 Docker 服务..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "干跑模式：跳过构建启动"
        return 0
    fi

    setup_compose_files

    if [ "$DEPLOY_MODE" = "full" ]; then
        backup_current_deployment
    fi

    cd "$PROJECT_DIR"

    log INFO "→ 停止现有容器（保留数据卷）..."
    docker compose $COMPOSE_FILES down 2>/dev/null || true

    if ! docker volume inspect demo_postgres_data &> /dev/null; then
        log INFO "首次部署：将创建新的数据库卷"
    else
        log INFO "更新部署：保留现有数据库数据"
        log WARNING "如需重置数据库，请手动执行: docker volume rm -f demo_postgres_data"
    fi

    if [ "$DEPLOY_MODE" = "full" ]; then
        log INFO "→ 构建 Docker 镜像 (无缓存)..."
        docker compose $COMPOSE_FILES build --no-cache
    fi

    log INFO "→ 启动所有服务..."
    docker compose $COMPOSE_FILES up -d

    log SUCCESS "Docker 服务启动完成"
}

setup_compose_files() {
    COMPOSE_FILES="-f ${PROJECT_DIR}/docker-compose.yml"

    case "$ENVIRONMENT" in
        development)
            # 开发环境仅使用基础配置
            ;;
        staging)
            if [ -f "${PROJECT_DIR}/docker-compose.staging.yml" ]; then
                COMPOSE_FILES="${COMPOSE_FILES} -f ${PROJECT_DIR}/docker-compose.staging.yml"
            fi
            ;;
        production)
            if [ -f "${PROJECT_DIR}/docker-compose.prod.yml" ]; then
                COMPOSE_FILES="${COMPOSE_FILES} -f ${PROJECT_DIR}/docker-compose.prod.yml"
            fi
            ;;
    esac

    log DEBUG "Compose 文件配置: ${COMPOSE_FILES}"
}

#===============================================================================
# 服务健康检查
#===============================================================================

wait_for_service() {
    local service_name="$1"
    local max_attempts="${2:-30}"
    local attempt=0

    log INFO "等待 ${service_name} 服务就绪..."

    while [ $attempt -lt $max_attempts ]; do
        if docker inspect --format='{{.State.Status}}' "${service_name}" 2>/dev/null | grep -q "running"; then
            log INFO "${service_name} 容器已运行"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done

    log ERROR "${service_name} 在 ${max_attempts} 次尝试后仍未就绪"
    return 1
}

verify_services_health() {
    log_step 6 8 "验证服务健康状态..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "干跑模式：跳过健康检查"
        return 0
    fi

    sleep 15
    ALL_HEALTHY=true

    log INFO "→ 检查数据库服务 (demo-postgres)..."
    local postgres_status=$(docker inspect --format='{{.State.Status}}' demo-postgres 2>/dev/null || echo "not_found")
    if [ "$postgres_status" != "running" ]; then
        log ERROR "数据库容器状态异常: ${postgres_status}"
        ALL_HEALTHY=false
    else
        log SUCCESS "数据库服务正常运行"
    fi

    log INFO "→ 检查后端服务 (demo-backend)..."
    local backend_status=$(docker inspect --format='{{.State.Status}}' demo-backend 2>/dev/null || echo "not_found")
    if [ "$backend_status" = "running" ]; then
        sleep 5
        local api_healthy=false
        for endpoint in "/api/health" "/api" "/"; do
            if curl -sf "http://localhost:${BACKEND_PORT}${endpoint}" > /dev/null 2>&1; then
                api_healthy=true
                break
            fi
        done

        if [ "$api_healthy" = "false" ]; then
            sleep 10
            if curl -sf "http://localhost:${BACKEND_PORT}/api" > /dev/null 2>&1; then
                api_healthy=true
            fi
        fi

        if [ "$api_healthy" = "true" ]; then
            log SUCCESS "后端API健康检查通过"
        else
            log ERROR "后端API无法访问"
            ALL_HEALTHY=false
        fi
    else
        log ERROR "后端容器状态异常: ${backend_status}"
        ALL_HEALTHY=false
    fi

    log INFO "→ 检查前端服务 (demo-frontend)..."
    local frontend_status=$(docker inspect --format='{{.State.Status}}' demo-frontend 2>/dev/null || echo "not_found")
    if [ "$frontend_status" = "running" ]; then
        sleep 3
        if curl -sf "http://localhost:${FRONTEND_PORT}" > /dev/null 2>&1; then
            log SUCCESS "前端服务健康检查通过"
        else
            log WARNING "前端容器运行中但HTTP无响应（可能是SPA初始化中）"
        fi
    else
        log WARNING "前端容器状态: ${frontend_status}（可能未定义该服务）"
    fi

    if [ "$ALL_HEALTHY" = "false" ]; then
        log ERROR "部分服务健康检查失败"
        log INFO "容器状态："
        docker compose $COMPOSE_FILES ps 2>/dev/null || true

        if [ "$postgres_status" != "running" ]; then
            log ERROR "数据库日志（最后30行）："
            docker logs demo-postgres 2>&1 | tail -30 || true
        fi

        if [ "$backend_status" != "running" ]; then
            log ERROR "后端日志（最后30行）："
            docker logs demo-backend 2>&1 | tail -30 || true
        fi

        exit 1
    fi

    log SUCCESS "所有核心服务健康检查通过"
}

#===============================================================================
# 防火墙配置
#===============================================================================

setup_firewall() {
    log_step 7 8 "配置防火墙..."

    if [ "$DRY_RUN" = "true" ]; then
        log INFO "干跑模式：跳过防火墙配置"
        return 0
    fi

    local ssh_port=$(ss -tlnp 2>/dev/null | grep sshd | awk '{print $4}' | cut -d':' -f2 | head -1)
    ssh_port=${ssh_port:-22}

    log WARNING "即将配置UFW防火墙规则:"
    log INFO "  - 允许入站: SSH(${ssh_port}), HTTP(${FRONTEND_PORT}), API(${BACKEND_PORT})"
    log INFO "  - 默认拒绝其他入站连接"

    if [ "$AUTO_APPROVE" != "true" ] && [ -t 0 ]; then
        read -p "是否继续配置防火墙? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            log INFO "跳过防火墙配置"
            return 0
        fi
    fi

    ufw default deny incoming > /dev/null 2>&1
    ufw default allow outgoing > /dev/null 2>&1
    ufw allow "${ssh_port}/tcp" comment 'SSH Access' > /dev/null 2>&1
    ufw limit "${ssh_port}/tcp" > /dev/null 2>&1
    ufw allow "${FRONTEND_PORT}/tcp" comment 'Frontend HTTP' > /dev/null 2>&1
    ufw allow "${BACKEND_PORT}/tcp" comment 'Backend API' > /dev/null 2>&1

    ufw --force enable > /dev/null 2>&1

    log SUCCESS "防火墙配置完成 (SSH端口 ${ssh_port} 已放行)"
}

#===============================================================================
# 结果展示
#===============================================================================

show_result() {
    local git_commit=""
    local git_branch=""

    if [ -d "$PROJECT_DIR" ] && command -v git &>/dev/null; then
        cd "$PROJECT_DIR" && git rev-parse --short HEAD 2>/dev/null && git_branch=$(git branch --show-current 2>/dev/null)
    fi

    echo ""
    echo "=========================================="
    echo "  🎉 部署完成！"
    echo "=========================================="
    echo ""
    echo "  📋 部署信息:"
    echo "     版本: ${git_commit:-N/A} (${git_branch:-N/A})"
    echo "     时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "     环境: ${ENVIRONMENT}"
    echo "     模式: ${DEPLOY_MODE}"
    echo ""
    echo "  📍 访问地址:"
    echo "     前端: http://${SERVER_IP}:${FRONTEND_PORT}"
    echo "     后端: http://${SERVER_IP}:${BACKEND_PORT}"
    echo ""
    echo "  🔧 常用命令:"
    echo "     查看日志:   docker compose ${COMPOSE_FILES} logs -f"
    echo "     重启服务:   docker compose ${COMPOSE_FILES} restart"
    echo "     停止服务:   docker compose ${COMPOSE_FILES} down"
    echo "     回滚版本:   sudo bash $0 --mode rollback"
    echo "     更新部署:   cd ${PROJECT_DIR} && git pull && sudo bash $0"
    echo ""
    echo "  ⚠️  注意事项:"
    echo "     1. 数据库用户: ${DB_USERNAME}, 数据库: ${DB_DATABASE}"
    echo "     2. 如需修改配置，编辑 ${PROJECT_DIR}/apps/backend/.env.local"
    echo "     3. 首次启动可能需要 1-2 分钟初始化数据库"
    echo "     4. 备份目录: ${BACKUP_DIR}"
    echo ""

    send_notification "部署成功" "Demo项目 ${ENVIRONMENT} 环境部署成功\n版本: ${git_commit:-N/A}\n时间: $(date '+%Y-%m-%d %H:%M:%S')"
}

#===============================================================================
# 通知机制
#===============================================================================

send_notification() {
    local title="$1"
    local message="$2"

    if [ -n "${DINGTALK_WEBHOOK+x}" ]; then
        local payload=$(cat <<EOF
{
    "msgtype": "markdown",
    "markdown": {
        "title": "${title}",
        "text": "## ${title}\n\n${message}\n\n> 服务器: ${SERVER_IP}\n> 环境: ${ENVIRONMENT}\n> 时间: $(date '+%Y-%m-%d %H:%M:%S')"
    }
}
EOF
)

        if curl -s -X POST "${DINGTALK_WEBHOOK}" \
            -H 'Content-Type: application/json' \
            -d "$payload" > /dev/null 2>&1; then
            log INFO "已发送钉钉通知"
        else
            log WARNING "钉钉通知发送失败"
        fi
    fi
}

#===============================================================================
# 主函数
#===============================================================================

main() {
    echo "=========================================="
    echo "  Demo 项目 - Linux 服务器一键部署脚本"
    echo "  版本: ${SCRIPT_VERSION}"
    echo "=========================================="
    echo ""

    parse_args "$@"

    if [ "$DEPLOY_MODE" = "rollback" ]; then
        check_root
        load_secure_config
        rollback_deployment
        show_result
        return 0
    fi

    check_root
    validate_inputs
    load_secure_config
    pre_flight_check
    install_dependencies
    configure_docker_mirror
    clone_project
    configure_env
    build_and_start
    verify_services_health
    setup_firewall
    show_result
}

main "$@"
