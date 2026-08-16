# PostgreSQL Database Restore Script (PowerShell)
# Usage: .\scripts\restore-db.ps1 -BackupFile "path/to/backup.dump" [-DatabaseUrl "postgresql://user:pass@host:port/dbname"] [-Clean]

param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [switch]$Clean
)

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file does not exist: $BackupFile"
    exit 1
}

if (-not $DatabaseUrl) {
    Write-Error "DATABASE_URL is not set and was not passed as a parameter."
    exit 1
}

# Clean Prisma query parameters for pg_restore
$CleanDbUrl = $DatabaseUrl -replace '\?schema=[^&]*', '' -replace '\?sslmode=[^&]*', ''
if ($CleanDbUrl.EndsWith("?")) { $CleanDbUrl = $CleanDbUrl.Substring(0, $CleanDbUrl.Length - 1) }

# Auto-detect pg_restore executable
$PgRestore = "pg_restore"
if (-not (Get-Command pg_restore -ErrorAction SilentlyContinue)) {
    $CommonPaths = @(
        "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe",
        "C:\Program Files\PostgreSQL\16\bin\pg_restore.exe",
        "C:\Program Files\PostgreSQL\15\bin\pg_restore.exe"
    )
    foreach ($p in $CommonPaths) {
        if (Test-Path $p) {
            $PgRestore = $p
            break
        }
    }
}

$CleanArg = if ($Clean) { "--clean --if-exists" } else { "" }

Write-Host "Restoring PostgreSQL database from $BackupFile using $PgRestore..."
if ($Clean) {
    & $PgRestore --dbname=$CleanDbUrl --no-owner --no-privileges --clean --if-exists $BackupFile
} else {
    & $PgRestore --dbname=$CleanDbUrl --no-owner --no-privileges $BackupFile
}

if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) {
    Write-Host "Database restore completed successfully."
} else {
    Write-Error "Database restore failed with exit code $LASTEXITCODE."
    exit 1
}
