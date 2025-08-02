#!/bin/bash

# Etsy Manager Pro - One-Shot Deployment Script
# This script handles the complete deployment process with automatic error recovery
# and cross-platform compatibility

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script variables
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"
DEPLOYMENT_MODE=""
SKIP_VALIDATION=false
INTERACTIVE=true
USE_DOCKER=true
ENVIRONMENT="production"
LOG_FILE="$PROJECT_ROOT/deployment.log"

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to log messages
log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$message" >> "$LOG_FILE"
    if [[ "$2" != "silent" ]]; then
        echo "$message"
    fi
}

# Function to print banner
print_banner() {
    clear
    echo -e "${BLUE}"
    echo "=================================================="
    echo "       ETSY MANAGER PRO - DEPLOYMENT TOOL         "
    echo "=================================================="
    echo -e "${NC}"
}

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
    export OS
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install dependencies based on OS
install_system_dependencies() {
    print_color "$YELLOW" "\n🔧 Installing system dependencies..."
    
    case "$OS" in
        linux)
            if command_exists apt-get; then
                sudo apt-get update
                sudo apt-get install -y curl git build-essential
            elif command_exists yum; then
                sudo yum install -y curl git gcc-c++ make
            elif command_exists dnf; then
                sudo dnf install -y curl git gcc-c++ make
            fi
            ;;
        macos)
            if ! command_exists brew; then
                print_color "$YELLOW" "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew install curl git
            ;;
        windows)
            print_color "$YELLOW" "Please install Git Bash and run this script from there."
            exit 1
            ;;
    esac
}

# Function to install Node.js if not present
install_nodejs() {
    if ! command_exists node; then
        print_color "$YELLOW" "\n📦 Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        local node_version=$(node -v)
        print_color "$GREEN" "✓ Node.js $node_version is installed"
    fi
}

# Function to install pnpm
install_pnpm() {
    if ! command_exists pnpm; then
        print_color "$YELLOW" "\n📦 Installing pnpm..."
        npm install -g pnpm@9.15.0
    else
        local pnpm_version=$(pnpm -v)
        print_color "$GREEN" "✓ pnpm $pnpm_version is installed"
    fi
}

# Function to install Docker
install_docker() {
    if ! command_exists docker; then
        print_color "$YELLOW" "\n🐳 Installing Docker..."
        case "$OS" in
            linux)
                curl -fsSL https://get.docker.com -o get-docker.sh
                sudo sh get-docker.sh
                sudo usermod -aG docker $USER
                rm get-docker.sh
                print_color "$YELLOW" "Please log out and back in for Docker group changes to take effect."
                ;;
            macos)
                print_color "$RED" "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
                exit 1
                ;;
        esac
    else
        print_color "$GREEN" "✓ Docker is installed"
    fi
    
    if ! command_exists docker-compose; then
        print_color "$YELLOW" "\n📦 Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    else
        print_color "$GREEN" "✓ Docker Compose is installed"
    fi
}

