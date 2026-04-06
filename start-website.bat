@echo off
echo ========================================
echo  CAR RENTAL WEBSITE AUTO STARTUP
echo ========================================

echo Step 1: Starting MySQL (XAMPP)...
cd "C:\xampp"
call mysql_start.bat

timeout /t 5 /nobreak > nul

echo Step 2: Initializing Database...
cd "C:\Users\DELL\OneDrive\Desktop\Car Rental Project\Backend"
node init-db.js

timeout /t 2 /nobreak > nul

echo Step 3: Starting Backend Server...
start cmd /k "cd /d C:\Users\DELL\OneDrive\Desktop\Car Rental Project\Backend && node server.js"

timeout /t 3 /nobreak > nul

echo Step 4: Starting Frontend Server...
start cmd /k "cd /d C:\Users\DELL\OneDrive\Desktop\Car Rental Project\frontend && npm start"

echo ========================================
echo  ALL SERVICES STARTED!
echo  - MySQL: localhost:3306
echo  - Backend: http://localhost:5000
echo  - Frontend: http://localhost:3000
echo ========================================
echo Press any key to exit...
pause > nul