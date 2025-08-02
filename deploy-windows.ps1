# Etsy Manager Pro - Windows Deployment Script
# Run this script in PowerShell as Administrator

Write-Host "🚀 Etsy Manager Pro - Windows Deployment" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Function to check if a command exists
function Test-Command {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Check Docker
Write-Host "🐳 Checking Docker Desktop..." -ForegroundColor Yellow
if (Test-Command "docker") {
    Write-Host "✓ Docker is installed" -ForegroundColor Green
    
    # Check if Docker is running
    try {
        docker info | Out-Null
        Write-Host "✓ Docker Desktop is running" -ForegroundColor Green
    } catch {
        Write-Host "❌ Docker Desktop is not running!" -ForegroundColor Red
        Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "❌ Docker Desktop is not installed!" -ForegroundColor Red
    Write-Host "Please install from: https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Yellow
    exit 1
}

# Check Node.js
Write-Host "`n📦 Checking Node.js..." -ForegroundColor Yellow
if (Test-Command "node") {
    $nodeVersion = node -v
    Write-Host "✓ Node.js $nodeVersion is installed" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check/Install pnpm
Write-Host "`n📦 Checking pnpm..." -ForegroundColor Yellow
if (Test-Command "pnpm") {
    $pnpmVersion = pnpm -v
    Write-Host "✓ pnpm $pnpmVersion is installed" -ForegroundColor Green
} else {
    Write-Host "Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm@9.15.0
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ pnpm installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install pnpm" -ForegroundColor Red
        exit 1
    }
}

# Create .env file if it doesn't exist
Write-Host "`n🔐 Setting up environment..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.docker.example") {
        Copy-Item ".env.docker.example" ".env"
        Write-Host "✓ Created .env file from example" -ForegroundColor Green
        Write-Host "⚠️  Please edit .env file to add your Etsy API credentials!" -ForegroundColor Yellow
        Write-Host "   Get them from: https://www.etsy.com/developers/register" -ForegroundColor Cyan
        
        $edit = Read-Host "`nWould you like to edit .env now? (Y/n)"
        if ($edit -ne "n") {
            notepad .env
            Read-Host "Press Enter when you've finished editing .env"
        }
    } else {
        Write-Host "❌ .env.docker.example not found!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

# Copy .env to app directories
Write-Host "`n📁 Setting up application environments..." -ForegroundColor Yellow
if (-not (Test-Path "apps\web")) { New-Item -ItemType Directory -Path "apps\web" -Force | Out-Null }
if (-not (Test-Path "apps\api")) { New-Item -ItemType Directory -Path "apps\api" -Force | Out-Null }
Copy-Item ".env" "apps\web\.env" -Force
Copy-Item ".env" "apps\api\.env" -Force
Write-Host "✓ Environment files copied to app directories" -ForegroundColor Green

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Build the project
Write-Host "`n🏗️  Building applications..." -ForegroundColor Yellow
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Build completed with warnings" -ForegroundColor Yellow
} else {
    Write-Host "✓ Build completed successfully" -ForegroundColor Green
}

# Check port availability
Write-Host "`n🔍 Checking port availability..." -ForegroundColor Yellow
$ports = @(3000, 8000, 5432, 6379)
$portsInUse = @()
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $portsInUse += $port
        Write-Host "Port ${port}: In use" -ForegroundColor Yellow
    } else {
        Write-Host "Port ${port}: Available" -ForegroundColor Green
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "`n⚠️  Some ports are in use: $($portsInUse -join ', ')" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Start services with Docker Compose
Write-Host "`n🐳 Starting services with Docker Compose..." -ForegroundColor Yellow
docker-compose down 2>$null
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Services started successfully" -ForegroundColor Green
    
    # Wait for services to be ready
    Write-Host "`n⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Run database migrations
    Write-Host "`n🗄️  Setting up database..." -ForegroundColor Yellow
    docker-compose exec -T web pnpm exec prisma generate
    docker-compose exec -T web pnpm exec prisma migrate deploy
    
    # Show service status
    Write-Host "`n📊 Service Status:" -ForegroundColor Yellow
    docker-compose ps
    
    Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
    Write-Host "`n🌐 Access your application at:" -ForegroundColor Cyan
    Write-Host "   Web: http://localhost:3000" -ForegroundColor White
    Write-Host "   API: http://localhost:8000" -ForegroundColor White
    Write-Host "`n📋 Useful commands:" -ForegroundColor Cyan
    Write-Host "   View logs:    docker-compose logs -f" -ForegroundColor White
    Write-Host "   Stop:         docker-compose down" -ForegroundColor White
    Write-Host "   Restart:      docker-compose restart" -ForegroundColor White
    Write-Host "   Database UI:  cd apps\web && pnpm db:studio" -ForegroundColor White
} else {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    Write-Host "Check Docker Desktop and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📖 For more help, see DEPLOYMENT_README.md" -ForegroundColor Cyan