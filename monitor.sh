#!/bin/bash

###############################################################################
# UCASS DataShare - 系统监控脚本
# 显示服务状态、资源使用情况和健康检查
###############################################################################

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 清屏
clear

echo "=============================================="
echo "  UCASS DataShare - 系统监控"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="
echo ""

# 1. 服务状态
echo -e "${CYAN}[1] 服务状态${NC}"
echo "-------------------------------------------"
docker compose ps
echo ""

# 2. 容器资源使用
echo -e "${CYAN}[2] 容器资源使用${NC}"
echo "-------------------------------------------"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
echo ""

# 3. 磁盘空间
echo -e "${CYAN}[3] 磁盘空间${NC}"
echo "-------------------------------------------"
df -h | grep -E '^/dev/|Filesystem'
echo ""
echo "Docker 磁盘使用:"
docker system df
echo ""

# 4. 数据卷大小
echo -e "${CYAN}[4] 数据卷大小${NC}"
echo "-------------------------------------------"
docker volume ls | grep ucass
echo ""
echo "详细大小:"
docker system df -v | grep ucass || echo "无法获取详细大小"
echo ""

# 5. 服务健康检查
echo -e "${CYAN}[5] 服务健康检查${NC}"
echo "-------------------------------------------"

# 检查 PostgreSQL
if docker compose exec -T postgres pg_isready > /dev/null 2>&1; then
    echo -e "PostgreSQL:  ${GREEN}✓ 正常${NC}"
else
    echo -e "PostgreSQL:  ${RED}✗ 异常${NC}"
fi

# 检查 API
if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
    echo -e "API Backend: ${GREEN}✓ 正常${NC}"
else
    echo -e "API Backend: ${RED}✗ 异常${NC}"
fi

# 检查前端
if curl -f -s http://localhost/ > /dev/null 2>&1; then
    echo -e "Web Frontend:${GREEN}✓ 正常${NC}"
else
    echo -e "Web Frontend:${RED}✗ 异常${NC}"
fi

# 检查 Nginx
if docker compose exec -T nginx nginx -t > /dev/null 2>&1; then
    echo -e "Nginx:       ${GREEN}✓ 正常${NC}"
else
    echo -e "Nginx:       ${RED}✗ 配置异常${NC}"
fi
echo ""

# 6. 最近的错误日志
echo -e "${CYAN}[6] 最近的错误日志 (最近 10 条)${NC}"
echo "-------------------------------------------"
docker compose logs --tail=10 | grep -i error || echo "无错误日志"
echo ""

# 7. 端口监听
echo -e "${CYAN}[7] 端口监听${NC}"
echo "-------------------------------------------"
if command -v netstat > /dev/null 2>&1; then
    netstat -tlnp 2>/dev/null | grep -E ':(80|443|5432|30001|30002)' || echo "端口未监听"
elif command -v ss > /dev/null 2>&1; then
    ss -tlnp | grep -E ':(80|443|5432|30001|30002)' || echo "端口未监听"
else
    echo "无法检查端口 (netstat/ss 未安装)"
fi
echo ""

# 8. 数据库连接数
echo -e "${CYAN}[8] 数据库连接${NC}"
echo "-------------------------------------------"
CONNECTIONS=$(docker compose exec -T postgres psql -U ucass_datashare -d ucass_datashare -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='ucass_datashare';" 2>/dev/null | tr -d ' ')
if [ ! -z "$CONNECTIONS" ]; then
    echo "当前连接数: $CONNECTIONS"
else
    echo "无法获取连接数"
fi
echo ""

echo "=============================================="
echo "监控完成"
echo ""
echo "快捷操作:"
echo "  查看实时日志:   docker compose logs -f"
echo "  重启所有服务:   docker compose restart"
echo "  重启单个服务:   docker compose restart <service>"
echo "=============================================="
