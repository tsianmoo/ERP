#!/bin/bash
set -Eeuo pipefail

PORT=5000
COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
NODE_ENV=development
DEPLOY_RUN_PORT=5000

cd "${COZE_WORKSPACE_PATH}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 强制终止占用端口的进程
kill_port_if_listening() {
    local port=$1
    local pids
    pids=$(ss -H -lntp 2>/dev/null | awk -v port="${port}" '$4 ~ ":"port"$"' | grep -o 'pid=[0-9]*' | cut -d= -f2 | paste -sd' ' - || true)
    if [[ -z "${pids}" ]]; then
      log_info "Port ${port} is free."
      return 0
    fi
    log_warn "Port ${port} in use by PIDs: ${pids}, killing..."
    echo "${pids}" | xargs -I {} kill -9 {} 2>/dev/null || true
    sleep 2
    
    # 再次检查
    pids=$(ss -H -lntp 2>/dev/null | awk -v port="${port}" '$4 ~ ":"port"$"' | grep -o 'pid=[0-9]*' | cut -d= -f2 | paste -sd' ' - || true)
    if [[ -n "${pids}" ]]; then
      log_error "Port ${port} still busy after SIGKILL, PIDs: ${pids}"
      return 1
    fi
    log_info "Port ${port} cleared."
}

# 检查 Java 是否可用
check_java() {
    # 优先使用系统 PATH 中的 java
    if command -v java &> /dev/null; then
        JAVA_CMD=$(command -v java)
        export JAVA_HOME=$(dirname $(dirname $(readlink -f "$JAVA_CMD")))
        log_info "Java found at: $JAVA_CMD (JAVA_HOME=$JAVA_HOME)"
        java -version 2>&1 | head -1
        return 0
    fi
    
    # 检查常见安装路径
    local java_paths=(
        "/usr/lib/jvm/java-17-openjdk-amd64/bin/java"
        "/usr/lib/jvm/java-11-openjdk-amd64/bin/java"
        "/usr/lib/jvm/default-java/bin/java"
        "/usr/bin/java"
    )
    
    for path in "${java_paths[@]}"; do
        if [[ -x "$path" ]]; then
            JAVA_CMD="$path"
            export JAVA_HOME=$(dirname $(dirname "$path"))
            log_info "Java found at: $JAVA_CMD"
            return 0
        fi
    done
    
    return 1
}

# 确保 Java 已安装（只在必要时安装）
ensure_java_installed() {
    if check_java; then
        return 0
    fi
    
    log_warn "Java not found, attempting to install OpenJDK 17..."
    
    # 使用更稳健的安装方式
    if apt-get update -qq && apt-get install -y -qq --no-install-recommends openjdk-17-jre-headless; then
        if check_java; then
            log_info "Java installed successfully"
            return 0
        fi
    fi
    
    log_error "Java installation failed, will start frontend only"
    return 1
}

# 启动 Java 后端服务
start_java_backend() {
    log_info "Starting Java backend service on port 8080..."
    
    # 确保 Java 已安装
    if ! ensure_java_installed; then
        log_warn "Cannot start Java backend, continuing with frontend only..."
        return 1
    fi
    
    # 检查 JAR 文件是否存在
    JAR_FILE="${COZE_WORKSPACE_PATH}/java-backend/target/product-management-backend-1.0.0.jar"
    if [[ ! -f "${JAR_FILE}" ]]; then
        log_info "JAR file not found, building with Maven..."
        cd "${COZE_WORKSPACE_PATH}/java-backend"
        if mvn package -DskipTests -q; then
            log_info "Maven build successful"
        else
            log_error "Maven build failed"
            cd "${COZE_WORKSPACE_PATH}"
            return 1
        fi
        cd "${COZE_WORKSPACE_PATH}"
    else
        log_info "JAR file found: ${JAR_FILE}"
    fi
    
    # 解析数据库连接字符串
    PG_URL=${PGDATABASE_URL:-""}
    if [ -n "$PG_URL" ]; then
        log_info "Parsing database connection from PGDATABASE_URL..."
        
        # 使用 Python 解析 URL（更可靠）
        DB_INFO=$(python3 -c "
import sys
from urllib.parse import urlparse
url = '$PG_URL'
parsed = urlparse(url)
print(f'{parsed.username}|{parsed.password}|{parsed.hostname}|{parsed.port}|{parsed.path.lstrip(\"/\").split(\"?\")[0]}|{parsed.query}')
" 2>/dev/null)
        
        if [ -n "$DB_INFO" ]; then
            IFS='|' read -r DB_USER DB_PASSWORD DB_HOST DB_PORT DB_NAME DB_PARAMS <<< "$DB_INFO"
            export SPRING_DATASOURCE_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}?${DB_PARAMS}"
            export SPRING_DATASOURCE_USERNAME="$DB_USER"
            export SPRING_DATASOURCE_PASSWORD="$DB_PASSWORD"
            log_info "Database configured: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
        else
            log_warn "Failed to parse PGDATABASE_URL, using defaults"
        fi
    else
        log_warn "PGDATABASE_URL not set, using default database configuration"
    fi
    
    # 启动 Java 后端
    cd "${COZE_WORKSPACE_PATH}/java-backend"
    nohup "${JAVA_CMD}" \
        -Xmx512m \
        -Xms256m \
        -jar target/product-management-backend-1.0.0.jar \
        > /app/work/logs/bypass/java-backend.log 2>&1 &
    JAVA_PID=$!
    log_info "Java backend started with PID: ${JAVA_PID}"
    cd "${COZE_WORKSPACE_PATH}"
    
    # 等待 Java 后端启动（带超时和重试）
    log_info "Waiting for Java backend to be ready..."
    local max_attempts=60
    local attempt=1
    local ready=false
    
    while [ $attempt -le $max_attempts ]; do
        # 检查进程是否还在运行
        if ! kill -0 ${JAVA_PID} 2>/dev/null; then
            log_error "Java backend process died unexpectedly"
            tail -n 30 /app/work/logs/bypass/java-backend.log
            return 1
        fi
        
        # 检查健康端点
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health 2>/dev/null | grep -q "200"; then
            ready=true
            break
        fi
        
        # 也检查 API 端点
        if curl -s http://localhost:8080/api/products?limit=1 > /dev/null 2>&1; then
            ready=true
            break
        fi
        
        printf "."
        sleep 1
        attempt=$((attempt + 1))
    done
    echo ""
    
    if [ "$ready" = true ]; then
        log_info "Java backend is ready! (took ${attempt} seconds)"
        return 0
    else
        log_warn "Java backend startup timeout after ${max_attempts} seconds"
        log_warn "Check logs at /app/work/logs/bypass/java-backend.log"
        return 1
    fi
}

# 主流程
log_info "=== Starting Development Environment ==="
log_info "Workspace: ${COZE_WORKSPACE_PATH}"

# 清理端口
log_info "Clearing ports before start..."
kill_port_if_listening 5000
kill_port_if_listening 8080

# 启动 Java 后端
if start_java_backend; then
    export JAVA_BACKEND_URL="http://localhost:8080"
    log_info "JAVA_BACKEND_URL set to: ${JAVA_BACKEND_URL}"
else
    log_warn "Java backend not available, some features may not work"
    export JAVA_BACKEND_URL=""
fi

# 启动 Next.js 前端
log_info "Starting Next.js frontend on port ${PORT}..."
npx next dev --webpack --port $PORT
