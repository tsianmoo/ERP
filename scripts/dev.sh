#!/bin/bash
set -Eeuo pipefail

PORT=5000
COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
NODE_ENV=development
DEPLOY_RUN_PORT=5000

# 设置 Java 环境变量
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}"
export PATH="${JAVA_HOME}/bin:${PATH}"

# Java 可执行文件路径
JAVA_CMD="${JAVA_HOME}/bin/java"

cd "${COZE_WORKSPACE_PATH}"

kill_port_if_listening() {
    local port=$1
    local pids
    pids=$(ss -H -lntp 2>/dev/null | awk -v port="${port}" '$4 ~ ":"port"$"' | grep -o 'pid=[0-9]*' | cut -d= -f2 | paste -sd' ' - || true)
    if [[ -z "${pids}" ]]; then
      echo "Port ${port} is free."
      return
    fi
    echo "Port ${port} in use by PIDs: ${pids} (SIGKILL)"
    echo "${pids}" | xargs -I {} kill -9 {}
    sleep 1
    pids=$(ss -H -lntp 2>/dev/null | awk -v port="${port}" '$4 ~ ":"port"$"' | grep -o 'pid=[0-9]*' | cut -d= -f2 | paste -sd' ' - || true)
    if [[ -n "${pids}" ]]; then
      echo "Warning: port ${port} still busy after SIGKILL, PIDs: ${pids}"
    else
      echo "Port ${port} cleared."
    fi
}

# 启动 Java 后端服务
start_java_backend() {
    echo "Starting Java backend service on port 8080..."
    
    # 检查 Java 是否可用
    if [[ ! -x "${JAVA_CMD}" ]]; then
        echo "ERROR: Java not found at ${JAVA_CMD}"
        echo "Please install Java 17 first"
        return 1
    fi
    
    # 检查 JAR 文件是否存在
    JAR_FILE="${COZE_WORKSPACE_PATH}/java-backend/target/product-management-backend-1.0.0.jar"
    if [[ ! -f "${JAR_FILE}" ]]; then
        echo "JAR file not found, building..."
        cd "${COZE_WORKSPACE_PATH}/java-backend"
        mvn package -DskipTests -q
        cd "${COZE_WORKSPACE_PATH}"
    fi
    
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

echo "Clearing ports before start."
kill_port_if_listening 5000
kill_port_if_listening 8080

# 启动 Java 后端
start_java_backend

echo "Starting Next.js frontend on port ${PORT}..."
export JAVA_BACKEND_URL="http://localhost:8080"
npx next dev --webpack --port $PORT
