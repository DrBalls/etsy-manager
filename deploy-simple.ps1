# Simple Etsy Manager Deployment for Windows

Write-Host "Etsy Manager Pro - Simple Windows Deployment" -ForegroundColor Blue
Write-Host "==========================================" -ForegroundColor Blue
Write-Host ""

# Check Docker
try {
    docker info | Out-Null
    Write-Host "[OK] Docker Desktop is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker Desktop is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit
}

# Check Node
try {
    $nodeVersion = node -v
    Write-Host "[OK] Node.js $nodeVersion installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found!" -ForegroundColor Red
    Write-Host "Install from: https://nodejs.org/" -ForegroundColor Yellow
    exit
}

# Check pnpm
try {
    $pnpmVersion = pnpm -v
    Write-Host "[OK] pnpm $pnpmVersion installed" -ForegroundColor Green
} catch {
    Write-Host "Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm@9.15.0
}

# Setup .env
if (!(Test-Path ".env")) {
    if (Test-Path ".env.docker.example") {
        Copy-Item ".env.docker.example" ".env"
        Write-Host "Created .env file" -ForegroundColor Green
        Write-Host "IMPORTANT: Edit .env with your Etsy API credentials!" -ForegroundColor Yellow
        notepad .env
        Read-Host "Press Enter after editing .env"
    }
}

# Copy to app dirs
if (!(Test-Path "apps\web")) { mkdir "apps\web" }
if (!(Test-Path "apps\api")) { mkdir "apps\api" }
Copy-Item ".env" "apps\web\.env" -Force
Copy-Item ".env" "apps\api\.env" -Force

# Install and build
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pnpm install

Write-Host "Building project..." -ForegroundColor Yellow
pnpm build

# Start Docker
Write-Host "Starting services..." -ForegroundColor Yellow
docker-compose down
docker-compose up -d

Start-Sleep -Seconds 10

# Setup database
Write-Host "Setting up database..." -ForegroundColor Yellow
docker-compose exec -T web pnpm exec prisma generate
docker-compose exec -T web pnpm exec prisma migrate deploy

Write-Host ""
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Web: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API: http://localhost:8000" -ForegroundColor Cyan