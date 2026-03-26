# Run this script as Administrator to reset MySQL root password

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "This script must run as Administrator. Restarting..."
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host "Running as Administrator..." -ForegroundColor Green

$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin"
cd $mysqlPath

Write-Host "`nStopping MySQL80 service..." -ForegroundColor Cyan
net stop MySQL80 /y 2>$null
Start-Sleep -Seconds 2

Write-Host "Starting MySQL in safe mode (skip-grant-tables)..." -ForegroundColor Cyan
Start-Process "$mysqlPath\mysqld.exe" -ArgumentList "--skip-grant-tables --skip-networking" -WindowStyle Hidden
Start-Sleep -Seconds 3

Write-Host "Creating password reset SQL file..." -ForegroundColor Cyan
@"
FLUSH PRIVILEGES;
SET PASSWORD FOR 'root'@'localhost' = 'root123';
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root123';
FLUSH PRIVILEGES;
"@ | Out-File -FilePath "$env:TEMP\mysql_reset.sql" -Encoding ASCII -Force

Write-Host "Executing password reset..." -ForegroundColor Cyan
& "$mysqlPath\mysql.exe" -u root < "$env:TEMP\mysql_reset.sql"
Start-Sleep -Seconds 1

Write-Host "Stopping safe mode MySQL..." -ForegroundColor Cyan
taskkill /IM mysqld.exe /F 2>$null
Start-Sleep -Seconds 2

Write-Host "Starting MySQL80 service normally..." -ForegroundColor Cyan
net start MySQL80
Start-Sleep -Seconds 2

Write-Host "`nTesting connection..." -ForegroundColor Cyan
& "$mysqlPath\mysql.exe" -u root -p"root123" -e "SELECT 'Success!' as status;" 2>&1

Write-Host "`n✓ MySQL root password has been set to: root123" -ForegroundColor Green
Write-Host "`nYou can now use this in Django:" -ForegroundColor Yellow
