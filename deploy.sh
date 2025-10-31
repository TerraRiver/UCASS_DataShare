#!/bin/bash

###############################################################################
# UCASS DataShare - 快速部署脚本
# 用于首次部署和快速启动应用
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 显示标题
echo "=============================================="
echo "  UCASS DataShare - 快速部署脚本"
echo "=============================================="
echo ""

# 1. 检查 Docker 和 Docker Compose
print_info "检查 Docker 环境..."
if ! command_exists docker; then
    print_error "Docker 未安装，请先安装 Docker"
    echo "安装指南: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! command_exists "docker compose"; then
    print_error "Docker Compose 未安装，请先安装 Docker Compose"
    echo "安装指南: https://docs.docker.com/compose/install/"
    exit 1
fi

print_success "Docker 环境检查通过"
echo "  Docker 版本: $(docker --version)"
echo "  Docker Compose 版本: $(docker compose version)"
echo ""

# 2. 检查 .env 文件
print_info "检查环境变量配置..."
if [ ! -f .env ]; then
    print_warning ".env 文件不存在，正在从模板创建..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success ".env 文件已创建"
        print_warning "⚠️  请编辑 .env 文件并修改默认密码！"
        echo ""
        read -p "是否现在编辑 .env 文件? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env
        fi
    else
        print_error ".env.example 文件不存在"
        exit 1
    fi
else
    print_success ".env 文件已存在"

    # 检查是否使用了默认密码
    if grep -q "Ww2368963068" .env || grep -q "admin123" .env; then
        print_warning "⚠️  检测到默认密码，生产环境请务必修改！"
    fi
fi
echo ""

# 3. 检查必要目录
print_info "创建必要的目录..."
mkdir -p nginx/conf.d
mkdir -p apps/api-backend/uploads
print_success "目录创建完成"
echo ""

# 4. 询问是否构建镜像
echo "准备部署应用..."
read -p "是否需要构建 Docker 镜像? (首次部署选 y) (y/n) " -n 1 -r
echo
BUILD_FLAG=""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    BUILD_FLAG="--build"
fi

# 5. 启动服务
print_info "启动 Docker 服务..."
docker compose up -d $BUILD_FLAG

# 6. 等待服务启动
print_info "等待服务启动..."
sleep 10

# 7. 检查服务状态
print_info "检查服务状态..."
docker compose ps

# 8. 显示日志
echo ""
print_info "显示最近的日志（按 Ctrl+C 退出）..."
sleep 2
docker compose logs --tail=50

# 9. 显示访问信息
echo ""
echo "=============================================="
print_success "部署完成！"
echo "=============================================="
echo ""
echo "访问地址:"
echo "  前台页面: http://localhost"
echo "  管理后台: http://localhost/admin/login"
echo "  API 接口: http://localhost/api"
echo ""
echo "默认管理员账号:"
echo "  用户名: admin"
echo "  密码: admin123 (请立即修改)"
echo ""
echo "常用命令:"
echo "  查看服务状态: docker compose ps"
echo "  查看日志:     docker compose logs -f"
echo "  停止服务:     docker compose down"
echo "  重启服务:     docker compose restart"
echo ""
print_warning "⚠️  生产环境部署请阅读 DEPLOYMENT.md 文档"
echo "=============================================="
