#!/bin/bash
# 环境检查脚本 - 用于诊断启动问题

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== 环境检查 ===${NC}"
echo ""

# 检查 Java
echo -e "${YELLOW}[1/5] Java 环境${NC}"
if command -v java &> /dev/null; then
    java -version 2>&1 | head -1
    echo -e "   ${GREEN}✓ Java 已安装${NC}"
else
    echo -e "   ${RED}✗ Java 未安装${NC}"
fi
echo ""

# 检查 Node.js
echo -e "${YELLOW}[2/5] Node.js 环境${NC}"
node -v 2>/dev/null && echo -e "   ${GREEN}✓ Node.js 已安装${NC}" || echo -e "   ${RED}✗ Node.js 未安装${NC}"
echo ""

# 检查数据库连接
echo -e "${YELLOW}[3/5] 数据库配置${NC}"
if [ -n "$PGDATABASE_URL" ]; then
    echo "   PGDATABASE_URL: 已设置"
    # 解析并显示数据库信息
    DB_INFO=$(python3 -c "
from urllib.parse import urlparse
url = '$PGDATABASE_URL'
parsed = urlparse(url)
print(f'   主机: {parsed.hostname}')
print(f'   端口: {parsed.port}')
print(f'   数据库: {parsed.path.lstrip(\"/\").split(\"?\")[0]}')
" 2>/dev/null)
    echo "$DB_INFO"
    echo -e "   ${GREEN}✓ 数据库 URL 已配置${NC}"
else
    echo -e "   ${RED}✗ PGDATABASE_URL 未设置${NC}"
fi
echo ""

# 检查端口
echo -e "${YELLOW}[4/5] 端口状态${NC}"
check_port() {
    local port=$1
    if ss -tuln 2>/dev/null | grep -q ":${port} "; then
        echo -e "   端口 ${port}: ${GREEN}已监听${NC}"
    else
        echo -e "   端口 ${port}: ${RED}未监听${NC}"
    fi
}
check_port 5000
check_port 8080
echo ""

# 检查进程
echo -e "${YELLOW}[5/5] 运行进程${NC}"
if pgrep -f "java.*product-management-backend" > /dev/null; then
    echo -e "   Java 后端: ${GREEN}运行中${NC}"
    pgrep -f "java.*product-management-backend" | xargs -I {} ps -o pid=,args= -p {} | head -1
else
    echo -e "   Java 后端: ${RED}未运行${NC}"
fi

if pgrep -f "next dev" > /dev/null; then
    echo -e "   Next.js 前端: ${GREEN}运行中${NC}"
else
    echo -e "   Next.js 前端: ${RED}未运行${NC}"
fi
echo ""

# 服务健康检查
echo -e "${BLUE}=== 服务健康检查 ===${NC}"
echo ""

# Java 后端健康检查
echo -e "${YELLOW}Java 后端 (http://localhost:8080)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health 2>/dev/null)
if [ "$RESPONSE" = "200" ]; then
    echo -e "   健康检查: ${GREEN}正常 (HTTP 200)${NC}"
    curl -s http://localhost:8080/actuator/health 2>/dev/null | python3 -m json.tool 2>/dev/null | head -10
else
    echo -e "   健康检查: ${RED}异常 (HTTP ${RESPONSE})${NC}"
fi
echo ""

# Next.js 前端检查
echo -e "${YELLOW}Next.js 前端 (http://localhost:5000)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>/dev/null)
if [ "$RESPONSE" = "200" ]; then
    echo -e "   页面访问: ${GREEN}正常 (HTTP 200)${NC}"
else
    echo -e "   页面访问: ${RED}异常 (HTTP ${RESPONSE})${NC}"
fi
echo ""

# API 代理检查
echo -e "${YELLOW}API 代理 (http://localhost:5000/api/products)${NC}"
RESPONSE=$(curl -s http://localhost:5000/api/products?limit=1 2>/dev/null)
if [ -n "$RESPONSE" ]; then
    echo -e "   API 响应: ${GREEN}正常${NC}"
    echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   商品数量: {d.get(\"total\", 0)}')" 2>/dev/null
else
    echo -e "   API 响应: ${RED}无响应${NC}"
fi
echo ""

echo -e "${BLUE}=== 检查完成 ===${NC}"
