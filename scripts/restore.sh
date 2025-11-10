#!/bin/bash
# UCASS DataShare 一键恢复脚本 (Linux/Ubuntu)
# 恢复数据库和上传文件

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== UCASS DataShare 恢复工具 ===${NC}"
echo ""

# 检查参数
if [ -z "$1" ]; then
    echo -e "${RED}错误: 请指定备份文件名或路径${NC}"
    echo ""
    echo "用法:"
    echo "  $0 <备份文件名>          # 从 ./backups/ 目录恢复"
    echo "  $0 /path/to/backup.tar.gz  # 从指定路径恢复"
    echo ""
    echo "示例:"
    echo "  $0 ucass_backup_20250110_143000"
    echo "  $0 /tmp/ucass_backup_20250110_143000.tar.gz"
    echo ""
    echo "可用的备份:"
    if [ -d "./backups" ]; then
        ls -lh ./backups/*.tar.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
    else
        echo "  (无备份文件)"
    fi
    exit 1
fi

# 配置项
DB_NAME="${DB_NAME:-ucass_datashare}"
DB_USER="${DB_USER:-ucass_datashare}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
UPLOAD_DIR="${UPLOAD_DIR:-./uploads}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

# 确定备份文件路径
BACKUP_INPUT="$1"
if [[ "${BACKUP_INPUT}" == *.tar.gz ]]; then
    # 完整路径
    BACKUP_FILE="${BACKUP_INPUT}"
else
    # 只提供了名称
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_INPUT}.tar.gz"
fi

# 检查备份文件是否存在
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}✗ 备份文件不存在: ${BACKUP_FILE}${NC}"
    exit 1
fi

echo -e "${YELLOW}恢复配置：${NC}"
echo "  备份文件: ${BACKUP_FILE}"
echo "  数据库: ${DB_NAME}"
echo "  用户: ${DB_USER}"
echo "  主机: ${DB_HOST}:${DB_PORT}"
echo "  上传目录: ${UPLOAD_DIR}"
echo ""

# 警告提示
echo -e "${RED}⚠ 警告：此操作将覆盖现有数据！${NC}"
echo -e "${YELLOW}请确认：${NC}"
echo "  1. 当前数据库和文件将被替换"
echo "  2. 建议在恢复前先备份当前数据"
echo ""
read -p "确定要继续吗？(输入 YES 继续): " CONFIRM

if [ "${CONFIRM}" != "YES" ]; then
    echo -e "${YELLOW}已取消恢复操作${NC}"
    exit 0
fi

# 创建临时目录
TEMP_DIR=$(mktemp -d)
echo ""
echo -e "${GREEN}✓${NC} 创建临时目录: ${TEMP_DIR}"

# 1. 解压备份
echo ""
echo -e "${YELLOW}[1/4] 解压备份文件...${NC}"
if tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"; then
    echo -e "${GREEN}✓${NC} 解压完成"

    # 查找解压后的目录
    EXTRACTED_DIR=$(find "${TEMP_DIR}" -maxdepth 1 -type d -name "ucass_backup_*" | head -n 1)

    if [ -z "${EXTRACTED_DIR}" ]; then
        echo -e "${RED}✗ 未找到备份目录${NC}"
        rm -rf "${TEMP_DIR}"
        exit 1
    fi

    echo "  备份目录: ${EXTRACTED_DIR}"
else
    echo -e "${RED}✗ 解压失败${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# 2. 显示备份信息
if [ -f "${EXTRACTED_DIR}/backup_info.txt" ]; then
    echo ""
    echo -e "${YELLOW}备份信息：${NC}"
    cat "${EXTRACTED_DIR}/backup_info.txt" | grep -E "(备份时间|数据库名|备份版本)" | sed 's/^/  /'
    echo ""
fi

# 3. 恢复数据库
echo -e "${YELLOW}[2/4] 恢复数据库...${NC}"
if [ ! -f "${EXTRACTED_DIR}/database.sql" ]; then
    echo -e "${RED}✗ 数据库备份文件不存在${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

echo "  停止应用服务以避免数据冲突..."
echo -e "${YELLOW}  (如果使用 PM2，请手动执行: pm2 stop ucass-api)${NC}"

echo "  删除现有数据库..."
PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null || true

echo "  创建新数据库..."
PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME};"

echo "  导入数据..."
if PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" < "${EXTRACTED_DIR}/database.sql" > /dev/null; then
    echo -e "${GREEN}✓${NC} 数据库恢复成功"
else
    echo -e "${RED}✗${NC} 数据库恢复失败"
    echo -e "${YELLOW}提示: 请设置环境变量 DB_PASSWORD 或在提示时输入密码${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# 4. 恢复上传文件
echo ""
echo -e "${YELLOW}[3/4] 恢复上传文件...${NC}"
if [ -d "${EXTRACTED_DIR}/uploads" ]; then
    # 备份现有文件（可选）
    if [ -d "${UPLOAD_DIR}" ]; then
        BACKUP_OLD="${UPLOAD_DIR}.backup_$(date +%s)"
        mv "${UPLOAD_DIR}" "${BACKUP_OLD}"
        echo "  旧文件已备份到: ${BACKUP_OLD}"
    fi

    # 恢复文件
    cp -r "${EXTRACTED_DIR}/uploads" "${UPLOAD_DIR}"

    FILE_COUNT=$(find "${UPLOAD_DIR}" -type f | wc -l)
    echo -e "${GREEN}✓${NC} 上传文件恢复成功 (${FILE_COUNT} 个文件)"
else
    echo -e "${YELLOW}⚠${NC} 备份中没有上传文件"
fi

# 5. 清理临时文件
echo ""
echo -e "${YELLOW}[4/4] 清理临时文件...${NC}"
rm -rf "${TEMP_DIR}"
echo -e "${GREEN}✓${NC} 清理完成"

# 完成
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        恢复完成！                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}后续步骤：${NC}"
echo "  1. 重启应用服务"
echo "     PM2: pm2 restart ucass-api"
echo "     Systemd: sudo systemctl restart ucass-backend"
echo ""
echo "  2. 检查应用是否正常运行"
echo "     访问: http://your-domain.com"
echo ""
echo "  3. 验证数据完整性"
echo "     登录管理后台检查数据"
echo ""
