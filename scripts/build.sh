#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

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
        return 0
    fi
    
    local java_paths=(
        "/usr/lib/jvm/java-17-openjdk-amd64/bin/java"
        "/usr/lib/jvm/java-11-openjdk-amd64/bin/java"
        "/usr/lib/jvm/default-java/bin/java"
    )
    
    for path in "${java_paths[@]}"; do
        if [[ -x "$path" ]]; then
            return 0
        fi
    done
    
    return 1
}

# 构建 Java 后端
build_java_backend() {
    log_info "Building Java backend..."
    
    if ! check_java; then
        log_warn "Java not found, installing OpenJDK 17..."
        apt-get update -qq
        apt-get install -y -qq --no-install-recommends openjdk-17-jre-headless
    fi
    
    cd "${COZE_WORKSPACE_PATH}/java-backend"
    
    if [ -f "target/product-management-backend-1.0.0.jar" ]; then
        log_info "JAR file already exists, skipping build"
    else
        log_info "Building JAR with Maven..."
        if mvn package -DskipTests -q; then
            log_info "Maven build successful"
        else
            log_error "Maven build failed"
            return 1
        fi
    fi
    
    cd "${COZE_WORKSPACE_PATH}"
    return 0
}

# 主流程
log_info "=== Building Project ==="

# 安装 Node.js 依赖
log_info "Installing Node.js dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel warn

# 构建 Java 后端
build_java_backend || log_warn "Java backend build skipped"

# 构建 Next.js
log_info "Building Next.js application..."
npx next build

log_info "Build completed successfully!"
