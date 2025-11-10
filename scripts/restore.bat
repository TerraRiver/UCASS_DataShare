@echo off
REM UCASS DataShare 一键恢复脚本 (Windows)
REM 恢复数据库和上传文件

setlocal enabledelayedexpansion

echo ========================================
echo    UCASS DataShare 恢复工具 (Windows)
echo ========================================
echo.

REM 检查参数
if "%~1"=="" (
    echo [错误] 请指定备份文件名或路径
    echo.
    echo 用法:
    echo   %~nx0 ^<备份文件名^>
    echo   %~nx0 path\to\backup.tar.gz
    echo.
    echo 示例:
    echo   %~nx0 ucass_backup_20250110_143000
    echo.
    echo 可用的备份:
    if exist "backups\*.tar.gz" (
        dir /b backups\*.tar.gz
    ) else if exist "backups\*.zip" (
        dir /b backups\*.zip
    ) else (
        echo   (无备份文件^)
    )
    pause
    exit /b 1
)

REM 配置项
set DB_NAME=ucass_datashare
set DB_USER=ucass_datashare
set DB_HOST=localhost
set DB_PORT=5432
set UPLOAD_DIR=uploads
set BACKUP_DIR=backups

REM 确定备份文件路径
set BACKUP_INPUT=%~1
if exist "%BACKUP_INPUT%" (
    set BACKUP_FILE=%BACKUP_INPUT%
) else if exist "%BACKUP_DIR%\%BACKUP_INPUT%.tar.gz" (
    set BACKUP_FILE=%BACKUP_DIR%\%BACKUP_INPUT%.tar.gz
) else if exist "%BACKUP_DIR%\%BACKUP_INPUT%.zip" (
    set BACKUP_FILE=%BACKUP_DIR%\%BACKUP_INPUT%.zip
) else if exist "%BACKUP_DIR%\%BACKUP_INPUT%" (
    set BACKUP_FILE=%BACKUP_DIR%\%BACKUP_INPUT%
) else (
    echo [错误] 备份文件不存在: %BACKUP_INPUT%
    pause
    exit /b 1
)

echo 恢复配置：
echo   备份文件: %BACKUP_FILE%
echo   数据库: %DB_NAME%
echo   用户: %DB_USER%
echo   主机: %DB_HOST%:%DB_PORT%
echo   上传目录: %UPLOAD_DIR%
echo.

REM 警告提示
echo ========================================
echo  警告：此操作将覆盖现有数据！
echo ========================================
echo.
echo 请确认：
echo   1. 当前数据库和文件将被替换
echo   2. 建议在恢复前先备份当前数据
echo.
set /p CONFIRM="确定要继续吗？(输入 YES 继续): "
if /i not "%CONFIRM%"=="YES" (
    echo 已取消恢复操作
    pause
    exit /b 0
)

REM 创建临时目录
set TEMP_DIR=%TEMP%\ucass_restore_%RANDOM%
mkdir "%TEMP_DIR%"
echo [√] 创建临时目录: %TEMP_DIR%

REM 1. 解压备份
echo.
echo [1/4] 解压备份文件...
if "%BACKUP_FILE:~-7%"==".tar.gz" (
    REM 使用 tar 解压
    tar -xzf "%BACKUP_FILE%" -C "%TEMP_DIR%"
    if %errorlevel% equ 0 (
        echo [√] 解压完成 (tar^)
    ) else (
        echo [×] 解压失败
        rmdir /s /q "%TEMP_DIR%"
        pause
        exit /b 1
    )
) else if "%BACKUP_FILE:~-4%"==".zip" (
    REM 使用 7zip 或 PowerShell 解压
    where 7z >nul 2>&1
    if %errorlevel% equ 0 (
        7z x "%BACKUP_FILE%" -o"%TEMP_DIR%" -y >nul
        echo [√] 解压完成 (7zip^)
    ) else (
        powershell -command "Expand-Archive -Path '%BACKUP_FILE%' -DestinationPath '%TEMP_DIR%'"
        if %errorlevel% equ 0 (
            echo [√] 解压完成 (PowerShell^)
        ) else (
            echo [×] 解压失败，请安装 7-Zip
            rmdir /s /q "%TEMP_DIR%"
            pause
            exit /b 1
        )
    )
) else (
    REM 目录形式的备份
    xcopy "%BACKUP_FILE%" "%TEMP_DIR%\" /E /I /Y >nul
    echo [√] 复制完成
)

REM 查找解压后的目录
for /d %%D in ("%TEMP_DIR%\ucass_backup_*") do set EXTRACTED_DIR=%%D
if not defined EXTRACTED_DIR (
    REM 可能直接解压在 TEMP_DIR
    if exist "%TEMP_DIR%\database.sql" (
        set EXTRACTED_DIR=%TEMP_DIR%
    ) else (
        echo [×] 未找到备份目录
        rmdir /s /q "%TEMP_DIR%"
        pause
        exit /b 1
    )
)

echo   备份目录: !EXTRACTED_DIR!

REM 2. 显示备份信息
if exist "!EXTRACTED_DIR!\backup_info.txt" (
    echo.
    echo 备份信息：
    findstr /C:"备份时间" /C:"数据库名" /C:"备份版本" "!EXTRACTED_DIR!\backup_info.txt"
    echo.
)

REM 3. 恢复数据库
echo [2/4] 恢复数据库...
if not exist "!EXTRACTED_DIR!\database.sql" (
    echo [×] 数据库备份文件不存在
    rmdir /s /q "%TEMP_DIR%"
    pause
    exit /b 1
)

echo   请确保应用服务已停止...
echo   (如果使用 PM2，请执行: pm2 stop ucass-api^)
timeout /t 3 >nul

echo   删除现有数据库...
set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;" 2>nul

echo   创建新数据库...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME%;"

echo   导入数据...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% < "!EXTRACTED_DIR!\database.sql" >nul
if %errorlevel% equ 0 (
    echo [√] 数据库恢复成功
) else (
    echo [×] 数据库恢复失败
    echo 提示: 请设置环境变量 DB_PASSWORD
    rmdir /s /q "%TEMP_DIR%"
    pause
    exit /b 1
)

REM 4. 恢复上传文件
echo.
echo [3/4] 恢复上传文件...
if exist "!EXTRACTED_DIR!\uploads" (
    if exist "%UPLOAD_DIR%" (
        REM 备份现有文件
        set BACKUP_OLD=%UPLOAD_DIR%.backup_%RANDOM%
        move "%UPLOAD_DIR%" "!BACKUP_OLD!" >nul
        echo   旧文件已备份到: !BACKUP_OLD!
    )

    xcopy "!EXTRACTED_DIR!\uploads" "%UPLOAD_DIR%\" /E /I /Y >nul
    if %errorlevel% equ 0 (
        echo [√] 上传文件恢复成功
        for /f %%A in ('dir /s /b "%UPLOAD_DIR%" ^| find /c /v ""') do echo   文件数量: %%A
    ) else (
        echo [×] 上传文件恢复失败
    )
) else (
    echo [!] 备份中没有上传文件
)

REM 5. 清理临时文件
echo.
echo [4/4] 清理临时文件...
rmdir /s /q "%TEMP_DIR%"
echo [√] 清理完成

REM 完成
echo.
echo ========================================
echo          恢复完成！
echo ========================================
echo.
echo 后续步骤：
echo   1. 重启应用服务
echo      PM2: pm2 restart ucass-api
echo.
echo   2. 检查应用是否正常运行
echo      访问: http://localhost:30001
echo.
echo   3. 验证数据完整性
echo      登录管理后台检查数据
echo.
pause
