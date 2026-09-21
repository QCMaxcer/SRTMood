# SRTMood 一键启动脚本
# 流程：检查环境 -> 安装依赖 -> 构建产物 -> 启动本地服务 -> 打开界面
[CmdletBinding()]
param(
  [int]$Port = 3001,
  [switch]$Rebuild,
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

$logDir = Join-Path $root "logs"

function Write-Title([string]$text) { Write-Host ""; Write-Host "== $text" -ForegroundColor Cyan }
function Write-Info([string]$text) { Write-Host "   $text" -ForegroundColor Gray }
function Write-Done([string]$text) { Write-Host "   $text" -ForegroundColor Green }
function Write-Warn([string]$text) { Write-Host "   $text" -ForegroundColor Yellow }
function Write-Fail([string]$text) { Write-Host "   $text" -ForegroundColor Red }

function Test-PortInUse([int]$port) {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $client.Connect("127.0.0.1", $port)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Test-SrtMoodEndpoint([int]$port) {
  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/api/settings/status" -TimeoutSec 2 -UseBasicParsing
    return ($response.StatusCode -eq 200 -and $response.Content -match "configured")
  } catch {
    return $false
  }
}

function Get-LatestSourceWriteTime([string[]]$paths) {
  $latest = [datetime]::MinValue
  foreach ($p in $paths) {
    if (-not (Test-Path -LiteralPath $p)) { continue }
    foreach ($item in (Get-ChildItem -LiteralPath $p -Recurse -File -ErrorAction SilentlyContinue)) {
      if ($item.LastWriteTimeUtc -gt $latest) { $latest = $item.LastWriteTimeUtc }
    }
  }
  return $latest
}

function Find-AppBrowser {
  $bases = @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:LOCALAPPDATA)
  $relatives = @(
    "Microsoft\Edge\Application\msedge.exe",
    "Google\Chrome\Application\chrome.exe"
  )

  foreach ($base in $bases) {
    if ([string]::IsNullOrEmpty($base)) { continue }
    foreach ($relative in $relatives) {
      $candidate = Join-Path $base $relative
      if (Test-Path -LiteralPath $candidate) { return $candidate }
    }
  }

  return $null
}

Write-Host ""
Write-Host "  SRTMood - 字幕情绪分析工具" -ForegroundColor White
Write-Host "  ----------------------------------------" -ForegroundColor DarkGray

# 1. 运行环境
Write-Title "检查运行环境"
$node = Get-Command node -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue

if (-not $node -or -not $npm) {
  Write-Fail "未检测到 Node.js / npm。"
  Write-Info "请先安装 Node.js 20 或更高版本：https://nodejs.org/zh-cn/download"
  Write-Info "安装完成后重新双击本启动文件即可。"
  exit 1
}

$nodeVersion = (& node -v).Trim().TrimStart("v")
Write-Done "Node.js $nodeVersion"
Write-Done "npm $(& npm -v)"

$nodeMajor = 0
[void][int]::TryParse(($nodeVersion -split "\.")[0], [ref]$nodeMajor)
if ($nodeMajor -lt 20) {
  Write-Warn "建议升级到 Node.js 20 或更高版本，当前版本可能导致构建失败。"
}

# 2. 依赖
Write-Title "检查项目依赖"
$nodeModules = Join-Path $root "node_modules"
$lockFile = Join-Path $root "package-lock.json"
$installMarker = Join-Path $nodeModules ".package-lock.json"
$needInstall = $false

if (-not (Test-Path -LiteralPath $nodeModules)) {
  $needInstall = $true
} elseif (@("vite", "tsx", "express", "@typesafe-ai\sdk") | Where-Object { -not (Test-Path -LiteralPath (Join-Path $nodeModules $_)) }) {
  $needInstall = $true
} elseif ((Test-Path -LiteralPath $lockFile) -and -not (Test-Path -LiteralPath $installMarker)) {
  $needInstall = $true
} elseif ((Test-Path -LiteralPath $lockFile) -and (Test-Path -LiteralPath $installMarker) -and ((Get-Item -LiteralPath $lockFile).LastWriteTimeUtc -gt (Get-Item -LiteralPath $installMarker).LastWriteTimeUtc)) {
  $needInstall = $true
}

if ($needInstall) {
  Write-Info "正在安装依赖，首次运行可能需要几分钟..."
  & npm install --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) {
    Write-Fail "依赖安装失败，请检查网络后重试。"
    exit 1
  }
  Write-Done "依赖安装完成"
} else {
  Write-Done "依赖已就绪"
}

