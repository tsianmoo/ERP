#!/bin/bash

# 设置数据库连接环境变量
export SPRING_DATASOURCE_URL="jdbc:postgresql://cp-brave-chill-a58cc292.pg5.aidap-global.cn-beijing.volces.com:5432/postgres?sslmode=require"
export SPRING_DATASOURCE_USERNAME="postgres"
export SPRING_DATASOURCE_PASSWORD="xukT35ij4q9j2r6mjH"

# 启动 Java 后端服务
cd /workspace/projects/java-backend
java -jar target/product-management-backend-1.0.0.jar
