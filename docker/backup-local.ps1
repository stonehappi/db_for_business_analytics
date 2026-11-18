# ==============================================================================
# Local Computer Database Backup Script (PowerShell)
# ==============================================================================
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\docker\backup-local.ps1
#
# Dumps both app_db and sandbox_db into a timestamped directory (ideal for syncing
# to OneDrive, Google Drive, Dropbox, or an external drive).
# ==============================================================================

param (
    [string]$DestinationDir = "$env:USERPROFILE\OneDrive\DB_Platform_Backups"
)

$ErrorActionPreference = "Stop"

# Create destination folder if missing
if (-not (Test-Path $DestinationDir)) {
    Write-Host "[INFO] Creating backup destination folder: $DestinationDir"
    New-Item -ItemType Directory -Force -Path $DestinationDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$AppDumpFile = Join-Path $DestinationDir "app_db_$Timestamp.sql"
$SandboxDumpFile = Join-Path $DestinationDir "sandbox_db_$Timestamp.sql"

Write-Host "=========================================================="
Write-Host " Starting Local Database Backup ($Timestamp)"
Write-Host "=========================================================="

try {
    # 1. Backup app_db
    Write-Host "[1/2] Exporting app_db from Docker container..."
    docker exec -t db_platform_postgres_app pg_dump -U postgres -d app_db --clean --if-exists > $AppDumpFile
    $AppSize = (Get-Item $AppDumpFile).Length / 1KB
    Write-Host "      -> app_db dump saved ($([math]::Round($AppSize, 2)) KB): $AppDumpFile"

    # 2. Backup sandbox_db
    Write-Host "[2/2] Exporting sandbox_db from Docker container..."
    docker exec -t db_platform_postgres_sandbox pg_dump -U postgres -d sandbox_db --clean --if-exists > $SandboxDumpFile
    $SandboxSize = (Get-Item $SandboxDumpFile).Length / 1KB
    Write-Host "      -> sandbox_db dump saved ($([math]::Round($SandboxSize, 2)) KB): $SandboxDumpFile"

    Write-Host "=========================================================="
    Write-Host "[SUCCESS] Backup complete! If $DestinationDir is synced"
    Write-Host "          with OneDrive/Google Drive, files are uploading now."
    Write-Host "=========================================================="
}
catch {
    Write-Error "[ERROR] Backup failed: $_"
    exit 1
}
