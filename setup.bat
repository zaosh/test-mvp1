@echo off
echo ============================================
echo   TESTLAB — Setup & Launch
echo ============================================
echo.

:: Check for Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH.
    echo Please install Docker Desktop and try again.
    pause
    exit /b 1
)

:: Check for Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

cd /d "%~dp0"

:: Step 1: Create .env.local if it doesn't exist
if not exist .env.local (
    echo [1/7] Creating .env.local from example...
    copy .env.local.example .env.local >nul
    echo       Done.
) else (
    echo [1/7] .env.local already exists, skipping.
)

:: Step 2: Start Docker containers
echo [2/7] Starting PostgreSQL and pgAdmin containers...
docker compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose failed. Is Docker Desktop running?
    pause
    exit /b 1
)

:: Step 3: Install dependencies
echo [3/7] Installing npm dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [WARN] npm install reported an error, but this may be a warning. Continuing...
)

:: Step 4: Generate Prisma client
echo [4/7] Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Prisma generate failed.
    pause
    exit /b 1
)

:: Step 5: Wait for PostgreSQL to be ready
echo [5/7] Waiting for PostgreSQL to be ready...
set RETRIES=0
:wait_loop
if %RETRIES% geq 30 (
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

:: Step 6: Run migrations
echo [6/7] Running database migrations...
call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo [WARN] Migration may have already been applied. Continuing...
)

:: Step 7: Seed the database
echo [7/7] Seeding the database...
call npx prisma db seed
if %errorlevel% neq 0 (
    echo [WARN] Seed may have already been applied or encountered an issue.
)

echo.
echo ============================================
echo   Setup complete!
echo ============================================
echo.
echo   App:     http://localhost:3000
echo   pgAdmin: http://localhost:5050
echo.
echo   Login credentials:
echo     admin@testlab.internal / admin123
echo     qa@testlab.internal    / qa123
echo     eng1@testlab.internal  / eng123
echo     eng2@testlab.internal  / eng123
echo     manager@testlab.internal / mgr123
echo.
echo   Starting dev server...
echo   (Press Ctrl+C to stop)
echo.

call npm run dev
