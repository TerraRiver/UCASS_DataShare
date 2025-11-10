@echo off
REM UCASS DataShare 一键备份脚本 (Windows)
REM 备份数据库和上传文件

setlocal enabledelayedexpansion

echo ========================================
echo    UCASS DataShare 备份工具 (Windows)
echo ========================================
echo.

REM 配置项（请根据实际情况修改）
set DB_NAME=ucass_datashare
set DB_USER=ucass_datashare
set DB_HOST=localhost
set DB_PORT=5432
set UPLOAD_DIR=uploads
set BACKUP_DIR=backups
set KEEP_DAYS=30

REM 检查 PostgreSQL 是否安装
where pg_dump >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 pg_dump 命令！
    echo 请确保 PostgreSQL 已安装并添加到系统 PATH
    echo 通常路径为: C:\Program Files\PostgreSQL\15\bin
    pause
    exit /b 1
)

REM 生成时间戳
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%
set BACKUP_NAME=ucass_backup_%TIMESTAMP%
set BACKUP_PATH=%BACKUP_DIR%\%BACKUP_NAME%

echo 备份配置：
echo   数据库: %DB_NAME%
echo   用户: %DB_USER%
echo   主机: %DB_HOST%:%DB_PORT%
echo   上传目录: %UPLOAD_DIR%
echo   备份目录: %BACKUP_DIR%
echo   保留天数: %KEEP_DAYS% 天
echo.

REM 创建备份目录
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%BACKUP_PATH%" mkdir "%BACKUP_PATH%"
echo [√] 创建备份目录: %BACKUP_PATH%

REM 1. 备份数据库
echo.
echo [1/3] 备份数据库...
set PGPASSWORD=%DB_PASSWORD%
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% > "%BACKUP_PATH%\database.sql"
if %errorlevel% equ 0 (
    echo [√] 数据库备份成功
    for %%A in ("%BACKUP_PATH%\database.sql") do (
        set size=%%~zA
        set /a sizeMB=!size! / 1048576
        echo   文件大小: !sizeMB! MB
    )
) else (
    echo [×] 数据库备份失败！
    echo 提示: 请设置环境变量 DB_PASSWORD 或配置 pgpass.conf
    pause
    exit /b 1
)

REM 2. 备份上传文件
echo.
echo [2/3] 备份上传文件...
if exist "%UPLOAD_DIR%" (
    xcopy "%UPLOAD_DIR%" "%BACKUP_PATH%\uploads\" /E /I /Y >nul
    if %errorlevel% equ 0 (
        echo [√] 上传文件备份成功
        for /f %%A in ('dir /s /b "%BACKUP_PATH%\uploads" ^| find /c /v ""') do set FILE_COUNT=%%A
        echo   文件数量: !FILE_COUNT!
    ) else (
        echo [×] 上传文件备份失败
        pause
        exit /b 1
    )
) else (
    echo [!] 上传目录不存在，跳过文件备份
)

REM 3. 创建备份信息文件
echo.
echo [3/3] 生成备份信息...
(
echo UCASS DataShare 备份信息
echo ========================
echo 备份时间: %date% %time%
echo 数据库名: %DB_NAME%
echo 数据库用户: %DB_USER%
echo 数据库主机: %DB_HOST%:%DB_PORT%
echo 上传目录: %UPLOAD_DIR%
echo 备份版本: 1.0.0
echo.
echo 文件列表:
echo - database.sql (数据库备份^)
echo - uploads\ (上传文件^)
echo.
echo 恢复命令:
echo cd scripts ^&^& restore.bat %BACKUP_NAME%
) > "%BACKUP_PATH%\backup_info.txt"
echo [√] 备份信息文件已创建

REM 4. 压缩备份（使用 tar 或 7zip，如果可用）
echo.
echo 压缩备份文件...
where tar >nul 2>&1
if %errorlevel% equ 0 (
    tar -czf "%BACKUP_DIR%\%BACKUP_NAME%.tar.gz" -C "%BACKUP_DIR%" "%BACKUP_NAME%"
    if %errorlevel% equ 0 (
        echo [√] 压缩完成 (使用 tar^)
        rmdir /s /q "%BACKUP_PATH%"
        echo [√] 清理临时文件
    )
) else (
    where 7z >nul 2>&1
    if %errorlevel% equ 0 (
        7z a -tzip "%BACKUP_DIR%\%BACKUP_NAME%.zip" "%BACKUP_PATH%\*" >nul
        if %errorlevel% equ 0 (
            echo [√] 压缩完成 (使用 7zip^)
            rmdir /s /q "%BACKUP_PATH%"
            echo [√] 清理临时文件
        )
    ) else (
        echo [!] 未找到压缩工具，保留未压缩的备份
        echo 建议安装 7-Zip: https://www.7-zip.org/
    )
)

REM 5. 清理旧备份
echo.
echo 清理旧备份...
REM Windows 没有简单的 mtime 等效命令，这里简化处理
echo [!] Windows 下需要手动清理旧备份，或使用 PowerShell 脚本
echo 建议定期清理 %BACKUP_DIR% 目录中超过 %KEEP_DAYS% 天的文件

REM 完成
echo.
echo ========================================
echo          备份完成！
echo ========================================
echo.
echo 备份位置: %BACKUP_DIR%\%BACKUP_NAME%
echo.
echo 恢复命令:
echo   cd scripts ^&^& restore.bat %BACKUP_NAME%
echo.
pause
