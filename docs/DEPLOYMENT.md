# Etsy Manager Pro - Deployment Guide

This guide covers deployment options for Etsy Manager Pro, from local development to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js** 18+ or 20+ (LTS recommended)
- **pnpm** 8+ (`npm install -g pnpm`)
- **Docker** & **Docker Compose** (for containerized deployment)
- **PostgreSQL** 15+ (if not using Docker)
- **Redis** 7+ (if not using Docker)

### Required API Keys

1. **Etsy API Credentials**
   - Create an app at [Etsy Developers](https://www.etsy.com/developers/)
   - Get your `ETSY_CLIENT_ID` and `ETSY_CLIENT_SECRET`

2. **NextAuth Secret**
   - Generate with: `openssl rand -base64 32`

3. **JWT Secret** (for API)
   - Generate with: `openssl rand -base64 32`

## Environment Setup

### Quick Setup (Recommended)

Run the automated setup script:

```bash
./scripts/setup-dev-env.sh
```

This script will:
- Create `.env` files from examples
- Generate secure secrets
- Install dependencies
- Start Docker services
- Set up the database
- Build shared packages

### Manual Setup

1. **Copy environment files:**
   ```bash
   cp .env.docker.example .env
   cp apps/web/.env.example apps/web/.env
   cp apps/api/.env.example apps/api/.env
   ```

2. **Generate secrets:**
   ```bash
   # Generate NextAuth secret
   echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
   
   # Generate JWT secret
   echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
   ```

3. **Add your API credentials to `.env`:**
   - `ETSY_CLIENT_ID`
   - `ETSY_CLIENT_SECRET`

## Local Development

### Using Docker (Recommended)

1. **Start infrastructure services:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up database:**
   ```bash
   ./scripts/setup-database.sh
   ```

4. **Start development servers:**
   ```bash
   # Start all apps
   pnpm dev
   
   # Or start individually
   pnpm dev:web    # Next.js on http://localhost:3000
   pnpm dev:api    # API on http://localhost:8000
   ```

5. **Optional: Start management tools:**
   ```bash
   # Include pgAdmin and RedisInsight
   docker-compose -f docker-compose.dev.yml --profile tools up -d
   ```

### Without Docker

1. **Install and configure PostgreSQL and Redis locally**

2. **Update `.env` with your local database URLs:**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/etsy_manager"
   REDIS_URL="redis://localhost:6379"
   ```

3. **Follow steps 2-4 from the Docker section above**

## Docker Deployment

### Validation

Before deploying, run the validation script:

```bash
./scripts/validate-deployment.sh
```

This checks:
- Required files and directories
- Environment variables
- Port availability
- Docker installation
- Dependencies

### Full Stack Deployment

1. **Ensure `.env` is properly configured**

2. **Build and start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Check service health:**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

4. **Access the applications:**
   - Web App: http://localhost:3000
   - API: http://localhost:8000

### Individual Service Management

```bash
# Start specific services
docker-compose up -d postgres redis
docker-compose up -d web
docker-compose up -d api

# View logs
docker-compose logs -f web
docker-compose logs -f api

# Restart services
docker-compose restart web
docker-compose restart api

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

## Production Deployment

### Environment Variables

For production, ensure these additional variables are set:

```env
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
ETSY_REDIRECT_URI=https://your-domain.com/api/auth/callback/etsy

# SSL/TLS
POSTGRES_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password>

# Optional but recommended
SENTRY_DSN=<your-sentry-dsn>
NEXT_PUBLIC_GA_ID=<google-analytics-id>
```

### AWS ECS Deployment

1. **Build and push images to ECR:**
   ```bash
   # Build images
   docker build -t etsy-manager-web -f apps/web/Dockerfile .
   docker build -t etsy-manager-api -f apps/api/Dockerfile .
   
   # Tag and push
   aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
   docker tag etsy-manager-web:latest $ECR_REGISTRY/etsy-manager-web:latest
   docker tag etsy-manager-api:latest $ECR_REGISTRY/etsy-manager-api:latest
   docker push $ECR_REGISTRY/etsy-manager-web:latest
   docker push $ECR_REGISTRY/etsy-manager-api:latest
   ```

2. **Deploy using provided CloudFormation/Terraform templates** (in `infrastructure/`)

### Digital Ocean App Platform

1. **Connect your GitHub repository**

2. **Configure app components:**
   - Web: Next.js app from `apps/web`
   - API: Node.js app from `apps/api`
   - Database: Managed PostgreSQL
   - Redis: Managed Redis

3. **Set environment variables in App Platform dashboard**

### Heroku Deployment

1. **Create Heroku apps:**
   ```bash
   heroku create etsy-manager-web
   heroku create etsy-manager-api
   ```

2. **Add buildpacks:**
   ```bash
   heroku buildpacks:add heroku/nodejs -a etsy-manager-web
   heroku buildpacks:add heroku/nodejs -a etsy-manager-api
   ```

3. **Configure and deploy** (see `infrastructure/heroku/`)

## Database Management

### Migrations

```bash
# Create a new migration
cd apps/web
pnpm exec prisma migrate dev --name your-migration-name

# Apply migrations in production
pnpm exec prisma migrate deploy

# Reset database (WARNING: deletes all data)
pnpm exec prisma migrate reset
```

### Backups

```bash
# Backup database
docker exec etsy-manager-postgres-1 pg_dump -U etsy_user etsy_manager > backup.sql

# Restore database
docker exec -i etsy-manager-postgres-1 psql -U etsy_user etsy_manager < backup.sql
```

## Monitoring & Logging

### Health Checks

- Web App: `http://localhost:3000/api/health`
- API: `http://localhost:8000/health`

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f web
docker-compose logs -f api

# Save logs to file
docker-compose logs > deployment.log
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Find process using port
   lsof -i :3000
   lsof -i :8000
   
   # Kill process
   kill -9 <PID>
   ```

2. **Database connection errors:**
   ```bash
   # Check PostgreSQL is running
   docker-compose ps postgres
   
   # Test connection
   docker exec -it etsy-manager-postgres-1 psql -U etsy_user -d etsy_manager
   ```

3. **Redis connection errors:**
   ```bash
   # Check Redis is running
   docker-compose ps redis
   
   # Test connection
   docker exec -it etsy-manager-redis-1 redis-cli ping
   ```

4. **Prisma client issues:**
   ```bash
   # Regenerate Prisma client
   cd apps/web
   pnpm exec prisma generate
   ```

5. **Docker build failures:**
   ```bash
   # Clear Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

### Debug Mode

Enable debug logging:

```env
# Add to .env
DEBUG=*
LOG_LEVEL=debug
```

### Support

For deployment issues:
1. Run `./scripts/validate-deployment.sh`
2. Check logs: `docker-compose logs`
3. Review this guide's troubleshooting section
4. Open an issue on GitHub with validation output and logs