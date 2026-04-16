#!/bin/bash

echo "=========================================="
echo "  Demo 项目 - 服务器诊断脚本"
echo "=========================================="
echo ""

PROJECT_DIR="${1:-/opt/demo}"

echo "📂 项目目录: $PROJECT_DIR"
echo ""

check_docker() {
    echo "🐳 [1/6] 检查 Docker 状态..."
    
    if ! command -v docker &> /dev/null; then
        echo "   ❌ Docker 未安装"
        return 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        echo "   ❌ Docker 服务未运行"
        return 1
    fi
    
    echo "   ✅ Docker 运行正常"
    echo "   版本: $(docker --version)"
    return 0
}

check_containers() {
    echo ""
    echo "📦 [2/6] 检查容器状态..."
    
    cd "$PROJECT_DIR" 2>/dev/null || {
        echo "   ❌ 项目目录不存在: $PROJECT_DIR"
        return 1
    }
    
    if [ ! -f "docker-compose.prod.yml" ]; then
        echo "   ❌ docker-compose.prod.yml 不存在"
        return 1
    fi
    
    echo "   容器列表："
    docker compose -f docker-compose.yml -f docker-compose.prod.yml ps -a 2>&1 || echo "   ⚠️  无法获取容器状态"
    
    echo ""
    echo "   详细状态："
    for container in demo-postgres demo-backend demo-frontend; do
        if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
            status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null)
            echo "   $container: $status"
        else
            echo "   $container: 不存在"
        fi
    done
}

check_ports() {
    echo ""
    echo "🔌 [3/6] 检查端口监听..."
    
    for port in 80 3000 5432; do
        if netstat -tlnp 2>/dev/null | grep -q ":${port} "; then
            echo "   ✅ 端口 ${port}: 监听中"
            netstat -tlnp 2>/dev/null | grep ":${port} " | awk '{print "      进程:", $7}'
        elif ss -tlnp 2>/dev/null | grep -q ":${port} "; then
            echo "   ✅ 端口 ${port}: 监听中"
            ss -tlnp 2>/dev/null | grep ":${port} " | awk '{print "      进程:", $6}'
        else
            echo "   ❌ 端口 ${port}: 未监听"
        fi
    done
}

check_backend_health() {
    echo ""
    echo "❤️  [4/6] 检查后端健康状态..."
    
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        response=$(curl -s http://localhost:3000)
        if [[ "$response" == *"Hello World!"* ]]; then
            echo "   ✅ 根路径正常 (返回: $response)"
        else
            echo "   ✅ 后端服务可访问 (返回: $response)"
        fi
    else
        echo "   ❌ 后端无法访问 (http://localhost:3000)"
        return 1
    fi
    
    echo "   API 端点检查："
    
    # 检查 candidates API
    if curl -sf http://localhost:3000/api/candidates > /dev/null 2>&1; then
        echo "   ✅ /api/candidates 可访问"
    else
        echo "   ❌ /api/candidates 无法访问"
    fi
    
    # 检查 jobs API
    if curl -sf http://localhost:3000/api/jobs > /dev/null 2>&1; then
        echo "   ✅ /api/jobs 可访问"
    else
        echo "   ❌ /api/jobs 无法访问"
    fi
    
    # 检查 match API
    if curl -sf -X POST -H "Content-Type: application/json" -d '{"job":{"requirements":"test"},"candidate":{"resume":"test"}}' http://localhost:3000/api/match > /dev/null 2>&1; then
        echo "   ✅ /api/match 可访问"
    else
        echo "   ⚠️  /api/match 需要POST请求，跳过详细检查"
    fi
    
    # 检查 upload API
    echo "   ℹ️  /api/upload/resume 需要文件上传，跳过详细检查"
}

check_env_files() {
    echo ""
    echo "⚙️  [5/6] 检查环境变量文件..."
    
    backend_env="$PROJECT_DIR/apps/backend/.env.local"
    frontend_env="$PROJECT_DIR/apps/frontend/.env.production"
    
    if [ -f "$backend_env" ]; then
        echo "   ✅ 后端 .env.local 存在"
        echo "      DB_HOST: $(grep '^DB_HOST=' "$backend_env" | cut -d= -f2)"
        echo "      PORT: $(grep '^PORT=' "$backend_env" | cut -d= -f2)"
    else
        echo "   ❌ 后端 .env.local 不存在"
    fi
    
    if [ -f "$frontend_env" ]; then
        echo "   ✅ 前端 .env.production 存在"
        echo "      VITE_API_BASE_URL: $(grep '^VITE_API_BASE_URL=' "$frontend_env" | cut -d= -f2)"
    else
        echo "   ⚠️  前端 .env.production 不存在（可能在构建时生成）"
    fi
}

show_logs() {
    echo ""
    echo "📝 [6/6] 最近日志..."
    
    cd "$PROJECT_DIR" 2>/dev/null && {
        echo "   --- 后端日志（最后 20 行）---"
        docker logs --tail 20 demo-backend 2>&1 || echo "   （无法获取后端日志）"
        
        echo ""
        echo "   --- 前端日志（最后 10 行）---"
        docker logs --tail 10 demo-frontend 2>&1 || echo "   （无法获取前端日志）"
        
        echo ""
        echo "   --- PostgreSQL 日志（最后 10 行）---"
        docker logs --tail 10 demo-postgres 2>&1 || echo "   （无法获取数据库日志）"
    }
}

show_fix_suggestions() {
    echo ""
    echo "=========================================="
    echo "  💡 修复建议"
    echo "=========================================="
    echo ""
    echo "如果后端未启动，请按顺序执行："
    echo ""
    echo "  1. 查看完整日志："
    echo "     docker logs demo-backend"
    echo ""
    echo "  2. 重启后端服务："
    echo "     cd $PROJECT_DIR"
    echo "     docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend"
    echo ""
    echo "  3. 如果仍然失败，重建并启动："
    echo "     cd $PROJECT_DIR"
    echo "     docker compose -f docker-compose.yml -f docker-compose.prod.yml down"
    echo "     docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build"
    echo ""
    echo "  4. 完全重新部署："
    echo "     cd $PROJECT_DIR"
    echo "     git pull"
    echo "     bash deploy.sh"
    echo ""
}

main() {
    check_docker
    check_containers
    check_ports
    check_backend_health
    check_env_files
    show_logs
    show_fix_suggestions
    
    echo "=========================================="
    echo "  诊断完成"
    echo "=========================================="
}

main "$@"
