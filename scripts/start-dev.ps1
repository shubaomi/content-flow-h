param(
  [int]$FrontendPort = 5174,
  [int]$ApiPort = 3001,
  [string]$HostName = "127.0.0.1",
  [int]$RequiredNodeMajor = 22,
  [switch]$NoBrowser,
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "ContentFlow Dev Server"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot
New-Item -ItemType Directory -Force (Join-Path $projectRoot "logs") | Out-Null
$logFile = Join-Path $projectRoot "logs\start-dev.log"

function Stop-PortOwner {
  param([int]$Port)

  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if (-not $connections) {
    Write-Host "Port $Port is free."
    return
  }

  $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($processId in $processIds) {
    try {
      $process = Get-Process -Id $processId -ErrorAction Stop
      Write-Host "Stopping process $($process.ProcessName) ($processId) on port $Port..."
      Stop-Process -Id $processId -Force
    }
    catch {
      Write-Warning "Could not stop process $processId on port ${Port}: $($_.Exception.Message)"
    }
  }
}

function Write-PortStatus {
  param([int]$Port)

  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if (-not $connections) {
    Write-Host "Port $Port is free."
    return
  }

  $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($processId in $processIds) {
    try {
      $process = Get-Process -Id $processId -ErrorAction Stop
      Write-Host "Port $Port is in use by $($process.ProcessName) ($processId)."
    }
    catch {
      Write-Host "Port $Port is in use by process $processId."
    }
  }
}

function Get-NodeMajor {
  try {
    $major = & node -p "process.versions.node.split('.')[0]"
    return [int]$major
  }
  catch {
    return 0
  }
}

function Get-NodeVersionText {
  try {
    return (& node -v)
  }
  catch {
    return "not found"
  }
}

function Get-EnvironmentValue {
  param([string]$Name)

  $value = [Environment]::GetEnvironmentVariable($Name, "Process")
  if (-not $value) {
    $value = [Environment]::GetEnvironmentVariable($Name, "User")
  }
  if (-not $value) {
    $value = [Environment]::GetEnvironmentVariable($Name, "Machine")
  }
  return $value
}

function Ensure-NodeRuntime {
  $currentMajor = Get-NodeMajor
  $currentNodeVersion = Get-NodeVersionText
  if ($currentMajor -lt $RequiredNodeMajor) {
    throw "Current Node runtime is $currentNodeVersion. ContentFlow requires Node >= $RequiredNodeMajor."
  }

  Write-Host "Using Node runtime: $currentNodeVersion"
}

function Ensure-Dependencies {
  if (Test-Path -LiteralPath (Join-Path $projectRoot "node_modules")) {
    return
  }

  Write-Host "node_modules not found. Installing dependencies..."
  & npm.cmd install
}

function Set-DefaultEnvironment {
  $contentFlowDataDir = Get-EnvironmentValue -Name "CONTENTFLOW_DATA_DIR"
  if (-not $contentFlowDataDir) {
    $workspaceRoot = Resolve-Path (Join-Path $projectRoot "..")
    $defaultDataDir = Join-Path $workspaceRoot "contentflow-data"
    if (Test-Path -LiteralPath $defaultDataDir) {
      $contentFlowDataDir = $defaultDataDir
    }
  }
  if ($contentFlowDataDir) {
    $env:CONTENTFLOW_DATA_DIR = $contentFlowDataDir
  }

  $vaultDir = Get-EnvironmentValue -Name "HONGRUN_CONTENT_VAULT_DIR"
  if (-not $vaultDir) {
    $workspaceRoot = Resolve-Path (Join-Path $projectRoot "..")
    $defaultVaultDir = Join-Path $workspaceRoot "hongrun-content-vault"
    if (Test-Path -LiteralPath $defaultVaultDir) {
      $vaultDir = $defaultVaultDir
    }
  }
  if ($vaultDir) {
    $env:HONGRUN_CONTENT_VAULT_DIR = $vaultDir
  }

  if (-not (Get-EnvironmentValue -Name "HONGRUN_CONTENT_VAULT_REPO")) {
    $env:HONGRUN_CONTENT_VAULT_REPO = "git@github.com:shubaomi/hongrun-content-vault.git"
  }
}

try {
  "[$(Get-Date -Format o)] Starting ContentFlow dev launcher" | Out-File -FilePath $logFile -Encoding utf8 -Append

  Write-Host "ContentFlow dev launcher"
  Write-Host "Project: $projectRoot"
  Write-Host ""

  Ensure-NodeRuntime
  Ensure-Dependencies
  Set-DefaultEnvironment

  Write-Host "ContentFlow data: $($env:CONTENTFLOW_DATA_DIR)"
  Write-Host "Content vault:    $($env:HONGRUN_CONTENT_VAULT_DIR)"
  Write-Host ""

  if ($CheckOnly) {
    Write-PortStatus -Port $FrontendPort
    Write-PortStatus -Port $ApiPort

    Write-Host ""
    Write-Host "Startup check:"
    Write-Host "Frontend: http://$HostName`:$FrontendPort"
    Write-Host "API:      http://$HostName`:$ApiPort"
    Write-Host ""
    Write-Host "CheckOnly mode complete. Dev server was not started."
    return
  }

  Stop-PortOwner -Port $FrontendPort
  Stop-PortOwner -Port $ApiPort

  Write-Host ""
  Write-Host "Starting ContentFlow..."
  Write-Host "Frontend: http://$HostName`:$FrontendPort"
  Write-Host "API:      http://$HostName`:$ApiPort"
  Write-Host ""

  Write-Host "This window must stay open while ContentFlow is running."
  Write-Host "Press Ctrl+C in this window to stop the dev server."
  Write-Host ""

  if (-not $NoBrowser) {
    Start-Job -ScriptBlock {
      param([string]$Url)
      Start-Sleep -Seconds 5
      Start-Process $Url
    } -ArgumentList "http://$HostName`:$FrontendPort" | Out-Null
  }

  & npm.cmd run dev
}
catch {
  "[$(Get-Date -Format o)] ERROR: $($_.Exception.Message)" | Out-File -FilePath $logFile -Encoding utf8 -Append
  Write-Host ""
  Write-Host "ContentFlow failed to start." -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ""
  Write-Host "A startup log was written to: $logFile"
}
finally {
  Write-Host ""
  Write-Host "ContentFlow dev launcher has stopped."
  Read-Host "Press Enter to close this window"
}
