# PowerShell脚本 - 启动前端服务
# 使用方法: 在PowerShell中运行 .\start-frontend.ps1

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  启动前端服务" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 检查当前目录
$currentDir = Get-Location
Write-Host "当前目录: $currentDir" -ForegroundColor Yellow

# 检查是否在正确的目录
if (-not (Test-Path "package.json")) {
    Write-Host "错误: 未找到package.json文件" -ForegroundColor Red
    Write-Host "请确保在 front-end/heatmap-project 目录下运行此脚本" -ForegroundColor Red
    exit 1
}

# 检查node_modules是否存在
if (-not (Test-Path "node_modules")) {
    Write-Host "警告: 未找到node_modules目录" -ForegroundColor Yellow
    Write-Host "正在安装依赖..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "正在启动前端服务..." -ForegroundColor Green
Write-Host "服务地址: http://localhost:8081" -ForegroundColor Green
Write-Host "Dashboard页面: http://localhost:8081/#/dashboard" -ForegroundColor Green
Write-Host ""
Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Yellow
Write-Host ""

# 启动服务
npm run serve

