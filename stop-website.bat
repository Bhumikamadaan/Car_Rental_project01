@echo off
echo ========================================
echo  STOPPING CAR RENTAL WEBSITE
echo ========================================

echo Stopping Node.js processes...
taskkill /IM node.exe /F > nul 2>&1

echo Stopping MySQL...
cd "C:\xampp"
call mysql_stop.bat

echo ========================================
echo  ALL SERVICES STOPPED!
echo ========================================
pause