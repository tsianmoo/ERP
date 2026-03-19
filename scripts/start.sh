#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

# 设置 Java 环境变量
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}"
export PATH="${JAVA_HOME}/bin:${PATH}"
JAVA_CMD="${JAVA_HOME}/bin/java"

# 启动 Java 后端服务
start_java_backend() {
    echo "Starting Java backend service on port 8080..."
    
    # 解析数据库连接字符串
    PG_URL=${PGDATABASE_URL:-""}
    if [ -n "$PG_URL" ]; then
        DB_USER=$(echo "$PG_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
        DB_PASSWORD=$(echo "$PG_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
        DB_HOST=$(echo "$PG_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
        DB_PORT=$(echo "$PG_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
        DB_NAME=$(echo "$PG_URL" | sed -n 's|.*/\([^?]*\)?.*|\1|p')
        DB_PARAMS=$(echo "$PG_URL" | sed -n 's|.*?\(.*\)|\1|p')
        
        export SPRING_DATASOURCE_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}?${DB_PARAMS}"
        export SPRING_DATASOURCE_USERNAME="$DB_USER"
        export SPRING_DATASOURCE_PASSWORD="$DB_PASSWORD"
    fi
    
    cd "${COZE_WORKSPACE_PATH}/java-backend"
    nohup "${JAVA_CMD}" -jar target/product-management-backend-1.0.0.jar > /app/work/logs/bypass/java-backend.log 2>&1 &
    echo "Java backend started with PID: $!"
    cd "${COZE_WORKSPACE_PATH}"
    
    # 等待 Java 后端启动
    echo "Waiting for Java backend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8080/api/products > /dev/null 2>&1; then
            echo "Java backend is ready!"
            break
        fi
        sleep 1
    done
}

start_service() {
    cd "${COZE_WORKSPACE_PATH}"
    echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
    export JAVA_BACKEND_URL="http://localhost:8080"
    npx next start --port ${DEPLOY_RUN_PORT}
}

# 启动 Java 后端
start_java_backend

echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
start_service
