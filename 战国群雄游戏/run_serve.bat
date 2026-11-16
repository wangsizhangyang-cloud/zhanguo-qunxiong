@echo off
cd /d "%~dp0"
start "Warring States server" cmd /c "node _server.mjs"
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:8642/
