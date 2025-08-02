#!/bin/bash

# Exit on error
set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

echo "🚀 Setting up Etsy Manager development environment..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    print_info "Creating .env file from .env.docker.example..."
    cp .env.docker.example .env
    
    # Generate secure passwords
    NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-me-$(date +%s)")
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-me-jwt-$(date +%s)")
    POSTGRES_PASSWORD=$(openssl rand -base64 16 2>/dev/null || echo "change-me-pg-$(date +%s)")
    
    # Update .env with generated values
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-nextauth-secret-key-here/$NEXTAUTH_SECRET/" .env
        sed -i '' "s/your-jwt-secret-here/$JWT_SECRET/" .env
        sed -i '' "s/your-secure-postgres-password/$POSTGRES_PASSWORD/" .env
    else
        # Linux
        sed -i "s/your-nextauth-secret-key-here/$NEXTAUTH_SECRET/" .env
        sed -i "s/your-jwt-secret-here/$JWT_SECRET/" .env
        sed -i "s/your-secure-postgres-password/$POSTGRES_PASSWORD/" .env
    fi
    
    print_status "Created .env file with generated secrets"
    print_warning "Remember to add your Etsy API credentials to .env!"
else
    print_status ".env file already exists"
fi

# Create individual app .env files
for app in web api; do
    if [ ! -f "apps/$app/.env" ]; then
        print_info "Creating apps/$app/.env..."
        cp "apps/$app/.env.example" "apps/$app/.env" 2>/dev/null || echo "# Generated .env file" > "apps/$app/.env"
        print_status "Created apps/$app/.env"
    else
        print_status "apps/$app/.env already exists"
    fi
done

# Install dependencies
print_info "Installing dependencies with pnpm..."
pnpm install

# Generate Prisma client
print_info "Generating Prisma client..."
cd apps/web && pnpm exec prisma generate && cd ../..

# Start Docker services
print_info "Starting Docker services (PostgreSQL and Redis)..."
docker-compose up -d postgres redis

# Wait for services to be ready
print_info "Waiting for services to be ready..."
sleep 5

# Run database setup
print_info "Setting up database..."
./scripts/setup-database.sh

# Build packages
print_info "Building shared packages..."
pnpm build --filter=@etsy-manager/shared

echo ""
print_status "Development environment setup complete! 🎉"
echo ""
echo "📝 Next steps:"
echo "1. Add your Etsy API credentials to .env:"
echo "   - ETSY_CLIENT_ID"
echo "   - ETSY_CLIENT_SECRET"
echo ""
echo "2. Start the development servers:"
echo "   - Web app: pnpm dev:web"
echo "   - API server: pnpm dev:api"
echo "   - All apps: pnpm dev"
echo ""
echo "3. Access the application:"
echo "   - Web: http://localhost:3000"
echo "   - API: http://localhost:8000"
echo ""
echo "4. Run validation check:"
echo "   ./scripts/validate-deployment.sh"