#!/bin/bash

# Etsy Manager Pro - Deployment Test Script
# This script tests the deployment thoroughly

set -e

echo "🧪 Etsy Manager Pro - Deployment Test"
echo "====================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Testing $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Test 1: Check if deployment scripts exist
run_test "deployment scripts exist" "test -f deploy-etsy-manager.sh && test -f quick-deploy.sh"

# Test 2: Check if scripts are executable
run_test "scripts are executable" "test -x deploy-etsy-manager.sh && test -x quick-deploy.sh"

# Test 3: Check if Docker is installed
run_test "Docker installed" "command -v docker"

# Test 4: Check if docker-compose is installed
run_test "Docker Compose installed" "command -v docker-compose"

# Test 5: Check if Node.js is installed
run_test "Node.js installed" "command -v node"

# Test 6: Check if pnpm is installed
run_test "pnpm installed" "command -v pnpm"

# Test 7: Check if all required files exist
run_test "required files exist" "test -f package.json && test -f docker-compose.yml && test -f tsconfig.json"

# Test 8: Check if environment example files exist
run_test "env examples exist" "test -f .env.docker.example && test -f apps/web/.env.example && test -f apps/api/.env.example"

# Test 9: Check if all app directories exist
run_test "app directories exist" "test -d apps/web && test -d apps/api && test -d apps/extension && test -d apps/desktop"

# Test 10: Check if shared package exists
run_test "shared package exists" "test -d packages/shared && test -f packages/shared/package.json"

# Test 11: Check if Dockerfiles exist
run_test "Dockerfiles exist" "test -f apps/web/Dockerfile && test -f apps/api/Dockerfile"

# Test 12: Check if database scripts exist
run_test "database scripts exist" "test -f scripts/setup-database.sh && test -x scripts/setup-database.sh"

# Test 13: Check if validation script exists
run_test "validation script exists" "test -f scripts/validate-deployment.sh && test -x scripts/validate-deployment.sh"

# Test 14: Check if Prisma schema exists
run_test "Prisma schema exists" "test -f apps/web/prisma/schema.prisma"

# Test 15: Test pnpm installation
run_test "pnpm install works" "pnpm install --frozen-lockfile --prefer-offline"

# Test 16: Test TypeScript compilation
run_test "TypeScript compiles" "pnpm typecheck"

# Test 17: Test shared package build
run_test "shared package builds" "cd packages/shared && pnpm build"

# Test 18: Test if build completes
echo -e "\n${YELLOW}Running full build test (this may take a minute)...${NC}"
if pnpm build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Full build successful${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ Build failed${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 19: Docker Compose syntax
run_test "docker-compose syntax" "docker-compose config > /dev/null"

# Test 20: Check port availability
echo -e "\n${YELLOW}Checking port availability...${NC}"
for port in 3000 8000 5432 6379; do
    if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "Port $port: ${GREEN}Available${NC}"
    else
        echo -e "Port $port: ${YELLOW}In use${NC} (deployment may need different ports)"
    fi
done

# Summary
echo ""
echo "====================================="
echo "Test Results:"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! The deployment is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update .env file with your Etsy API credentials"
    echo "2. Run: ./quick-deploy.sh for quick deployment"
    echo "3. Or run: ./deploy-etsy-manager.sh for interactive deployment"
else
    echo -e "${RED}❌ Some tests failed. Please fix the issues before deploying.${NC}"
    exit 1
fi