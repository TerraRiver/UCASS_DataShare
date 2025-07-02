# UCASS DataShare 服务启动脚本
Write-Host "🚀 启动 UCASS DataShare 服务..." -ForegroundColor Green

# 检查环境变量文件
if (!(Test-Path "apps\api-backend\.env")) {
    Write-Host "❌ 环境变量文件不存在，请先创建 .env 文件" -ForegroundColor Red
    Write-Host "运行: cp apps\api-backend\env.example apps\api-backend\.env" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 启动各个服务，请在新的终端窗口中运行：" -ForegroundColor Cyan

Write-Host "
终端1 - 前端服务:
cd apps\web-frontend
bun dev

终端2 - 后端服务:
cd apps\api-backend  
bun dev

终端3 - Python服务:
cd apps\python-service
python main.py
" -ForegroundColor White

Write-Host "🌐 服务地址：" -ForegroundColor Green
Write-Host "  前端: http://localhost:3000" -ForegroundColor White
Write-Host "  后端: http://localhost:3001" -ForegroundColor White  
Write-Host "  Python: http://localhost:8000" -ForegroundColor White 