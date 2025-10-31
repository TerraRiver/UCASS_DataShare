#!/bin/bash

###############################################################################
# UCASS DataShare - 数据恢复脚本
# 从备份恢复数据库和上传文件
###############################################################################

set -e

# 配置
BACKUP_ROOT="/var/backups/ucass_datashare"
POSTGRES_CONTAINER="ucass_postgres"
DB_NAME="ucass_datashare"
DB_USER="ucass_datashare"
UPLOADS_VOLUME="ucass_datashare_uploads_data"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=============================================="
echo "  UCASS DataShare - 数据恢复"
echo "=============================================="
echo ""

# 检查备份目录
if [ ! -d "$BACKUP_ROOT" ]; then
    echo -e "${RED}错误:${NC} 备份目录不存在: $BACKUP_ROOT"
    exit 1
fi

# 列出可用的数据库备份
echo "可用的数据库备份:"
DB_BACKUPS=($(ls -1t "$BACKUP_ROOT/database"/db_backup_*.sql.gz 2>/dev/null))
if [ ${#DB_BACKUPS[@]} -eq 0 ]; then
    echo -e "${RED}  未找到数据库备份${NC}"
    exit 1
fi

for i in "${!DB_BACKUPS[@]}"; do
    echo "  [$i] $(basename ${DB_BACKUPS[$i]}) ($(du -h ${DB_BACKUPS[$i]} | cut -f1))"
done
echo ""

# 选择数据库备份
read -p "选择要恢复的数据库备份 (输入编号): " DB_CHOICE
if [ -z "$DB_CHOICE" ] || [ "$DB_CHOICE" -ge ${#DB_BACKUPS[@]} ]; then
    echo -e "${RED}错误:${NC} 无效的选择"
    exit 1
fi
DB_BACKUP_FILE="${DB_BACKUPS[$DB_CHOICE]}"
echo ""

# 列出可用的文件备份
echo "可用的文件备份:"
UPLOADS_BACKUPS=($(ls -1t "$BACKUP_ROOT/uploads"/uploads_*.tar.gz 2>/dev/null))
if [ ${#UPLOADS_BACKUPS[@]} -eq 0 ]; then
    echo -e "${YELLOW}  未找到文件备份${NC}"
    UPLOADS_BACKUP_FILE=""
else
    for i in "${!UPLOADS_BACKUPS[@]}"; do
        echo "  [$i] $(basename ${UPLOADS_BACKUPS[$i]}) ($(du -h ${UPLOADS_BACKUPS[$i]} | cut -f1))"
    done
    echo ""

    # 选择文件备份
    read -p "选择要恢复的文件备份 (输入编号，回车跳过): " UPLOADS_CHOICE
    if [ ! -z "$UPLOADS_CHOICE" ] && [ "$UPLOADS_CHOICE" -lt ${#UPLOADS_BACKUPS[@]} ]; then
        UPLOADS_BACKUP_FILE="${UPLOADS_BACKUPS[$UPLOADS_CHOICE]}"
    else
        UPLOADS_BACKUP_FILE=""
    fi
fi
echo ""

# 确认恢复
echo -e "${YELLOW}警告: 此操作将覆盖现有数据！${NC}"
echo "即将恢复:"
echo "  数据库: $(basename $DB_BACKUP_FILE)"
if [ ! -z "$UPLOADS_BACKUP_FILE" ]; then
    echo "  文件: $(basename $UPLOADS_BACKUP_FILE)"
fi
echo ""
read -p "确认恢复? (输入 yes 确认): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "已取消"
    exit 0
fi
echo ""

# 1. 停止 API 服务
echo -e "${GREEN}[1/3]${NC} 停止 API 服务..."
docker compose stop api
echo "  ✓ API 服务已停止"
echo ""

# 2. 恢复数据库
echo -e "${GREEN}[2/3]${NC} 恢复数据库..."
echo "  清空现有数据..."
docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "  导入备份数据..."
if gunzip -c "$DB_BACKUP_FILE" | docker exec -i $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
    echo "  ✓ 数据库恢复完成"
else
    echo -e "  ${RED}✗ 数据库恢复失败${NC}"
    docker compose start api
    exit 1
fi
echo ""

# 3. 恢复文件
if [ ! -z "$UPLOADS_BACKUP_FILE" ]; then
    echo -e "${GREEN}[3/3]${NC} 恢复上传文件..."
    if docker run --rm \
        -v ${UPLOADS_VOLUME}:/target \
        -v $BACKUP_ROOT/uploads:/backup \
        alpine sh -c "cd /target && rm -rf * && tar xzf /backup/$(basename $UPLOADS_BACKUP_FILE)" 2>/dev/null; then
        echo "  ✓ 文件恢复完成"
    else
        echo -e "  ${RED}✗ 文件恢复失败${NC}"
    fi
    echo ""
fi

# 4. 启动服务
echo "启动服务..."
docker compose start api
sleep 5

# 5. 检查服务状态
echo ""
echo "=============================================="
echo "恢复完成！"
echo "=============================================="
echo ""
docker compose ps
echo ""
echo "请检查应用是否正常运行"
