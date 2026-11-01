<#
.SYNOPSIS
    Deploy GHOSTLAB // Vaporware Graveyard (backend .NET 8 + frontend React/Three.js) to home-server.

.DESCRIPTION
    1. Build frontend (Vite) -> dist/
    2. Publish backend self-contained linux-x64 + copy dist vao wwwroot
    3. tar.gz -> scp len /tmp home-server
    4. Extract vao /opt/ghostlab, cai systemd unit, restart + verify /api/stats
    Requires SSH host alias "home-server" (user ducne) da cau hinh.
#>
param(
    [string]$HostName = 'home-server',
    [int]$Port = 5293,
    [string]$ServiceName = 'ghostlab',
    [string]$TargetDir = '/opt/ghostlab',
    [string]$SudoPass = '66668888',
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$TarFile = Join-Path $RepoRoot "deploy-update-$PID.tar.gz"
$RemoteScript = Join-Path $RepoRoot "deploy-remote-$PID.sh"

function Resolve-Tool($name) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = @(
        "C:\Program Files\Git\usr\bin\$name.exe",
        "C:\Program Files (x86)\Git\usr\bin\$name.exe",
        "$env:LOCALAPPDATA\Programs\Git\usr\bin\$name.exe",
        "$env:WINDIR\System32\OpenSSH\$name.exe"
    )
    foreach ($c in $candidates) { if (Test-Path $c) { return $c } }
    throw "Không tìm thấy '$name'. Cài OpenSSH Client hoặc Git for Windows."
}
$Scp = Resolve-Tool 'scp'
$Ssh = Resolve-Tool 'ssh'
Write-Host "scp: $Scp`nssh: $Ssh" -ForegroundColor DarkGray

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Deploy GHOSTLAB -> $HostName" -ForegroundColor Cyan
Write-Host "   Dir: $TargetDir | Service: $ServiceName | Port: $Port" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

try {
    if (!$SkipBuild) {
        Write-Host "`n[1/5] Build frontend..." -ForegroundColor Yellow
        Push-Location (Join-Path $RepoRoot 'frontend')
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
        Pop-Location

        Write-Host "`n[2/5] Publish backend (self-contained linux-x64)..." -ForegroundColor Yellow
        $pub = Join-Path $RepoRoot 'publish\linux-x64'
        if (Test-Path $pub) { try { Remove-Item $pub -Recurse -Force -ErrorAction SilentlyContinue } catch {} }
        dotnet publish (Join-Path $RepoRoot 'backend\GhostLab.csproj') `
            -c Release -r linux-x64 --self-contained true -o $pub
        if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed" }

        Write-Host "Copying frontend dist -> wwwroot..." -ForegroundColor Yellow
        $wwwroot = Join-Path $pub 'wwwroot'
        New-Item -ItemType Directory -Force -Path $wwwroot | Out-Null
        Copy-Item -Path (Join-Path $RepoRoot 'frontend\dist\*') -Destination $wwwroot -Recurse -Force
    }

    Write-Host "`n[3/5] Packaging..." -ForegroundColor Yellow
    Copy-Item (Join-Path $RepoRoot 'deploy\linux\ghostlab.service') `
        (Join-Path $RepoRoot 'publish\linux-x64\ghostlab.service') -Force
    if (Test-Path $TarFile) {
        try { Remove-Item $TarFile -Force -ErrorAction SilentlyContinue } catch { Start-Sleep -Milliseconds 500; Remove-Item $TarFile -Force -ErrorAction SilentlyContinue }
    }
    tar -czf $TarFile -C (Join-Path $RepoRoot 'publish\linux-x64') .

    $BashScript = @"
#!/usr/bin/env bash
set -euo pipefail
SVC="$ServiceName"
DIR="$TargetDir"
PORT="$Port"

echo "Extracting to /tmp/ghostlab-update..."
echo '$SudoPass' | sudo -S rm -rf /tmp/ghostlab-update
echo '$SudoPass' | sudo -S mkdir -p /tmp/ghostlab-update
echo '$SudoPass' | sudo -S chown -R ducne:ducne /tmp/ghostlab-update
tar --no-same-permissions -xzf /tmp/deploy-update.tar.gz -C /tmp/ghostlab-update || tar -xzf /tmp/deploy-update.tar.gz -C /tmp/ghostlab-update
echo '$SudoPass' | sudo -S chmod -R u+w /tmp/ghostlab-update

echo "Installing to `$DIR..."
echo '$SudoPass' | sudo -S mkdir -p "`$DIR"
echo '$SudoPass' | sudo -S rsync -av --delete --exclude='lab-state.json' --exclude='chat-secrets.json' /tmp/ghostlab-update/ "`$DIR/"
echo '$SudoPass' | sudo -S chown -R ducne:ducne "`$DIR"
echo '$SudoPass' | sudo -S chmod -R u+w "`$DIR"
chmod +x "`$DIR/GhostLab"

echo "Installing systemd unit `$SVC..."
echo '$SudoPass' | sudo -S cp /tmp/ghostlab-update/ghostlab.service /etc/systemd/system/`$SVC.service
echo '$SudoPass' | sudo -S systemctl daemon-reload
echo '$SudoPass' | sudo -S systemctl enable "`$SVC" >/dev/null 2>&1 || true
echo '$SudoPass' | sudo -S systemctl restart "`$SVC"

echo "Waiting for API on :`$PORT..."
for i in `$(seq 1 40); do
    if curl -fsS "http://127.0.0.1:`$PORT/api/stats" >/dev/null 2>&1; then
        echo "API OK: `$(curl -fsS http://127.0.0.1:`$PORT/api/stats || true)"
        exit 0
    fi
    sleep 1
done
echo "Service did not respond" >&2
echo '$SudoPass' | sudo -S journalctl -u "`$SVC" -n 30 --no-pager >&2
exit 1
"@
    $Unix = $BashScript -replace "`r`n", "`n"
    [System.IO.File]::WriteAllText($RemoteScript, $Unix, (New-Object System.Text.UTF8Encoding $false))

    Write-Host "`n[4/5] Uploading..." -ForegroundColor Yellow
    & $Scp $TarFile "${HostName}:/tmp/deploy-update.tar.gz"
    if ($LASTEXITCODE -ne 0) { throw "scp tar failed" }
    & $Scp $RemoteScript "${HostName}:/tmp/deploy-remote.sh"
    if ($LASTEXITCODE -ne 0) { throw "scp script failed" }

    Write-Host "`n[5/5] Installing + verifying on home-server..." -ForegroundColor Yellow
    & $Ssh $HostName "sed -i 's/\r$//' /tmp/deploy-remote.sh && bash /tmp/deploy-remote.sh && rm -rf /tmp/deploy-remote.sh /tmp/deploy-update.tar.gz /tmp/ghostlab-update"
    if ($LASTEXITCODE -ne 0) { throw "Remote install failed ($LASTEXITCODE)" }

    Write-Host "`nDEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "  Local:  http://127.0.0.1:$Port  (tren home-server)" -ForegroundColor Cyan
    Write-Host "  LAN:    http://192.168.11.101:$Port" -ForegroundColor Cyan
    Write-Host "  Status: ssh home-server 'systemctl status $ServiceName'" -ForegroundColor Cyan
}
finally {
    if (Test-Path $TarFile) { Remove-Item $TarFile -Force -ErrorAction SilentlyContinue }
    if (Test-Path $RemoteScript) { Remove-Item $RemoteScript -Force -ErrorAction SilentlyContinue }
}
