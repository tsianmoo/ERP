#!/bin/bash

# 设置 Java 环境变量
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}"
export PATH="${JAVA_HOME}/bin:${PATH}"
JAVA_CMD="${JAVA_HOME}/bin/java"

# 设置数据库连接环境变量
export SPRING_DATASOURCE_URL="jdbc:postgresql://cp-brave-chill-a58cc292.pg5.aidap-global.cn-beijing.volces.com:5432/postgres?sslmode=require"
export SPRING_DATASOURCE_USERNAME="postgres"
export SPRING_DATASOURCE_PASSWORD="xukT35ij4q9j2r6mjH"

# 启动 Java 后端服务
cd /workspace/projects/java-backend
"${JAVA_CMD}" -jar target/product-management-backend-1.0.0.jar