# Function to clone repository
clone_repository() {
    print_color "$YELLOW" "\n📥 Cloning repository..."
    
    if [[ -d "$PROJECT_ROOT/.git" ]]; then
        print_color "$GREEN" "✓ Repository already exists"
        cd "$PROJECT_ROOT"
        git pull origin main || true
    else
        local temp_dir="/tmp/etsy-manager-temp"
        rm -rf "$temp_dir"
        git clone https://github.com/DrBalls/etsy-manager.git "$temp_dir"
        cp -r "$temp_dir"/* "$PROJECT_ROOT/"
        cp -r "$temp_dir"/.* "$PROJECT_ROOT/" 2>/dev/null || true
        rm -rf "$temp_dir"
    fi
}

# Function to setup environment files
setup_environment() {
    print_color "$YELLOW" "\n🔐 Setting up environment configuration..."
    
    # Create .env file from example if it doesn't exist
    if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
        if [[ -f "$PROJECT_ROOT/.env.docker.example" ]]; then
            cp "$PROJECT_ROOT/.env.docker.example" "$PROJECT_ROOT/.env"
        else
            # Create a basic .env file
            cat > "$PROJECT_ROOT/.env" << 'EOF'
# Database Configuration
POSTGRES_USER=etsy_user
POSTGRES_PASSWORD=etsy_secure_password_$(openssl rand -base64 32)
POSTGRES_DB=etsy_manager
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}

# Redis Configuration
REDIS_PASSWORD=redis_secure_password_$(openssl rand -base64 32)
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379

# Application Configuration
NODE_ENV=production
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Etsy API Configuration
ETSY_CLIENT_ID=your_etsy_client_id
ETSY_CLIENT_SECRET=your_etsy_client_secret

# Port Configuration
WEB_PORT=3000
API_PORT=8000
POSTGRES_PORT=5432
REDIS_PORT=6379

# Optional: Email Configuration
EMAIL_FROM=noreply@example.com
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=

# Optional: Stripe Configuration
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=

# Optional: AWS S3 Configuration
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=
EOF
        fi
    fi
    
    # Copy environment files to app directories
    for app in web api; do
        if [[ ! -f "$PROJECT_ROOT/apps/$app/.env" ]]; then
            cp "$PROJECT_ROOT/.env" "$PROJECT_ROOT/apps/$app/.env"
        fi
    done
    
    # Prompt for Etsy API credentials if not set
    if grep -q "your_etsy_client_id" "$PROJECT_ROOT/.env"; then
        print_color "$YELLOW" "\n🔑 Etsy API Configuration Required"
        print_color "$BLUE" "Please visit https://www.etsy.com/developers/register to create an app"
        
        if [[ "$INTERACTIVE" == "true" ]]; then
            read -p "Enter your Etsy Client ID: " etsy_client_id
            read -p "Enter your Etsy Client Secret: " etsy_client_secret
            
            if [[ -n "$etsy_client_id" ]] && [[ -n "$etsy_client_secret" ]]; then
                sed -i.bak "s/your_etsy_client_id/$etsy_client_id/g" "$PROJECT_ROOT/.env"
                sed -i.bak "s/your_etsy_client_secret/$etsy_client_secret/g" "$PROJECT_ROOT/.env"
                rm "$PROJECT_ROOT/.env.bak"
                
                # Update app-specific env files
                for app in web api; do
                    cp "$PROJECT_ROOT/.env" "$PROJECT_ROOT/apps/$app/.env"
                done
            else
                print_color "$RED" "⚠️  Etsy API credentials not provided. Please update .env file manually."
            fi
        else
            print_color "$RED" "⚠️  Please update ETSY_CLIENT_ID and ETSY_CLIENT_SECRET in .env file"
        fi
    fi
    
    print_color "$GREEN" "✓ Environment configuration complete"
}

# Function to validate deployment
validate_deployment() {
    print_color "$YELLOW" "\n🔍 Validating deployment prerequisites..."
    
    local validation_passed=true
    
    # Check required commands
    for cmd in node npm git; do
        if ! command_exists $cmd; then
            print_color "$RED" "✗ $cmd is not installed"
            validation_passed=false
        else
            print_color "$GREEN" "✓ $cmd is installed"
        fi
    done
    
    # Check Docker if using Docker deployment
    if [[ "$USE_DOCKER" == "true" ]]; then
        if ! command_exists docker; then
            print_color "$RED" "✗ Docker is not installed"
            validation_passed=false
        else
            print_color "$GREEN" "✓ Docker is installed"
        fi
        
        if ! docker info >/dev/null 2>&1; then
            print_color "$RED" "✗ Docker daemon is not running"
            validation_passed=false
        else
            print_color "$GREEN" "✓ Docker daemon is running"
        fi
    fi
    
    # Check required files
    for file in package.json pnpm-workspace.yaml turbo.json; do
        if [[ ! -f "$PROJECT_ROOT/$file" ]]; then
            print_color "$RED" "✗ Required file $file is missing"
            validation_passed=false
        else
            print_color "$GREEN" "✓ $file exists"
        fi
    done
    
    # Check port availability
    for port in 3000 8000 5432 6379; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_color "$YELLOW" "⚠️  Port $port is already in use"
        else
            print_color "$GREEN" "✓ Port $port is available"
        fi
    done
    
    if [[ "$validation_passed" == "false" ]]; then
        print_color "$RED" "\n❌ Validation failed. Please fix the issues above."
        exit 1
    else
        print_color "$GREEN" "\n✅ All validations passed!"
    fi
}

# Function to setup database
setup_database() {
    print_color "$YELLOW" "\n🗄️  Setting up database..."
    
    if [[ "$USE_DOCKER" == "true" ]]; then
        # Start PostgreSQL and Redis with Docker
        docker-compose up -d postgres redis
        
        # Wait for PostgreSQL to be ready
        print_color "$YELLOW" "Waiting for PostgreSQL to be ready..."
        local retries=30
        while [[ $retries -gt 0 ]]; do
            if docker-compose exec -T postgres pg_isready -U ${POSTGRES_USER:-etsy_user} >/dev/null 2>&1; then
                print_color "$GREEN" "✓ PostgreSQL is ready"
                break
            fi
            retries=$((retries - 1))
            sleep 1
        done
        
        if [[ $retries -eq 0 ]]; then
            print_color "$RED" "❌ PostgreSQL failed to start"
            exit 1
        fi
    fi
    
    # Run database migrations
    print_color "$YELLOW" "Running database migrations..."
    cd "$PROJECT_ROOT/apps/web"
    pnpm exec prisma generate
    pnpm exec prisma migrate deploy
    
    # Seed database (optional)
    if [[ "$INTERACTIVE" == "true" ]]; then
        read -p "Would you like to seed the database with sample data? (y/N): " seed_db
        if [[ "$seed_db" =~ ^[Yy]$ ]]; then
            pnpm exec prisma db seed
        fi
    fi
    
    print_color "$GREEN" "✓ Database setup complete"
}

# Function to build applications
build_applications() {
    print_color "$YELLOW" "\n🏗️  Building applications..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    print_color "$YELLOW" "Installing dependencies..."
    pnpm install --frozen-lockfile || pnpm install
    
    # Build all applications
    print_color "$YELLOW" "Building all applications..."
    pnpm build
    
    print_color "$GREEN" "✓ Applications built successfully"
}

# Function to deploy with Docker
deploy_docker() {
    print_color "$YELLOW" "\n🐳 Deploying with Docker..."
    
    cd "$PROJECT_ROOT"
    
    # Build and start all services
    docker-compose build
    docker-compose up -d
    
    # Wait for services to be healthy
    print_color "$YELLOW" "Waiting for services to be healthy..."
    sleep 10
    
    # Check service health
    local all_healthy=true
    for service in postgres redis web api; do
        if docker-compose ps | grep $service | grep -q "Up"; then
            print_color "$GREEN" "✓ $service is running"
        else
            print_color "$RED" "✗ $service is not running"
            all_healthy=false
        fi
    done
    
    if [[ "$all_healthy" == "true" ]]; then
        print_color "$GREEN" "\n✅ All services deployed successfully!"
        print_color "$BLUE" "\nAccess your application at:"
        print_color "$BLUE" "  Web: http://localhost:3000"
        print_color "$BLUE" "  API: http://localhost:8000"
        print_color "$BLUE" "\nView logs with: docker-compose logs -f"
    else
        print_color "$RED" "\n❌ Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
}

# Function to deploy without Docker
deploy_traditional() {
    print_color "$YELLOW" "\n📦 Deploying without Docker..."
    
    cd "$PROJECT_ROOT"
    
    # Install PM2 globally
    if ! command_exists pm2; then
        print_color "$YELLOW" "Installing PM2..."
        npm install -g pm2
    fi
    
    # Start services with PM2
    print_color "$YELLOW" "Starting services with PM2..."
    
    # Start API server
    cd "$PROJECT_ROOT/apps/api"
    pm2 start "pnpm start" --name "etsy-api" --env production
    
    # Start Web server
    cd "$PROJECT_ROOT/apps/web"
    pm2 start "pnpm start" --name "etsy-web" --env production
    
    # Save PM2 configuration
    pm2 save
    pm2 startup
    
    print_color "$GREEN" "\n✅ Services deployed with PM2!"
    print_color "$BLUE" "\nAccess your application at:"
    print_color "$BLUE" "  Web: http://localhost:3000"
    print_color "$BLUE" "  API: http://localhost:8000"
    print_color "$BLUE" "\nManage services with:"
    print_color "$BLUE" "  pm2 status"
    print_color "$BLUE" "  pm2 logs"
    print_color "$BLUE" "  pm2 restart all"
}

# Function to setup monitoring
setup_monitoring() {
    print_color "$YELLOW" "\n📊 Setting up monitoring..."
    
    if [[ "$USE_DOCKER" == "true" ]]; then
        # Create docker-compose.monitoring.yml
        cat > "$PROJECT_ROOT/docker-compose.monitoring.yml" << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  prometheus_data:
  grafana_data:
EOF
        
        # Create basic prometheus config
        cat > "$PROJECT_ROOT/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'etsy-api'
    static_configs:
      - targets: ['api:8000']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
EOF
        
        if [[ "$INTERACTIVE" == "true" ]]; then
            read -p "Would you like to deploy monitoring stack (Prometheus + Grafana)? (y/N): " deploy_monitoring
            if [[ "$deploy_monitoring" =~ ^[Yy]$ ]]; then
                docker-compose -f docker-compose.monitoring.yml up -d
                print_color "$GREEN" "✓ Monitoring stack deployed"
                print_color "$BLUE" "  Grafana: http://localhost:3001 (admin/admin)"
                print_color "$BLUE" "  Prometheus: http://localhost:9090"
            fi
        fi
    fi
}

# Function to create post-deployment report
create_deployment_report() {
    local report_file="$PROJECT_ROOT/deployment-report.txt"
    
    cat > "$report_file" << EOF
ETSY MANAGER PRO - DEPLOYMENT REPORT
====================================
Date: $(date)
Environment: $ENVIRONMENT
Deployment Type: $(if [[ "$USE_DOCKER" == "true" ]]; then echo "Docker"; else echo "Traditional"; fi)

SERVICES STATUS:
EOF
    
    if [[ "$USE_DOCKER" == "true" ]]; then
        docker-compose ps >> "$report_file"
    else
        pm2 status >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

ACCESS URLS:
- Web Application: http://localhost:3000
- API Server: http://localhost:8000
- Database: postgresql://localhost:5432/etsy_manager
- Redis: redis://localhost:6379

NEXT STEPS:
1. Update .env file with your Etsy API credentials if not already done
2. Access the web application and create an admin account
3. Configure your Etsy shop connection
4. Set up SSL certificates for production use
5. Configure backup strategy for PostgreSQL

USEFUL COMMANDS:
- View logs: $(if [[ "$USE_DOCKER" == "true" ]]; then echo "docker-compose logs -f"; else echo "pm2 logs"; fi)
- Stop services: $(if [[ "$USE_DOCKER" == "true" ]]; then echo "docker-compose down"; else echo "pm2 stop all"; fi)
- Restart services: $(if [[ "$USE_DOCKER" == "true" ]]; then echo "docker-compose restart"; else echo "pm2 restart all"; fi)
- Database management: pnpm db:studio

For more information, see docs/DEPLOYMENT.md
EOF
    
    print_color "$GREEN" "\n📄 Deployment report saved to: $report_file"
}

# Function to handle errors
handle_error() {
    local exit_code=$?
    local line_number=$1
    
    print_color "$RED" "\n❌ Error occurred at line $line_number with exit code $exit_code"
    print_color "$YELLOW" "Check the log file for details: $LOG_FILE"
    
    # Cleanup on error
    if [[ "$USE_DOCKER" == "true" ]]; then
        print_color "$YELLOW" "Cleaning up Docker containers..."
        docker-compose down
    fi
    
    exit $exit_code
}

# Main deployment function
main() {
    # Set up error handling
    trap 'handle_error $LINENO' ERR
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --docker)
                USE_DOCKER=true
                shift
                ;;
            --no-docker)
                USE_DOCKER=false
                shift
                ;;
            --skip-validation)
                SKIP_VALIDATION=true
                shift
                ;;
            --non-interactive)
                INTERACTIVE=false
                shift
                ;;
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --help)
                cat << EOF
Usage: $0 [OPTIONS]

OPTIONS:
    --docker            Use Docker for deployment (default)
    --no-docker         Deploy without Docker using PM2
    --skip-validation   Skip prerequisite validation
    --non-interactive   Run without prompts
    --environment       Set environment (production/staging/development)
    --help              Show this help message

EXAMPLES:
    $0                          # Interactive Docker deployment
    $0 --no-docker              # Traditional deployment with PM2
    $0 --non-interactive        # Automated deployment with defaults

EOF
                exit 0
                ;;
            *)
                print_color "$RED" "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Start deployment
    print_banner
    log "Starting Etsy Manager Pro deployment" "silent"
    
    # Detect operating system
    detect_os
    print_color "$BLUE" "Detected OS: $OS"
    
    # Install system dependencies
    if [[ "$INTERACTIVE" == "true" ]]; then
        read -p "Install/update system dependencies? (Y/n): " install_deps
        if [[ ! "$install_deps" =~ ^[Nn]$ ]]; then
            install_system_dependencies
        fi
    else
        install_system_dependencies
    fi
    
    # Install Node.js and pnpm
    install_nodejs
    install_pnpm
    
    # Install Docker if needed
    if [[ "$USE_DOCKER" == "true" ]]; then
        install_docker
    fi
    
    # Clone or update repository
    clone_repository
    
    # Setup environment
    setup_environment
    
    # Validate deployment
    if [[ "$SKIP_VALIDATION" == "false" ]]; then
        validate_deployment
    fi
    
    # Build applications
    build_applications
    
    # Setup database
    setup_database
    
    # Deploy application
    if [[ "$USE_DOCKER" == "true" ]]; then
        deploy_docker
    else
        deploy_traditional
    fi
    
    # Setup monitoring (optional)
    setup_monitoring
    
    # Create deployment report
    create_deployment_report
    
    print_color "$GREEN" "\n🎉 Deployment completed successfully!"
    print_color "$BLUE" "\nThank you for using Etsy Manager Pro!"
}

# Run main function
main "$@"