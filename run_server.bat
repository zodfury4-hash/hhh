@echo off
title HEA Link - Local PHP Development Server
echo ========================================================
echo    HEA Link — Local Server (PHP 8 + SQLite)
echo ========================================================
echo.
echo Starting PHP development server on http://localhost:8000 ...
echo Public root: public_html\
echo Database: data\app.db
echo.
echo Admin Login: http://localhost:8000/admin/login.php
echo Username: admin
echo Password: Admin@123
echo.
echo Press Ctrl+C in this window to stop the server anytime.
echo.

start http://localhost:8000

"C:\xampp\php\php.exe" -S localhost:8000 -t public_html
pause
