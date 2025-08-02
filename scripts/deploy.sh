#!/bin/bash

# Exit on error
set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Function to show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --build         Build Docker images before deploying"
    echo "  --no-cache      Build without Docker cache"
    echo "  --validate      Run validation before deployment"
    echo "  --dev           Use development compose file"
    echo "  --help          Show this help message"
    exit 1
}

# Parse arguments
BUILD=false
NO_CACHE=""
VALIDATE=false
DEV=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD=true
            shift
            ;;
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        --validate)
            VALIDATE=true
            shift
            ;;
        --dev)
            DEV=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Determine compose file
if [ "$DEV" = true ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    print_status "Using development compose file"
else
    COMPOSE_FILE="docker-compose.yml"
    print_status "Using production compose file"
fi

echo "🚀 Deploying Etsy Manager Pro..."
echo ""

# Run validation if requested
if [ "$VALIDATE" = true ]; then
    print_status "Running deployment validation..."
    if ! ./scripts/validate-deployment.sh; then
        print_error "Validation failed. Please fix issues before deploying."
        exit 1
    fi
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error "Missing .env file!"
    echo "Please copy .env.docker.example to .env and configure it:"
    echo "  cp .env.docker.example .env"
    exit 1
fi

# Source .env to check critical variables
set -a
source .env
set +a

# Check critical environment variables
CRITICAL_VARS=("NEXTAUTH_SECRET" "ETSY_CLIENT_ID" "ETSY_CLIENT_SECRET" "JWT_SECRET")
MISSING_VARS=()

for var in "${CRITICAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_error "Missing critical environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Please configure these in your .env file before deploying."
    exit 1
fi

# Build if requested
if [ "$BUILD" = true ]; then
    print_status "Building Docker images..."
    docker-compose -f "$COMPOSE_FILE" build $NO_CACHE
    echo ""
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down

# Start services
print_status "Starting services..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check service health
print_status "Checking service health..."
docker-compose -f "$COMPOSE_FILE" ps

# Show logs for any unhealthy services
UNHEALTHY=$(docker-compose -f "$COMPOSE_FILE" ps --filter "health=unhealthy" -q)
if [ -n "$UNHEALTHY" ]; then
    print_warning "Some services are unhealthy. Showing recent logs:"
    docker-compose -f "$COMPOSE_FILE" logs --tail=50
fi

echo ""
print_status "Deployment complete! 🎉"
echo ""
echo "📝 Access your services:"
echo "  - Web App: http://localhost:3000"
echo "  - API: http://localhost:8000"

if [ "$DEV" = true ]; then
    echo ""
    echo "📊 Optional management tools:"
    echo "  - pgAdmin: http://localhost:5050"
    echo "  - RedisInsight: http://localhost:8001"
    echo ""
    echo "To start management tools:"
    echo "  docker-compose -f docker-compose.dev.yml --profile tools up -d"
fi

echo ""
echo "📋 Useful commands:"
echo "  - View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "  - Stop services: docker-compose -f $COMPOSE_FILE down"
echo "  - View status: docker-compose -f $COMPOSE_FILE ps"