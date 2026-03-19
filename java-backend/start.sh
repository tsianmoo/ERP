#!/bin/bash

# 解析 PGDATABASE_URL 环境变量
# 格式: postgresql://user:password@host:port/database?params

PG_URL=${PGDATABASE_URL:-""}

if [ -n "$PG_URL" ]; then
    # 提取用户名
    DB_USER=$(echo "$PG_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
    
    # 提取密码
    DB_PASSWORD=$(echo "$PG_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
    
    # 提取 host 和 port
    DB_HOST=$(echo "$PG_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
    DB_PORT=$(echo "$PG_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
    
    # 提取数据库名
    DB_NAME=$(echo "$PG_URL" | sed -n 's|.*/\([^?]*\)?.*|\1|p')
    
    # 提取参数
    DB_PARAMS=$(echo "$PG_URL" | sed -n 's|.*?\(.*\)|\1|p')
    
    # 构建 JDBC URL
    export SPRING_DATASOURCE_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}?${DB_PARAMS}"
    export SPRING_DATASOURCE_USERNAME="$DB_USER"
    export SPRING_DATASOURCE_PASSWORD="$DB_PASSWORD"
    
    echo "Database connection configured:"
    echo "  Host: ${DB_HOST}:${DB_PORT}"
    echo "  Database: ${DB_NAME}"
    echo "  User: ${DB_USER}"
fi

# 启动 Spring Boot 应用
cd ${COZE_WORKSPACE_PATH}/java-backend
java -jar target/product-management-backend-1.0.0.jar
