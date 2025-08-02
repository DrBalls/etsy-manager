@echo off
echo ===================================
echo Etsy Manager Pro - Windows Deploy
echo ===================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Desktop is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)
echo [OK] Docker Desktop is running

REM Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js is installed

REM Check/Install pnpm
pnpm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing pnpm...
    npm install -g pnpm@9.15.0
)
echo [OK] pnpm is installed

REM Create .env if it doesn't exist
if not exist .env (
    if exist .env.docker.example (
        copy .env.docker.example .env
        echo.
        echo IMPORTANT: Edit .env file to add your Etsy API credentials!
        echo Get them from: https://www.etsy.com/developers/register
        echo.
        notepad .env
        pause
    ) else (
        echo ERROR: .env.docker.example not found!
        pause
        exit /b 1
    )
)

REM Copy .env to app directories
if not exist apps\web mkdir apps\web
if not exist apps\api mkdir apps\api
copy .env apps\web\.env >nul
copy .env apps\api\.env >nul

echo.
echo Installing dependencies...
call pnpm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Building applications...
call pnpm build

echo.
echo Starting services with Docker...
docker-compose down >nul 2>&1
docker-compose up -d

if %errorlevel% equ 0 (
    echo.
    echo Waiting for services to start...
    timeout /t 10 /nobreak >nul
    
    echo Setting up database...
    docker-compose exec -T web pnpm exec prisma generate
    docker-compose exec -T web pnpm exec prisma migrate deploy
    
    echo.
    echo ===================================
    echo Deployment Complete!
    echo ===================================
    echo.
    echo Access your application at:
    echo   Web: http://localhost:3000
    echo   API: http://localhost:8000
    echo.
    echo Useful commands:
    echo   View logs:    docker-compose logs -f
    echo   Stop:         docker-compose down
    echo   Restart:      docker-compose restart
    echo.
) else (
    echo ERROR: Failed to start services
    echo Check Docker Desktop and try again
)

pause