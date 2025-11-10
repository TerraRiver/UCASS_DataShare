#!/bin/bash
# UCASS DataShare 一键备份脚本 (Linux/Ubuntu)
# 备份数据库和上传文件

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== UCASS DataShare 备份工具 ===${NC}"
echo ""

# 配置项（请根据实际情况修改）
DB_NAME="${DB_NAME:-ucass_datashare}"
DB_USER="${DB_USER:-ucass_datashare}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
UPLOAD_DIR="${UPLOAD_DIR:-./uploads}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-30}"  # 保留备份天数

# 生成时间戳
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="ucass_backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

echo -e "${YELLOW}备份配置：${NC}"
echo "  数据库: ${DB_NAME}"
echo "  用户: ${DB_USER}"
echo "  主机: ${DB_HOST}:${DB_PORT}"
echo "  上传目录: ${UPLOAD_DIR}"
echo "  备份目录: ${BACKUP_DIR}"
echo "  保留天数: ${KEEP_DAYS} 天"
echo ""

# 创建备份目录
mkdir -p "${BACKUP_PATH}"
echo -e "${GREEN}✓${NC} 创建备份目录: ${BACKUP_PATH}"

# 1. 备份数据库
echo ""
echo -e "${YELLOW}[1/3] 备份数据库...${NC}"
if PGPASSWORD="${DB_PASSWORD}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" > "${BACKUP_PATH}/database.sql"; then
    echo -e "${GREEN}✓${NC} 数据库备份成功"
    DB_SIZE=$(du -h "${BACKUP_PATH}/database.sql" | cut -f1)
    echo "  文件大小: ${DB_SIZE}"
else
    echo -e "${RED}✗${NC} 数据库备份失败！"
    echo -e "${YELLOW}提示: 请设置环境变量 DB_PASSWORD 或在提示时输入密码${NC}"
    exit 1
fi

# 2. 备份上传文件
echo ""
echo -e "${YELLOW}[2/3] 备份上传文件...${NC}"
if [ -d "${UPLOAD_DIR}" ]; then
    # 计算文件数量
    FILE_COUNT=$(find "${UPLOAD_DIR}" -type f | wc -l)
    echo "  发现 ${FILE_COUNT} 个文件"

    # 复制文件
    cp -r "${UPLOAD_DIR}" "${BACKUP_PATH}/uploads"
    echo -e "${GREEN}✓${NC} 上传文件备份成功"

    UPLOADS_SIZE=$(du -sh "${BACKUP_PATH}/uploads" | cut -f1)
    echo "  文件大小: ${UPLOADS_SIZE}"
else
    echo -e "${YELLOW}⚠${NC} 上传目录不存在，跳过文件备份"
fi

# 3. 创建备份信息文件
echo ""
echo -e "${YELLOW}[3/3] 生成备份信息...${NC}"
cat > "${BACKUP_PATH}/backup_info.txt" <<EOF
UCASS DataShare 备份信息
========================
备份时间: $(date '+%Y-%m-%d %H:%M:%S')
数据库名: ${DB_NAME}
数据库用户: ${DB_USER}
数据库主机: ${DB_HOST}:${DB_PORT}
上传目录: ${UPLOAD_DIR}
备份版本: 1.0.0

文件列表:
- database.sql (数据库备份)
- uploads/ (上传文件)

恢复命令:
cd scripts && ./restore.sh ${BACKUP_NAME}
EOF
echo -e "${GREEN}✓${NC} 备份信息文件已创建"

# 4. 压缩备份
echo ""
echo -e "${YELLOW}压缩备份文件...${NC}"
cd "${BACKUP_DIR}"
if tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"; then
    echo -e "${GREEN}✓${NC} 压缩完成"
    ARCHIVE_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
    echo "  压缩包大小: ${ARCHIVE_SIZE}"

    # 删除未压缩的目录
    rm -rf "${BACKUP_NAME}"
    echo -e "${GREEN}✓${NC} 清理临时文件"
else
    echo -e "${RED}✗${NC} 压缩失败"
    exit 1
fi

# 5. 清理旧备份
echo ""
echo -e "${YELLOW}清理旧备份...${NC}"
OLD_BACKUPS=$(find "${BACKUP_DIR}" -name "ucass_backup_*.tar.gz" -mtime +${KEEP_DAYS} | wc -l)
if [ "${OLD_BACKUPS}" -gt 0 ]; then
    find "${BACKUP_DIR}" -name "ucass_backup_*.tar.gz" -mtime +${KEEP_DAYS} -delete
    echo -e "${GREEN}✓${NC} 已删除 ${OLD_BACKUPS} 个旧备份（超过 ${KEEP_DAYS} 天）"
else
    echo "  无需清理"
fi

# 完成
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        备份完成！                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "备份文件: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo "备份大小: ${ARCHIVE_SIZE}"
echo ""
echo -e "${YELLOW}恢复命令:${NC}"
echo "  cd scripts && ./restore.sh ${BACKUP_NAME}"
echo ""
