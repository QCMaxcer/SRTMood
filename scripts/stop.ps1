# 停止由 launch.ps1 启动的 SRTMood 本地服务
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$logDir = Join-Path $root "logs"
$pidFile = Join-Path $logDir "server.pid"
$stopped = 0

Write-Host ""
Write-Host "  正在停止 SRTMood 服务..." -ForegroundColor Cyan

if (Test-Path -LiteralPath $pidFile) {
  $serverProcessId = 0
  $rawPid = (Get-Content -LiteralPath $pidFile -TotalCount 1)
  if ($rawPid -and [int]::TryParse($rawPid.Trim(), [ref]$serverProcessId)) {
    if (Get-Process -Id $serverProcessId -ErrorAction SilentlyContinue) {
      Stop-Process -Id $serverProcessId -Force
      $stopped++
    }
  }
  Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

# 兜底：清理没有记录 PID 的残留进程
$leftovers = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -and $_.CommandLine -match "server[\\/]dist[\\/]index\.js" }

foreach ($leftover in $leftovers) {
  Stop-Process -Id $leftover.ProcessId -Force -ErrorAction SilentlyContinue
  $stopped++
}

if ($stopped -gt 0) {
  Write-Host "  服务已停止。" -ForegroundColor Green
} else {
  Write-Host "  当前没有正在运行的 SRTMood 服务。" -ForegroundColor Yellow
}

Write-Host ""
exit 0
