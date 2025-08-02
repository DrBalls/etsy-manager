#!/bin/bash

# Exit on error
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Default values
POSTGRES_USER="${POSTGRES_USER:-etsy_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-etsy_password}"
POSTGRES_DB="${POSTGRES_DB:-etsy_manager}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for PostgreSQL to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -c '\q' 2>/dev/null; then
            print_status "PostgreSQL is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "PostgreSQL is not responding after $max_attempts attempts"
    return 1
}

# Function to check if database exists
database_exists() {
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -lqt | cut -d \| -f 1 | grep -qw "$POSTGRES_DB"
}

# Main setup function
setup_database() {
    echo "🚀 Setting up Etsy Manager database..."
    echo ""
    
    # Check if psql is installed
    if ! command_exists psql; then
        print_error "psql command not found. Please install PostgreSQL client."
        echo "On Ubuntu/Debian: sudo apt-get install postgresql-client"
        echo "On macOS: brew install postgresql"
        exit 1
    fi
    
    # Check if Docker is running (if using Docker)
    if command_exists docker; then
        if ! docker info >/dev/null 2>&1; then
            print_warning "Docker is not running. Starting Docker containers..."
            docker-compose up -d postgres
            sleep 5
        else
            # Check if postgres container is running
            if ! docker-compose ps | grep -q "postgres.*Up"; then
                print_warning "PostgreSQL container is not running. Starting..."
                docker-compose up -d postgres
                sleep 5
            fi
        fi
    fi
    
    # Wait for PostgreSQL to be ready
    if ! wait_for_postgres; then
        print_error "Failed to connect to PostgreSQL"
        exit 1
    fi
    
    # Create database if it doesn't exist
    if database_exists; then
        print_status "Database '$POSTGRES_DB' already exists"
    else
        print_status "Creating database '$POSTGRES_DB'..."
        PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -c "CREATE DATABASE $POSTGRES_DB;"
        print_status "Database created successfully"
    fi
    
    # Generate DATABASE_URL
    DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
    
    # Update .env files with DATABASE_URL
    update_env_file() {
        local env_file=$1
        if [ -f "$env_file" ]; then
            # Check if DATABASE_URL exists
            if grep -q "^DATABASE_URL=" "$env_file"; then
                # Update existing DATABASE_URL
                sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" "$env_file"
                rm -f "${env_file}.bak"
                print_status "Updated DATABASE_URL in $env_file"
            else
                # Add DATABASE_URL
                echo "DATABASE_URL=\"$DATABASE_URL\"" >> "$env_file"
                print_status "Added DATABASE_URL to $env_file"
            fi
        fi
    }
    
    # Update .env files
    update_env_file "apps/web/.env"
    update_env_file "apps/api/.env"
    
    # Run Prisma migrations
    if [ -f "apps/web/package.json" ]; then
        print_status "Running Prisma migrations..."
        cd apps/web
        
        # Generate Prisma client
        pnpm exec prisma generate
        
        # Run migrations
        pnpm exec prisma migrate deploy
        
        cd ../..
        print_status "Migrations completed successfully"
    fi
    
    echo ""
    print_status "Database setup completed successfully! 🎉"
    echo ""
    echo "Connection details:"
    echo "  Host: $POSTGRES_HOST"
    echo "  Port: $POSTGRES_PORT"
    echo "  Database: $POSTGRES_DB"
    echo "  User: $POSTGRES_USER"
    echo ""
    echo "DATABASE_URL: $DATABASE_URL"
}

# Run the setup
setup_database