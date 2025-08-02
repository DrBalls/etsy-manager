#!/bin/bash

# Exit on error
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Variables
ERRORS=0
WARNINGS=0

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a file exists
file_exists() {
    [ -f "$1" ]
}

# Function to check if a directory exists
dir_exists() {
    [ -d "$1" ]
}

# Function to check if an environment variable is set
env_var_set() {
    [ -n "${!1}" ]
}

# Function to check if a port is available
port_available() {
    ! lsof -i:$1 >/dev/null 2>&1
}

# Function to check Docker
check_docker() {
    echo "🐳 Checking Docker..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed"
        ERRORS=$((ERRORS + 1))
        return
    fi
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running"
        ERRORS=$((ERRORS + 1))
        return
    fi
    
    print_status "Docker is installed and running"
    
    # Check Docker Compose
    if command_exists docker-compose; then
        print_status "docker-compose is installed"
    elif docker compose version >/dev/null 2>&1; then
        print_status "docker compose plugin is installed"
    else
        print_error "Docker Compose is not installed"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check Node.js and pnpm
check_node() {
    echo ""
    echo "📦 Checking Node.js and package manager..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed"
        ERRORS=$((ERRORS + 1))
        return
    fi
    
    NODE_VERSION=$(node -v)
    print_status "Node.js is installed: $NODE_VERSION"
    
    # Check if version is 18+ or 20+
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1 | cut -dv -f2)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        print_warning "Node.js version should be 18 or higher"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Check pnpm
    if ! command_exists pnpm; then
        print_error "pnpm is not installed"
        ERRORS=$((ERRORS + 1))
    else
        PNPM_VERSION=$(pnpm -v)
        print_status "pnpm is installed: v$PNPM_VERSION"
    fi
}

# Function to check required files
check_files() {
    echo ""
    echo "📁 Checking required files..."
    
    # Check root files
    REQUIRED_FILES=(
        "package.json"
        "pnpm-workspace.yaml"
        "pnpm-lock.yaml"
        "docker-compose.yml"
        "turbo.json"
        "tsconfig.json"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if file_exists "$file"; then
            print_status "Found: $file"
        else
            print_error "Missing: $file"
            ERRORS=$((ERRORS + 1))
        fi
    done
    
    # Check app directories
    REQUIRED_DIRS=(
        "apps/web"
        "apps/api"
        "apps/extension"
        "packages/shared"
    )
    
    for dir in "${REQUIRED_DIRS[@]}"; do
        if dir_exists "$dir"; then
            print_status "Found directory: $dir"
        else
            print_error "Missing directory: $dir"
            ERRORS=$((ERRORS + 1))
        fi
    done
    
    # Check Dockerfiles
    if file_exists "apps/web/Dockerfile"; then
        print_status "Found: apps/web/Dockerfile"
    else
        print_error "Missing: apps/web/Dockerfile"
        ERRORS=$((ERRORS + 1))
    fi
    
    if file_exists "apps/api/Dockerfile"; then
        print_status "Found: apps/api/Dockerfile"
    else
        print_error "Missing: apps/api/Dockerfile"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check environment variables
check_env_vars() {
    echo ""
    echo "🔑 Checking environment variables..."
    
    # Check for .env files
    if file_exists ".env"; then
        print_status "Found: .env"
        source .env
    else
        print_warning "Missing: .env (using example files as reference)"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Required environment variables
    REQUIRED_VARS=(
        "NEXTAUTH_SECRET"
        "ETSY_CLIENT_ID"
        "ETSY_CLIENT_SECRET"
        "JWT_SECRET"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if env_var_set "$var"; then
            print_status "$var is set"
        else
            print_error "$var is not set"
            ERRORS=$((ERRORS + 1))
        fi
    done
    
    # Optional but recommended variables
    OPTIONAL_VARS=(
        "POSTGRES_USER"
        "POSTGRES_PASSWORD"
        "REDIS_PASSWORD"
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
    )
    
    for var in "${OPTIONAL_VARS[@]}"; do
        if env_var_set "$var"; then
            print_status "$var is set"
        else
            print_warning "$var is not set (optional)"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
}

# Function to check ports
check_ports() {
    echo ""
    echo "🔌 Checking port availability..."
    
    PORTS=(
        "3000:Next.js Web App"
        "8000:API Server"
        "5432:PostgreSQL"
        "6379:Redis"
    )
    
    for port_info in "${PORTS[@]}"; do
        IFS=':' read -r port service <<< "$port_info"
        
        if port_available "$port"; then
            print_status "Port $port is available for $service"
        else
            print_error "Port $port is already in use (needed for $service)"
            ERRORS=$((ERRORS + 1))
        fi
    done
}

# Function to check Prisma setup
check_prisma() {
    echo ""
    echo "🗄️  Checking Prisma setup..."
    
    if file_exists "apps/web/prisma/schema.prisma"; then
        print_status "Found: Prisma schema"
    else
        print_error "Missing: apps/web/prisma/schema.prisma"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check if migrations exist
    if dir_exists "apps/web/prisma/migrations" && [ "$(ls -A apps/web/prisma/migrations 2>/dev/null)" ]; then
        print_status "Found: Prisma migrations"
    else
        print_warning "No Prisma migrations found (will need to create initial migration)"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# Function to check dependencies
check_dependencies() {
    echo ""
    echo "📚 Checking dependencies..."
    
    if file_exists "pnpm-lock.yaml"; then
        print_status "Found: pnpm-lock.yaml"
        
        # Check if node_modules exists
        if dir_exists "node_modules"; then
            print_status "Dependencies appear to be installed"
        else
            print_warning "Dependencies not installed (run: pnpm install)"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        print_error "Missing: pnpm-lock.yaml"
        ERRORS=$((ERRORS + 1))
    fi
}

# Main validation function
main() {
    echo "🚀 Etsy Manager Deployment Validation"
    echo "===================================="
    echo ""
    
    # Run all checks
    check_docker
    check_node
    check_files
    check_env_vars
    check_ports
    check_prisma
    check_dependencies
    
    # Summary
    echo ""
    echo "===================================="
    echo "📊 Validation Summary"
    echo "===================================="
    
    if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        print_status "All checks passed! ✨"
        echo ""
        echo "You can now deploy with:"
        echo "  docker-compose up -d"
    elif [ $ERRORS -eq 0 ]; then
        print_warning "Validation passed with $WARNINGS warning(s)"
        echo ""
        echo "You can deploy, but review the warnings above."
        echo "Deploy with:"
        echo "  docker-compose up -d"
    else
        print_error "Validation failed with $ERRORS error(s) and $WARNINGS warning(s)"
        echo ""
        echo "Please fix the errors above before deploying."
        exit 1
    fi
    
    echo ""
    echo "📝 Next steps:"
    echo "1. Copy .env.example to .env and fill in required values"
    echo "2. Run: pnpm install"
    echo "3. Run: ./scripts/setup-database.sh"
    echo "4. Run: docker-compose up -d"
    echo "5. Access the application at http://localhost:3000"
}

# Run main function
main