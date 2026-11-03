@echo off
echo ====================================================
echo Starting GenTalk (Backend + Frontend)...
echo ====================================================

start "GenTalk Backend" cmd /k "cd /d %~dp0 && "C:\Users\durga\AppData\Local\Programs\Python\Python314\python.exe" app.py"
start "GenTalk Frontend" cmd /k "cd /d %~dp0\frontend\frontend && npm run dev"

echo Website URL:  http://localhost:5000
echo Frontend URL: http://localhost:5173
echo.
