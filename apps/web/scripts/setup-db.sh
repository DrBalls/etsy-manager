#!/bin/bash

# Database setup script for Etsy Manager

echo "🔧 Setting up PostgreSQL database..."

# Check if PostgreSQL is running
if ! docker ps | grep -q postgres; then
    echo "⚠️  PostgreSQL container not running. Starting Docker services..."
    cd ../.. && docker-compose up -d postgres redis
    cd apps/web
    
    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
fi

# Create database if it doesn't exist
echo "📦 Creating database..."
PGPASSWORD=postgres psql -h localhost -U postgres -c "CREATE DATABASE etsy_manager;" 2>/dev/null || true

# Run migrations
echo "🚀 Running database migrations..."
pnpm exec prisma migrate dev --name init

# Generate Prisma client
echo "🔨 Generating Prisma client..."
pnpm exec prisma generate

# Seed database (optional)
read -p "Do you want to seed the database with test data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    pnpm run db:seed
fi

echo "✅ Database setup complete!"
echo ""
echo "You can now:"
echo "  - Run 'pnpm run db:studio' to view your database"
echo "  - Run 'pnpm run dev' to start the development server"