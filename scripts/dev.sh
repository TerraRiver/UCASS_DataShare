#!/bin/bash

# UCASS DataShare 开发环境启动脚本

echo "🚀 启动 UCASS DataShare 开发环境..."

# 检查环境变量文件
if [ ! -f "apps/api-backend/.env" ]; then
    echo "❌ 环境变量文件不存在，请先运行安装脚本或手动创建 .env 文件"
    exit 1
fi

# 检查数据库连接
echo "🔍 检查数据库连接..."
if ! psql -d ucass_datashare -c "SELECT 1;" &> /dev/null; then
    echo "❌ 无法连接到数据库，请检查：" 
    echo "   1. PostgreSQL 服务是否运行"
    echo "   2. 数据库 'ucass_datashare' 是否存在"
    echo "   3. .env 文件中的数据库配置是否正确"
    exit 1
fi

echo "✅ 数据库连接正常"

# 检查 Python 依赖
echo "🐍 检查 Python 依赖..."
cd apps/python-service
if ! python -c "import fastapi, pandas, plotly" &> /dev/null; then
    echo "❌ Python 依赖缺失，正在安装..."
    pip install -r requirements.txt
fi
cd ../..

echo "✅ Python 依赖检查完成"

# 启动所有服务
echo "🌟 启动所有服务..."
echo "   - 前端: http://localhost:3000"
echo "   - 后端API: http://localhost:3001" 
echo "   - Python服务: http://localhost:8000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 使用 Bun 启动所有服务
bun dev 