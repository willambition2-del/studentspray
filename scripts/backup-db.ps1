# PostgreSQL Database Backup Script (PowerShell)
# Usage: .\scripts\backup-db.ps1 [-DatabaseUrl "postgresql://user:pass@host:port/dbname"] [-OutputDir "./backups"]

param (
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [string]$OutputDir = "./backups"
)

if (-not $DatabaseUrl) {
    Write-Error "DATABASE_URL is not set and was not passed as a parameter."
    exit 1
}

# Clean Prisma query parameters for pg_dump
$CleanDbUrl = $DatabaseUrl -replace '\?schema=[^&]*', '' -replace '\?sslmode=[^&]*', ''
if ($CleanDbUrl.EndsWith("?")) { $CleanDbUrl = $CleanDbUrl.Substring(0, $CleanDbUrl.Length - 1) }

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Auto-detect pg_dump executable
$PgDump = "pg_dump"
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    $CommonPaths = @(
        "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
    )
    foreach ($p in $CommonPaths) {
        if (Test-Path $p) {
            $PgDump = $p
            break
        }
    }
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $OutputDir "quran_forum_backup_$Timestamp.dump"

Write-Host "Starting PostgreSQL database backup to $BackupFile using $PgDump..."
& $PgDump --dbname=$CleanDbUrl --format=custom --file=$BackupFile --no-owner --no-privileges

if ($LASTEXITCODE -eq 0 -and (Test-Path $BackupFile)) {
    $FileSize = (Get-Item $BackupFile).Length / 1MB
    Write-Host ("Backup completed successfully: {0} ({1:N2} MB)" -f $BackupFile, $FileSize)
} else {
    Write-Error "Database backup failed."
    exit 1
}
