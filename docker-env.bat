@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================
:: Docker 环境管理脚本 (Windows)
:: ============================================
:: 用途：快速切换开发/生产环境、管理容器服务
::
:: 使用方法:
::   docker-env.bat [命令] [环境]
::
:: 命令:
::   start   - 启动服务
::   stop    - 停止服务
::   restart - 重启服务
::   logs    - 查看日志
::   status  - 查看状态
::   build   - 重新构建镜像
::   clean   - 清理容器和卷
::   shell   - 进入后端容器
::
:: 环境:
::   dev     - 开发环境（默认）
::   prod    - 生产环境
::
:: 示例:
::   docker-env.bat start dev        :: 启动开发环境
::   docker-env.bat stop prod        :: 停止生产环境
::   docker-env.bat logs backend     :: 查看后端日志
:: ============================================

set "PROJECT_NAME=demo"
set "COMPOSE_BASE=docker-compose.yml"
set "COMPOSE_DEV=docker-compose.dev.yml"
set "COMPOSE_PROD=docker-compose.prod.yml"

:: 检查 Docker 是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker 未运行，请先启动 Docker Desktop
    exit /b 1
)

:: 解析命令
set "COMMAND=%~1"
if "%COMMAND%"=="" set "COMMAND=help"

:: 解析环境和参数
set "ENV=%~2"
if "%ENV%"=="" set "ENV=dev"
set "SERVICE=%~2"

:: 根据环境设置 compose 文件
if /i "%ENV%"=="dev" (
    set "COMPOSE_FILES=-f %COMPOSE_BASE% -f %COMPOSE_DEV%"
) else if /i "%ENV%"=="prod" (
    set "COMPOSE_FILES=-f %COMPOSE_BASE% -f %COMPOSE_PROD%"
) else (
    echo [ERROR] 无效的环境: %ENV%
    echo 支持的环境: dev, prod
    exit /b 1
)

:: 执行命令
if /i "%COMMAND%"=="start" (
    goto :cmd_start
) else if /i "%COMMAND%"=="stop" (
    goto :cmd_stop
) else if /i "%COMMAND%"=="restart" (
    goto :cmd_restart
) else if /i "%COMMAND%"=="logs" (
    goto :cmd_logs
) else if /i "%COMMAND%"=="status" (
    goto :cmd_status
) else if /i "%COMMAND%"=="build" (
    goto :cmd_build
) else if /i "%COMMAND%"=="clean" (
    goto :cmd_clean
) else if /i "%COMMAND%"=="shell" (
    goto :cmd_shell
) else if /i "%COMMAND%"=="help" (
    goto :show_help
) else (
    echo [ERROR] 未知命令: %COMMAND%
    goto :show_help
)

:cmd_start
echo [INFO] 启动 %ENV% 环境...
docker-compose %COMPOSE_FILES% up -d
if %ENV%==dev (
    echo.
    echo ✅ 开发环境已启动！
    echo    前端地址: http://localhost:5173
    echo    后端地址: http://localhost:3000
    echo    API 文档: http://localhost:3000/api/swagger
) else (
    echo.
    echo ✅ 生产环境已启动！
    echo    前端地址: http://localhost:80
    echo    后端地址: http://localhost:3000
)
goto :eof

:cmd_stop
echo [INFO] 停止 %ENV% 环境...
docker-compose %COMPOSE_FILES% down
echo ✅ %ENV% 环境已停止
goto :eof

:cmd_restart
call :cmd_stop %ENV%
timeout /t 2 /nobreak >nul
call :cmd_start %ENV%
goto :eof

:cmd_logs
echo [INFO] 查看 %ENV% 环境日志...
if "%SERVICE%"=="" (
    docker-compose %COMPOSE_FILES% logs -f --tail=100
) else (
    docker-compose %COMPOSE_FILES% logs -f --tail=100 %SERVICE%
)
goto :eof

:cmd_status
echo.
echo === %ENV% 环境状态 ===
docker ps --filter "name=%PROJECT_NAME%" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
goto :eof

:cmd_build
echo [INFO] 重新构建镜像 (%ENV% 环境)...
if "%SERVICE%"=="" (
    docker-compose %COMPOSE_FILES% build --no-cache
) else (
    docker-compose %COMPOSE_FILES% build --no-cache %SERVICE%
)
echo ✅ 镜像构建完成
goto :eof

:cmd_clean
echo [WARNING] ⚠️  即将清理 %ENV% 环境的所有容器和数据卷！
set /p confirm=确认继续？(y/N) 
if /i "%confirm%"=="y" (
    docker-compose %COMPOSE_FILES% down -v --remove-orphans
    docker image prune -f
    echo ✅ %ENV% 环境清理完成
) else (
    echo 操作已取消
)
goto :eof

:cmd_shell
set "CONTAINER_SERVICE=%~2"
if "%CONTAINER_SERVICE%"=="" set "CONTAINER_SERVICE=backend"
set "CONTAINER_NAME=%PROJECT_NAME%-%ENV%-%CONTAINER_SERVICE%"

echo [INFO] 进入 %CONTAINER_NAME% 容器...
docker exec -it %CONTAINER_NAME% sh
goto :eof

:show_help
echo.
echo 🐳 Docker 环境管理工具 (Windows)
echo.
echo 用法: %0 ^<命令^> [参数] [环境]
echo.
echo 命令:
echo   start   [env]      启动服务（默认: dev）
echo   stop    [env]      停止服务
echo   restart [env]      重启服务
echo   logs    [svc] [env] 查看日志
echo   status  [env]      查看状态
echo   build   [svc] [env] 重新构建镜像
echo   clean   [env]      清理环境
echo   shell   [svc] [env] 进入容器
echo   help               显示帮助
echo.
echo 环境:
echo   dev               开发环境（默认）
echo   prod              生产环境
echo.
echo 示例:
echo   %0 start dev       :: 启动开发环境
echo   %0 stop prod       :: 停止生产环境
echo   %0 logs backend    :: 查看后端日志
echo   %0 shell backend   :: 进入后端容器
echo.
goto :eof
