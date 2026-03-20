#!/bin/bash
# 快速重建并重启 Java 后端服务
# 使用方法:
#   ./restart-java-backend.sh          # 生产模式（默认）
#   ./restart-java-backend.sh --dev    # 开发模式（支持热重载）

set -e

DEV_MODE=false
if [[ "$1" == "--dev" ]]; then
    DEV_MODE=true
fi

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-/workspace/projects}"
JAVA_BACKEND_DIR="${COZE_WORKSPACE_PATH}/java-backend"
LOG_FILE="/app/work/logs/bypass/java-backend.log"

if [[ "$DEV_MODE" == "true" ]]; then
    echo "=== 开发模式：使用 Spring Boot DevTools 热重载 ==="
    echo "提示：修改 Java 代码后，保存文件会自动触发重载"
    echo ""
fi

echo "=== 重新构建 Java 后端 ==="
cd "${JAVA_BACKEND_DIR}"
mvn package -DskipTests -q
echo "构建完成!"

echo ""
echo "=== 停止旧服务 ==="
pkill -f "java -jar target/product-management-backend" 2>/dev/null && echo "已停止旧服务" || echo "没有运行中的服务"
sleep 2

echo ""
echo "=== 启动新服务 ==="

# 设置数据库连接
export PGDATABASE_URL="${PGDATABASE_URL:-postgresql://postgres:xukT35ij4q9j2r6mjH@cp-brave-chill-a58cc292.pg5.aidap-global.cn-beijing.volces.com:5432/postgres?sslmode=require&channel_binding=require}"

# 解析数据库连接字符串
DB_USER=$(echo "$PGDATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASSWORD=$(echo "$PGDATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo "$PGDATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$PGDATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$PGDATABASE_URL" | sed -n 's|.*/\([^?]*\)?.*|\1|p')

export SPRING_DATASOURCE_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"
export SPRING_DATASOURCE_USERNAME="$DB_USER"
export SPRING_DATASOURCE_PASSWORD="$DB_PASSWORD"

# 启动服务
if [[ "$DEV_MODE" == "true" ]]; then
    # 开发模式：启用 DevTools 热重载
    nohup java -jar -Dspring.devtools.restart.enabled=true target/product-management-backend-1.0.0.jar > "$LOG_FILE" 2>&1 &
else
    # 生产模式
    nohup java -jar target/product-management-backend-1.0.0.jar > "$LOG_FILE" 2>&1 &
fi
echo "服务启动中... (PID: $!)"

# 等待服务就绪
echo "等待服务就绪..."
for i in {1..30}; do
    if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        echo "✅ Java 后端服务已就绪! (端口 8080)"
        if [[ "$DEV_MODE" == "true" ]]; then
            echo ""
            echo "📌 开发模式已启用，修改 Java 代码后会自动重载"
            echo "   注意：某些修改（如新增方法、修改签名）可能仍需手动重启"
        fi
        exit 0
    fi
    sleep 1
done

echo "⚠️ 服务启动超时，请检查日志: $LOG_FILE"
exit 1
