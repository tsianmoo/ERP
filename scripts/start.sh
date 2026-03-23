#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

cd "${COZE_WORKSPACE_PATH}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 Java 是否可用
check_java() {
    if command -v java &> /dev/null; then
        JAVA_CMD=$(command -v java)
        export JAVA_HOME=$(dirname $(dirname $(readlink -f "$JAVA_CMD")))
        log_info "Java found at: $JAVA_CMD"
        return 0
    fi
    
    local java_paths=(
        "/usr/lib/jvm/java-17-openjdk-amd64/bin/java"
        "/usr/lib/jvm/java-11-openjdk-amd64/bin/java"
        "/usr/lib/jvm/default-java/bin/java"
    )
    
    for path in "${java_paths[@]}"; do
        if [[ -x "$path" ]]; then
            JAVA_CMD="$path"
            export JAVA_HOME=$(dirname $(dirname "$path"))
            return 0
        fi
    done
    
    return 1
}

# 启动 Java 后端服务
start_java_backend() {
    log_info "Starting Java backend service on port 8080..."
    
    if ! check_java; then
        log_warn "Java not found, skipping Java backend"
        return 1
    fi
    
    # 检查 JAR 文件
    JAR_FILE="${COZE_WORKSPACE_PATH}/java-backend/target/product-management-backend-1.0.0.jar"
    if [[ ! -f "${JAR_FILE}" ]]; then
        log_warn "JAR file not found: ${JAR_FILE}"
        return 1
    fi
    
    # 解析数据库连接字符串
    PG_URL=${PGDATABASE_URL:-""}
    if [ -n "$PG_URL" ]; then
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
        fi
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
    
    # 等待启动
    log_info "Waiting for Java backend..."
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if ! kill -0 ${JAVA_PID} 2>/dev/null; then
            log_error "Java backend process died"
            return 1
        fi
        
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health 2>/dev/null | grep -q "200"; then
            log_info "Java backend is ready!"
            return 0
        fi
        
        sleep 1
        attempt=$((attempt + 1))
    done
    
    log_warn "Java backend startup timeout"
    return 1
}

# 主流程
log_info "=== Starting Production Server ==="

# 启动 Java 后端
if start_java_backend; then
    export JAVA_BACKEND_URL="http://localhost:8080"
else
    log_warn "Java backend not available"
    export JAVA_BACKEND_URL=""
fi

# 启动 Next.js
log_info "Starting Next.js server on port ${DEPLOY_RUN_PORT}..."
npx next start --port ${DEPLOY_RUN_PORT}
