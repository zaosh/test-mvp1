@echo off
echo ============================================
echo   TESTLAB — Launch
echo ============================================
echo.

cd /d "%~dp0"

:: Check Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH.
    pause
    exit /b 1
)

:: Check .env.local exists
if not exist .env.local (
    echo [ERROR] .env.local not found.
    echo        Run setup.bat first, or copy .env.local.example to .env.local
    pause
    exit /b 1
)

:: Start Postgres container
echo [1/3] Starting PostgreSQL...
docker compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose failed. Is Docker Desktop running?
    pause
    exit /b 1
)

:: Wait for Postgres
echo [2/3] Waiting for PostgreSQL...
set RETRIES=0
:wait_loop
if %RETRIES% geq 20 (
    echo [ERROR] PostgreSQL did not become ready in time.
    pause
    exit /b 1
)
docker exec testlab-db pg_isready -U testlab >nul 2>&1
if %errorlevel% neq 0 (
    set /a RETRIES+=1
    timeout /t 2 /nobreak >nul
    goto wait_loop
)
echo       PostgreSQL is ready.

:: Launch dev server
echo [3/3] Starting dev server...
echo.
echo ============================================
echo   App: http://localhost:3000
echo   (Press Ctrl+C to stop)
echo ============================================
echo.

call npm run dev
