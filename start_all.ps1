Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Starting Gemini Chatbot (Backend + Frontend)..." -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; & 'C:\Users\durga\AppData\Local\Programs\Python\Python314\python.exe' app.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend\frontend'; npm run dev"

Write-Host "Backend URL:  http://localhost:5000" -ForegroundColor Green
Write-Host "Frontend URL: http://localhost:5173" -ForegroundColor Green