# 3. 构建成果
Write-Title "检查构建产物"
$sourcePaths = @(
  (Join-Path $root "client\src"),
  (Join-Path $root "client\index.html"),
  (Join-Path $root "client\package.json"),
  (Join-Path $root "client\vite.config.ts"),
  (Join-Path $root "server\src"),
  (Join-Path $root "server\package.json")
)
$artifacts = @(
  (Join-Path $root "client\dist\index.html"),
  (Join-Path $root "server\dist\index.js")
)

$needBuild = [bool]$Rebuild
foreach ($artifact in $artifacts) {
  if (-not (Test-Path -LiteralPath $artifact)) { $needBuild = $true }
}

if (-not $needBuild) {
  $oldestArtifact = [datetime]::MaxValue
  foreach ($artifact in $artifacts) {
    $written = (Get-Item -LiteralPath $artifact).LastWriteTimeUtc
    if ($written -lt $oldestArtifact) { $oldestArtifact = $written }
  }
  if ((Get-LatestSourceWriteTime $sourcePaths) -gt $oldestArtifact) {
    $needBuild = $true
    Write-Info "检测到源代码有更新"
  }
}

if ($needBuild) {
  Write-Info "正在构建前端与后端，约需 10-60 秒..."
  & npm run build
  if ($LASTEXITCODE -ne 0) {
    Write-Fail "构建失败，请查看上方错误信息。"
    exit 1
  }
  Write-Done "构建完成"
} else {
  Write-Done "构建产物已是最新"
}

# 4. 定位可用端口
Write-Title "启动本地服务"
$selectedPort = 0
$alreadyRunning = $false

for ($offset = 0; $offset -le 20; $offset++) {
  $candidate = $Port + $offset

  if (Test-SrtMoodEndpoint $candidate) {
    $selectedPort = $candidate
    $alreadyRunning = $true
    break
  }

  if (-not (Test-PortInUse $candidate)) {
    $selectedPort = $candidate
    break
  }
}

if ($selectedPort -eq 0) {
  Write-Fail "端口 $Port-$($Port + 20) 均被其它程序占用，无法启动。"
  exit 1
}

$url = "http://127.0.0.1:$selectedPort/"

if ($alreadyRunning) {
  Write-Done "检测到 SRTMood 已在 $url 运行，直接打开界面"
} else {
  New-Item -ItemType Directory -Force -Path $logDir | Out-Null
  $outLog = Join-Path $logDir "server.out.log"
  $errLog = Join-Path $logDir "server.err.log"

  $env:PORT = "$selectedPort"
  $serverProcess = Start-Process -FilePath $node.Source `
    -ArgumentList @("server/dist/index.js") `
    -WorkingDirectory $root `
    -WindowStyle Hidden `
    -PassThru `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog

  Set-Content -LiteralPath (Join-Path $logDir "server.pid") -Value $serverProcess.Id -Encoding ASCII

  $ready = $false
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    Start-Sleep -Milliseconds 500
    if ($serverProcess.HasExited) { break }
    if (Test-SrtMoodEndpoint $selectedPort) { $ready = $true; break }
  }

  if (-not $ready) {
    Write-Fail "服务启动失败。"
    if (Test-Path -LiteralPath $errLog) {
      Write-Host ""
      foreach ($line in (Get-Content -LiteralPath $errLog -Tail 20)) {
        Write-Host "   $line" -ForegroundColor DarkGray
      }
    }
    exit 1
  }

  Write-Done "服务已启动（端口 $selectedPort，进程 $($serverProcess.Id)）"
}

# 5. 首次使用提示
$envPath = Join-Path $root "server\.env"
$hasKey = $false
if (Test-Path -LiteralPath $envPath) {
  $hasKey = [bool](Select-String -LiteralPath $envPath -Pattern "^\s*TYPESAFE_API_KEY\s*=\s*\S+" -Quiet -ErrorAction SilentlyContinue)
}

# 6. 打开界面
if (-not $NoBrowser) {
  Write-Title "打开界面"
  $browser = Find-AppBrowser
  if ($browser) {
    Start-Process -FilePath $browser -ArgumentList @("--app=$url", "--window-size=1440,900")
    Write-Done "已用应用窗口打开界面（$([System.IO.Path]::GetFileName($browser))）"
  } else {
    Start-Process $url
    Write-Done "已在默认浏览器中打开界面"
  }
}

if (-not $hasKey) {
  Write-Warn "尚未配置 TypeSafe API Key，请在界面左侧设置面板中填写。"
}

Write-Host ""
Write-Host "  界面地址：$url" -ForegroundColor White
Write-Host "  服务日志：$logDir" -ForegroundColor DarkGray
Write-Host "  停止服务：双击 “停止 SRTMood.bat”" -ForegroundColor DarkGray
Write-Host ""

exit 0
