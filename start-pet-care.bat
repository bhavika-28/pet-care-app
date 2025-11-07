@echo off
title Pet Care Server
echo ========================================
echo    Pet Care Application Server
echo ========================================
echo Starting server...
echo.
echo Server will run at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
cd /d "%~dp0\backend"
node server.js
echo.
echo Server stopped. Press any key to exit...
pause >nul
