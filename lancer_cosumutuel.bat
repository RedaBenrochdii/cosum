@echo off
cd /d %~dp0
start "" cmd /c "npm run dev"
start "" cmd /c "node backend/server.js"
timeout /t 1 > nul
start http://localhost:5173/
