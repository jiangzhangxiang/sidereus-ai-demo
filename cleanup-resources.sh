#!/bin/bash

#===============================================================================
# 脚本名称: cleanup-resources.sh
# 功能描述: Demo项目部署失败后的临时资源清理与诊断工具
# 适用场景: Ubuntu服务器，2GB内存/40GB硬盘部署失败后使用
# 使用方式: sudo bash cleanup-resources.sh [--deep] [--analyze]
#===============================================================================

set -euo pipefail

echo "=========================================="
echo "  🧹 Demo项目 - 资源清理与诊断工具"
echo "=========================================="
echo ""

PARAM="${1:-}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

#-------------------------------------------------------------------------------
# 函数定义
#-------------------------------------------------------------------------------

show_banner() {
    local title="$1"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  $title"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

check_memory() {
    show_banner "📊 内存使用情况"
    
    echo "物理内存:"
    free -h
    
    echo ""
    echo "Swap分区:"
    swapon --show 2>/dev/null || echo "未配置Swap"
    
    echo ""
    echo "Top 10 内存消耗进程:"
    ps aux --sort=-%mem | head -11 | awk '{printf "%-8s %-6s %-6s %s\n", $1, $4"%", $6"KB", $11}'
    
    # 检查是否启用OOM Killer
    if [ -f /proc/sys/vm/overcommit_memory ]; then
        local overcommit=$(cat /proc/sys/vm/overcommit_memory)
        echo ""
        echo "内存过度分配策略: $overcommit (0=启发式, 1=总是允许, 2=严格)"
    fi
}

check_disk() {
    show_banner "💾 磁盘使用情况"
    
    df -h /
    
    echo ""
    echo "Docker磁盘使用:"
    if command -v docker &>/dev/null; then
        docker system df 2>/dev/null || echo "Docker未运行"
    else
        echo "Docker未安装"
    fi
    
    echo ""
    echo "大文件Top 10 (>100MB):"
    find / -type f -size +100M 2>/dev/null | head -10 | while read file; do
        size=$(du -sh "$file" 2>/dev/null | cut -f1)
        echo "  $size  $file"
    done
    
    echo ""
    echo "apt缓存大小:"
    du -sh /var/cache/apt/archives/ 2>/dev/null || echo "无法访问"
    
    echo ""
    echo "日志文件大小:"
    du -sh /var/log/ 2>/dev/null || echo "无法访问"
    if [ -f /var/log/demo-deploy.log ]; then
        echo "  部署日志: $(du -sh /var/log/demo-deploy.log | cut -f1)"
    fi
}

check_docker_status() {
    show_banner "🐳 Docker状态检查"
    
    if ! command -v docker &>/dev/null; then
        echo "Docker未安装"
        return 0
    fi
    
    echo "Docker服务状态:"
    systemctl is-active docker 2>/dev/null || echo "未知"
    
    echo ""
    echo "运行中的容器:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Size}}" 2>/dev/null || echo "无容器"
    
    echo ""
    echo "Docker镜像:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 2>/dev/null | head -20
    
    echo ""
    echo "Docker卷:"
    docker volume ls 2>/dev/null || echo "无卷"
}

check_deploy_logs() {
    show_banner "📋 部署日志分析"
    
    local log_file="/var/log/demo-deploy.log"
    
    if [ ! -f "$log_file" ]; then
        echo "未找到部署日志文件: $log_file"
        return 0
    fi
    
    echo "日志文件大小: $(du -sh "$log_file" | cut -f1)"
    echo "最后修改时间: $(stat -c %y "$log_file" 2>/dev/null || stat -f "%Sm" "$log_file")"
    echo ""
    echo "最近20条日志:"
    tail -20 "$log_file"
    echo ""
    echo "ERROR级别日志 (最近10条):"
    grep "\[ERROR\]" "$log_file" | tail -10 || echo "无ERROR日志"
    echo ""
    echo "WARNING级别日志 (最近10条):"
    grep "\[WARNING\]" "$log_file" | tail -10 || echo "无WARNING日志"
}

#-------------------------------------------------------------------------------
# 清理函数
#-------------------------------------------------------------------------------

clean_apt_cache() {
    show_banner "🗑️  清理APT缓存"
    
    apt-get clean
    apt-get autoremove -y
    
    local before=$(du -sh /var/cache/apt/archives/ 2>/dev/null | cut -f1)
    echo "清理前: ${before:-N/A}"
    echo "✅ APT缓存已清理"
}

clean_docker_unused() {
    show_banner "🐳 清理Docker未使用资源"
    
    if ! command -v docker &>/dev/null; then
        echo "Docker未安装，跳过"
        return 0
    fi
    
    echo "清理前:"
    docker system df 2>/dev/null || true
    
    echo ""
    echo "停止所有容器..."
    docker stop $(docker ps -q) 2>/dev/null || true
    
    echo "删除停止的容器..."
    docker container prune -f 2>/dev/null || true
    
    echo "删除未使用的镜像..."
    docker image prune -af 2>/dev/null || true
    
    echo "删除未使用的卷..."
    docker volume prune -f 2>/dev/null || true
    
    echo "删除构建缓存..."
    docker builder prune -af 2>/dev/null || true
    
    echo ""
    echo "清理后:"
    docker system df 2>/dev/null || true
    
    echo "✅ Docker资源已清理"
}

clean_logs() {
    show_banner "📝 清理日志文件"
    
    # 清理旧日志
    find /var/log -name "*.gz" -delete 2>/dev/null || true
    find /var/log -name "*.old" -delete 2>/dev/null || true
    find /var/log -name "*.[0-9]" -delete 2>/dev/null || true
    
    # 清理journalctl日志（保留最近3天）
    journalctl --vacuum-time=3d 2>/dev/null || true
    
    # 截断大型日志文件
    for logfile in /var/log/*.log /var/log/**/*.log; do
        if [ -f "$logfile" ] && [ $(du -k "$logfile" | cut -f1) -gt 10240 ]; then
            : > "$logfile"
            echo "  已截断: $logfile"
        fi
    done 2>/dev/null || true
    
    echo "✅ 日志文件已清理"
}

clean_temp_files() {
    show_banner "🔄 清理临时文件"
    
    # 清理/tmp中7天前的文件
    find /tmp -type f -atime +7 -delete 2>/dev/null || true
    
    # 清理用户临时目录
    rm -rf /tmp/npm-* /tmp/pip-* /tmp/vite-* 2>/dev/null || true
    
    # 清理pnpm缓存（如果存在）
    if [ -d "/root/.local/share/pnpm/store" ]; then
        pnpm store prune 2>/dev/null || true
        echo "  已清理pnpm存储"
    fi
    
    # 清理npm缓存（如果存在）
    if command -v npm &>/dev/null; then
        npm cache clean --force 2>/dev/null || true
        echo "  已清理npm缓存"
    fi
    
    echo "✅ 临时文件已清理"
}

clean_project_backups() {
    show_banner "📦 清理项目备份"
    
    local backup_dir="/opt/demo/backups"
    
    if [ -d "$backup_dir" ]; then
        local backup_count=$(ls -1 "$backup_dir" 2>/dev/null | wc -l)
        local backup_size=$(du -sh "$backup_dir" 2>/dev/null | cut -f1)
        
        echo "发现 $backup_count 个备份，总大小: ${backup_size:-0}"
        
        read -p "是否删除所有备份? (y/N): " confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            rm -rf "${backup_dir:?}"/*
            rm -f /opt/demo/.last_backup
            echo "✅ 备份已清理"
        else
            echo "跳过备份清理"
        fi
    else
        echo "未找到备份目录"
    fi
}

setup_swap() {
    show_banner "⚙️  配置Swap空间 (推荐用于2GB内存)"
    
    local current_swap=$(free -m | awk '/^Swap:/ {print $2}')
    
    if [ "$current_swap" -gt 0 ]; then
        echo "当前Swap: ${current_swap}MB"
        read -p "是否重新配置为4GB? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            return 0
        fi
        swapoff -a 2>/dev/null || true
        rm -f /swapfile 2>/dev/null || true
    fi
    
    echo "创建4GB Swap文件..."
    dd if=/dev/zero of=/swapfile bs=1M count=4096 status=progress
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    echo "/swapfile none swap sw 0 0" >> /etc/fstab
    
    # 调整swappiness（更积极使用Swap）
    sysctl vm.swappiness=60
    
    echo ""
    echo "✅ Swap配置完成 (4GB)"
    free -h | grep Swap
}

optimize_docker_for_low_memory() {
    show_banner "⚡ Docker低内存优化"
    
    if ! command -v docker &>/dev/null; then
        echo "Docker未安装"
        return 0
    fi
    
    cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me",
    "https://dockerpull.org"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "max-concurrent-downloads": 2,
  "max-concurrent-uploads": 2,
  "storage-driver": "overlay2"
}
EOF
    
    systemctl restart docker 2>/dev/null || true
    
    echo "✅ Docker已优化（限制并发下载、减小日志）"
    echo "优化内容:"
    echo "  - 并发下载数: 2 (默认值过高会占用内存)"
    echo "  - 容器日志上限: 10MB × 3 = 30MB"
    echo "  - 存储驱动: overlay2 (更高效)"
}

#-------------------------------------------------------------------------------
# 主逻辑
#-------------------------------------------------------------------------------

case "$PARAM" in
    --analyze|-a)
        check_memory
        check_disk
        check_docker_status
        check_deploy_logs
        
        echo ""
        show_banner "🎯 诊断总结与建议"
        
        local mem_total=$(free -m | awk '/Mem:/ {print $2}')
        local mem_available=$(free -m | awk '/Mem:/ {print $7}')
        local disk_available=$(df -BG / | awk 'NR==2 {print $4}' | tr -d 'G')
        
        echo "可用内存: ${mem_available}MB / ${mem_total}MB"
        echo "可用磁盘: ${disk_available}GB"
        echo ""
        
        if [ "$mem_available" -lt 512 ]; then
            echo "❌ 严重: 可用内存不足512MB，强烈建议添加Swap"
            echo "   执行: sudo bash $0 --swap"
        elif [ "$mem_available" -lt 1024 ]; then
            echo "⚠️  警告: 可用内存不足1GB，建议添加Swap"
            echo "   执行: sudo bash $0 --swap"
        fi
        
        if [ "${disk_available:-0}" -lt 10 ]; then
            echo "❌ 严重: 磁盘剩余不足10GB，需要清理空间"
            echo "   执行: sudo bash $0 --deep"
        elif [ "${disk_available:-0}" -lt 20 ]; then
            echo "⚠️  警告: 磁盘剩余不足20GB，建议清理"
            echo "   执行: sudo bash $0 --clean"
        fi
        ;;
        
    --deep|--all|-d)
        clean_apt_cache
        clean_docker_unused
        clean_logs
        clean_temp_files
        clean_project_backups
        
        echo ""
        show_banner "✨ 深度清理完成"
        df -h /
        free -h
        ;;
        
    --clean|-c)
        clean_apt_cache
        clean_docker_unused
        clean_temp_files
        
        echo ""
        show_banner "✨ 常规清理完成"
        df -h /
        ;;
        
    --swap|-s)
        setup_swap
        ;;
        
    --optimize|-o)
        optimize_docker_for_low_memory
        setup_swap
        ;;
        
    --logs|-l)
        check_deploy logs
        ;;
        
    *)
        echo "用法: sudo bash $0 [选项]"
        echo ""
        echo "选项:"
        echo "  --analyze, -a     完整诊断（内存、磁盘、Docker、日志）"
        echo "  --deep, -d        深度清理（所有缓存、日志、备份）"
        echo "  --clean, -c       常规清理（APT、Docker、临时文件）"
        echo "  --swap, -s        配置4GB Swap空间"
        echo "  --optimize, -o    低内存优化（Swap + Docker调优）"
        echo "  --logs, -l        查看部署日志"
        echo ""
        echo "推荐流程（2GB内存环境）:"
        echo "  1. sudo bash $0 --analyze      # 先诊断问题"
        echo "  2. sudo bash $0 --optimize     # 优化系统"
        echo "  3. sudo bash $0 --deep         # 清理资源"
        echo "  4. 重新执行部署脚本"
        ;;
esac

echo ""
echo "=========================================="
echo "  ✅ 操作完成"
echo "=========================================="
