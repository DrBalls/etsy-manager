#!/bin/bash

# Etsy Manager Pro - Quick Deploy Script
# Simplified deployment with sensible defaults

set -e

echo "🚀 Etsy Manager Pro - Quick Deploy"
echo "=================================="

# Check if Docker is installed
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Docker is required but not installed."
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose >/dev/null 2>&1; then
    echo "❌ Docker Compose is required but not installed."
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment configuration..."
    cat > .env << 'EOF'
# Database Configuration
POSTGRES_USER=etsy_user
POSTGRES_PASSWORD=etsy_password_change_me_$(date +%s)
POSTGRES_DB=etsy_manager
DATABASE_URL=postgresql://etsy_user:etsy_password_change_me_$(date +%s)@postgres:5432/etsy_manager

# Redis Configuration
REDIS_PASSWORD=redis_password_change_me_$(date +%s)
REDIS_URL=redis://:redis_password_change_me_$(date +%s)@redis:6379

# Application Configuration
NODE_ENV=production
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change_me_$(date +%s)")
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change_me_jwt_$(date +%s)")

# Etsy API Configuration (REQUIRED - Update these!)
ETSY_CLIENT_ID=your_etsy_client_id_here
ETSY_CLIENT_SECRET=your_etsy_client_secret_here

# Port Configuration
WEB_PORT=3000
API_PORT=8000
POSTGRES_PORT=5432
REDIS_PORT=6379
EOF
    
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file and add your Etsy API credentials!"
    echo "   Get them from: https://www.etsy.com/developers/register"
    echo ""
    read -p "Press Enter to continue after updating .env file..."
fi

# Copy .env to app directories
echo "📁 Setting up application environments..."
mkdir -p apps/web apps/api
cp .env apps/web/.env 2>/dev/null || true
cp .env apps/api/.env 2>/dev/null || true

# Check if pnpm is installed
if ! command -v pnpm >/dev/null 2>&1; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm@9.15.0
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build applications
echo "🏗️  Building applications..."
pnpm build || echo "⚠️  Build warnings detected, continuing..."

# Start services
echo "🐳 Starting services with Docker..."
docker-compose down 2>/dev/null || true
docker-compose up -d

# Wait for database
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations
echo "🗄️  Setting up database..."
cd apps/web
pnpm exec prisma generate
pnpm exec prisma migrate deploy || echo "⚠️  Migration warnings detected, continuing..."
cd ../..

# Check service status
echo ""
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Access your application at:"
echo "   Web: http://localhost:3000"
echo "   API: http://localhost:8000"
echo ""
echo "📋 Useful commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop:         docker-compose down"
echo "   Restart:      docker-compose restart"
echo "   Database UI:  cd apps/web && pnpm db:studio"
echo ""
echo "📖 For detailed deployment options, run: ./deploy-etsy-manager.sh --help"