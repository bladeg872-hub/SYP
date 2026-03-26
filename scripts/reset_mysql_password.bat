@echo off
REM Reset MySQL Root Password Script
REM Run this as Administrator

cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"

echo.
echo Stopping MySQL Service...
net stop MySQL80

echo.
echo Starting MySQL in Safe Mode (skip grant tables)...
start mysqld.exe --skip-grant-tables --skip-networking

timeout /t 3

echo.
echo Resetting Password...
echo FLUSH PRIVILEGES; > reset.sql
echo ALTER USER 'root'@'localhost' IDENTIFIED BY 'admin123'; >> reset.sql
echo EXIT; >> reset.sql

mysql.exe -u root < reset.sql

echo.
echo Password reset to: admin123
echo.
echo Stopping MySQL (safe mode)...
taskkill /IM mysqld.exe /F

timeout /t 2

echo.
echo Restarting MySQL Service normally...
net start MySQL80

echo.
echo Done! Your MySQL root password is now: admin123
pause
