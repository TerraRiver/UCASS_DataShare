#!/bin/bash

###############################################################################
# UCASS DataShare - 数据备份脚本
# 备份数据库和上传文件
###############################################################################

set -e

# 配置
BACKUP_ROOT="/var/backups/ucass_datashare"
DATE=$(date +%Y%m%d_%H%M%S)
POSTGRES_CONTAINER="ucass_postgres"
DB_NAME="ucass_datashare"
DB_USER="ucass_datashare"
UPLOADS_VOLUME="ucass_datashare_uploads_data"
KEEP_DAYS=7  # 保留最近 7 天的备份

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 创建备份目录
mkdir -p "$BACKUP_ROOT/database"
mkdir -p "$BACKUP_ROOT/uploads"

echo "=============================================="
echo "  UCASS DataShare - 数据备份"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="
echo ""

# 1. 备份数据库
echo -e "${GREEN}[1/2]${NC} 备份数据库..."
DB_BACKUP_FILE="$BACKUP_ROOT/database/db_backup_$DATE.sql.gz"

if docker exec $POSTGRES_CONTAINER pg_dump -U $DB_USER $DB_NAME | gzip > "$DB_BACKUP_FILE"; then
    echo "  ✓ 数据库备份完成: $DB_BACKUP_FILE"
    echo "  大小: $(du -h "$DB_BACKUP_FILE" | cut -f1)"
else
    echo "  ✗ 数据库备份失败"
    exit 1
fi
echo ""

# 2. 备份上传文件
echo -e "${GREEN}[2/2]${NC} 备份上传文件..."
UPLOADS_BACKUP_FILE="$BACKUP_ROOT/uploads/uploads_$DATE.tar.gz"

if docker run --rm \
    -v ${UPLOADS_VOLUME}:/source:ro \
    -v $BACKUP_ROOT/uploads:/backup \
    alpine tar czf /backup/uploads_$DATE.tar.gz -C /source . 2>/dev/null; then
    echo "  ✓ 文件备份完成: $UPLOADS_BACKUP_FILE"
    echo "  大小: $(du -h "$UPLOADS_BACKUP_FILE" | cut -f1)"
else
    echo "  ✗ 文件备份失败"
    exit 1
fi
echo ""

# 3. 清理旧备份
echo "清理旧备份 (保留最近 $KEEP_DAYS 天)..."
find "$BACKUP_ROOT/database" -name "db_backup_*.sql.gz" -mtime +$KEEP_DAYS -delete 2>/dev/null || true
find "$BACKUP_ROOT/uploads" -name "uploads_*.tar.gz" -mtime +$KEEP_DAYS -delete 2>/dev/null || true
echo "  ✓ 旧备份清理完成"
echo ""

# 4. 显示备份统计
echo "=============================================="
echo "备份完成！"
echo "=============================================="
echo "备份位置: $BACKUP_ROOT"
echo ""
echo "数据库备份:"
ls -lh "$BACKUP_ROOT/database" | tail -n 5
echo ""
echo "文件备份:"
ls -lh "$BACKUP_ROOT/uploads" | tail -n 5
echo ""
echo "总磁盘使用:"
du -sh "$BACKUP_ROOT"
echo "=============================================="
