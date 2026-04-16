#!/bin/bash

# ============================================
# Docker 环境管理脚本 (Linux/Mac)
# ============================================
# 用途：快速切换开发/生产环境、管理容器服务
#
# 使用方法:
#   ./docker-env.sh [命令] [环境]
#
# 命令:
#   start   - 启动服务
#   stop    - 停止服务
#   restart - 重启服务
#   logs    - 查看日志
#   status  - 查看状态
#   build   - 重新构建镜像
#   clean   - 清理容器和卷
#   shell   - 进入后端容器
#
# 环境:
#   dev     - 开发环境（默认）
#   prod    - 生产环境
#
# 示例:
#   ./docker-env.sh start dev        # 启动开发环境
#   ./docker-env.sh stop prod        # 停止生产环境
#   ./docker-env.sh logs backend     # 查看后端日志
#   ./docker-env.sh build frontend   # 重新构建前端镜像
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="demo"
COMPOSE_BASE="docker-compose.yml"
COMPOSE_DEV="docker-compose.dev.yml"
COMPOSE_PROD="docker-compose.prod.yml"

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取 compose 文件参数
get_compose_files() {
    local env=$1
    echo "-f ${COMPOSE_BASE} -f ${COMPOSE_${env^^}}"
}

# 检查 Docker 是否运行
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker 未运行，请先启动 Docker"
        exit 1
    fi
}

# 检查环境变量文件
check_env_file() {
    if [ ! -f "apps/backend/.env.local" ]; then
        print_warning "未找到 apps/backend/.env.local 文件"
        if [ -f "apps/backend/.env.production.template" ]; then
            print_info "正在从模板创建..."
            cp apps/backend/.env.production.template apps/backend/.env.local
            print_success "已创建 .env.local 文件，请根据需要修改配置"
        else
            print_error "未找到环境变量模板文件"
            exit 1
        fi
    fi
}

# 启动服务
cmd_start() {
    local env=${1:-dev}
    check_docker
    check_env_file

    print_info "启动 ${env} 环境..."
    local compose_files=$(get_compose_files $env)

    docker-compose $compose_files up -d

    if [ "$env" = "dev" ]; then
        print_success "✅ 开发环境已启动！"
        print_info "前端地址: http://localhost:5173"
        print_info "后端地址: http://localhost:3000"
        print_info "API 文档: http://localhost:3000/api/swagger"
        print_info "调试端口: 9229 (Node.js Inspector)"
    else
        print_success "✅ 生产环境已启动！"
        print_info "前端地址: http://localhost:80"
        print_info "后端地址: http://localhost:3000"
    fi
}

# 停止服务
cmd_stop() {
    local env=${1:-dev}
    check_docker

    print_info "停止 ${env} 环境..."
    local compose_files=$(get_compose_files $env)

    docker-compose $compose_files down
    print_success "✅ ${env} 环境已停止"
}

# 重启服务
cmd_restart() {
    local env=${1:-dev}
    cmd_stop $env
    sleep 2
    cmd_start $env
}

# 查看日志
cmd_logs() {
    local service=$1
    local env=${2:-dev}
    check_docker

    local compose_files=$(get_compose_files $env)

    if [ -z "$service" ]; then
        docker-compose $compose_files logs -f --tail=100
    else
        docker-compose $compose_files logs -f --tail=100 $service
    fi
}

# 查看状态
cmd_status() {
    local env=${1:-dev}
    check_docker

    print_info "=== ${env^^} 环境状态 ==="
    docker ps --filter "name=${PROJECT_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# 构建镜像
cmd_build() {
    local service=${1:-all}
    local env=${2:-dev}
    check_docker

    local compose_files=$(get_compose_files $env)

    print_info "重新构建 ${service} 镜像 (${env} 环境)..."

    if [ "$service" = "all" ]; then
        docker-compose $compose_files build --no-cache
    else
        docker-compose $compose_files build --no-cache $service
    fi

    print_success "✅ 镜像构建完成"
}

# 清理环境
cmd_clean() {
    local env=${1:-dev}
    check_docker

    print_warning "⚠️  即将清理 ${env} 环境的所有容器和数据卷！"
    read -p "确认继续？(y/N) " confirm

    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        local compose_files=$(get_compose_files $env)

        # 停止并删除容器和卷
        docker-compose $compose_files down -v --remove-orphans

        # 清理悬空镜像
        docker image prune -f

        print_success "✅ ${env} 环境清理完成"
    else
        print_info "操作已取消"
    fi
}

# 进入容器 Shell
cmd_shell() {
    local service=${1:-backend}
    local env=${2:-dev}
    check_docker

    local container_name="${PROJECT_NAME}-${env}-${service}"

    if docker ps | grep -q "$container_name"; then
        print_info "进入 ${container_name} 容器..."
        docker exec -it $container_name sh
    else
        print_error "容器 ${container_name} 未运行"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    echo ""
    echo "🐳 Docker 环境管理工具"
    echo ""
    echo "用法: $0 <命令> [参数] [环境]"
    echo ""
    echo "命令:"
    echo "  start   [env]      启动服务（默认: dev）"
    echo "  stop    [env]      停止服务"
    echo "  restart [env]      重启服务"
    echo "  logs    [svc] [env] 查看日志"
    echo "  status  [env]      查看状态"
    echo "  build   [svc] [env] 重新构建镜像"
    echo "  clean   [env]      清理环境"
    echo "  shell   [svc] [env] 进入容器"
    echo "  help               显示帮助"
    echo ""
    echo "环境:"
    echo "  dev               开发环境（默认）"
    echo "  prod              生产环境"
    echo ""
    echo "示例:"
    echo "  $0 start dev       # 启动开发环境"
    echo "  $0 stop prod       # 停止生产环境"
    echo "  $0 logs backend    # 查看后端日志"
    echo "  $0 shell backend   # 进入后端容器"
    echo ""
}

# 主入口
main() {
    local command=${1:-help}
    shift || true

    case $command in
        start)
            cmd_start $@
            ;;
        stop)
            cmd_stop $@
            ;;
        restart)
            cmd_restart $@
            ;;
        logs)
            cmd_logs $@
            ;;
        status)
            cmd_status $@
            ;;
        build)
            cmd_build $@
            ;;
        clean)
            cmd_clean $@
            ;;
        shell)
            cmd_shell $@
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

main $@
