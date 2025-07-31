# Etsy Store Manager - Deployment Guide

This comprehensive guide covers deploying the Etsy Store Manager platform across different environments and configurations.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Deployment](#database-deployment)
4. [Production Deployment Methods](#production-deployment-methods)
   - [Docker Deployment](#docker-deployment)
   - [Traditional Deployment](#traditional-deployment)
   - [Cloud Platform Deployment](#cloud-platform-deployment)
5. [Chrome Extension Deployment](#chrome-extension-deployment)
6. [Desktop App Distribution](#desktop-app-distribution)
7. [Post-Deployment Configuration](#post-deployment-configuration)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- PostgreSQL 14+ database server
- Redis server (optional but recommended)
- Domain name with SSL certificate
- Etsy API credentials
- SMTP server for email notifications (optional)

### Required API Keys
- Etsy Client ID and Secret
- NextAuth Secret (generate with `openssl rand -base64 32`)
- Database credentials
- Email service credentials (if using)

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/etsy-manager.git
cd etsy-manager
```

### 2. Install Dependencies
```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 3. Configure Environment Variables

Create production environment files:

```bash
# Web application environment
cp apps/web/.env.example apps/web/.env.production
```

Edit `apps/web/.env.production`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/etsy_manager"

# NextAuth Configuration
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-generated-secret-key"

# Etsy API
ETSY_CLIENT_ID="your-etsy-client-id"
ETSY_CLIENT_SECRET="your-etsy-client-secret"
ETSY_REDIRECT_URI="https://your-domain.com/api/auth/callback/etsy"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Email (optional)
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT="587"
SMTP_USER="your-email@domain.com"
SMTP_PASSWORD="your-smtp-password"
SMTP_FROM="noreply@your-domain.com"

# Analytics (optional)
SENTRY_DSN="your-sentry-dsn"
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
```

## Database Deployment

### 1. Create Production Database
```sql
CREATE DATABASE etsy_manager;
CREATE USER etsy_user WITH ENCRYPTED PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE etsy_manager TO etsy_user;
```

### 2. Run Migrations
```bash
cd apps/web
NODE_ENV=production pnpm prisma migrate deploy
```

### 3. Seed Initial Data (Optional)
```bash
NODE_ENV=production pnpm prisma db seed
```

## Production Deployment Methods

### Docker Deployment (Recommended)

#### 1. Build and Run with Docker Compose

```bash
# Create .env file for Docker
cat > .env << EOF
POSTGRES_USER=etsy_user
POSTGRES_PASSWORD=your-secure-password
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com
ETSY_CLIENT_ID=your-etsy-client-id
ETSY_CLIENT_SECRET=your-etsy-client-secret
EOF

# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale web service
docker-compose up -d --scale web=3
```

#### 2. Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml etsy-manager

# Check services
docker service ls
docker service logs etsy-manager_web
```

### Traditional Deployment

#### 1. Build the Application
```bash
# Build all packages
pnpm build

# Or build specific app
pnpm build --filter=@etsy-manager/web
```

#### 2. Set Up Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'etsy-manager',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: './apps/web',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 3. Configure Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Cloud Platform Deployment

#### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/web
vercel --prod

# Set environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ... add other variables
```

#### Railway Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy
railway up

# Add environment variables
railway variables set DATABASE_URL="..."
railway variables set NEXTAUTH_SECRET="..."
```

#### AWS EC2 Deployment

1. Launch EC2 instance (Ubuntu 22.04 recommended)
2. Configure security groups (ports 80, 443, 22)
3. SSH into instance and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Redis
sudo apt install redis-server

# Install Nginx
sudo apt install nginx

# Clone and setup application
git clone https://github.com/your-username/etsy-manager.git
cd etsy-manager
pnpm install
pnpm build

# Configure and start services
# ... (follow traditional deployment steps)
```

## Chrome Extension Deployment

### 1. Build Extension
```bash
cd apps/extension
pnpm build
```

### 2. Chrome Web Store Publishing

1. Create a ZIP file:
```bash
cd build/chrome-mv3-prod
zip -r ../../etsy-manager-extension.zip *
```

2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
3. Click "New Item"
4. Upload the ZIP file
5. Fill in store listing details:
   - Add screenshots
   - Write description
   - Set category
   - Add promotional images

6. Submit for review

### 3. Self-Hosting (Development/Testing)

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `apps/extension/build/chrome-mv3-dev` directory

## Desktop App Distribution

### 1. Build for All Platforms
```bash
cd apps/desktop

# Build for current platform
pnpm dist

# Build for specific platforms
pnpm dist --mac
pnpm dist --win
pnpm dist --linux
```

### 2. Code Signing

#### Windows Code Signing
```bash
# Set environment variables
export CSC_LINK="path/to/certificate.pfx"
export CSC_KEY_PASSWORD="certificate-password"

pnpm dist --win
```

#### macOS Code Signing
```bash
# Set environment variables
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASS="app-specific-password"
export CSC_NAME="Developer ID Application: Your Name (XXXXXXXXXX)"

pnpm dist --mac
```

### 3. Distribution Channels

#### GitHub Releases
```bash
# Create a new release tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Upload built artifacts to GitHub Release
```

#### Auto-Update Server
Set up an update server for automatic updates:

```json
// apps/desktop/package.json
{
  "build": {
    "publish": [{
      "provider": "generic",
      "url": "https://updates.your-domain.com"
    }]
  }
}
```

## Post-Deployment Configuration

### 1. Set Up SSL Certificate

Using Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 2. Configure Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Set Up Backups

#### Database Backups
```bash
# Create backup script
cat > /home/ubuntu/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR
pg_dump etsy_manager | gzip > $BACKUP_DIR/etsy_manager_$(date +%Y%m%d_%H%M%S).sql.gz
# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x /home/ubuntu/backup-db.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup-db.sh
```

### 4. Configure Monitoring

#### Health Check Endpoint
The application includes a health check at `/api/health`:

```bash
# Monitor with curl
curl https://your-domain.com/api/health

# Use with monitoring services
# UptimeRobot, Pingdom, etc.
```

#### Application Monitoring
```javascript
// Configure Sentry (already integrated)
// Set SENTRY_DSN in environment variables
```

## Monitoring and Maintenance

### 1. Log Management

#### Application Logs
```bash
# PM2 logs
pm2 logs etsy-manager

# Docker logs
docker-compose logs -f web

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

#### Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/etsy-manager

/home/ubuntu/.pm2/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 0640 ubuntu ubuntu
}
```

### 2. Performance Monitoring

```bash
# Monitor system resources
htop

# Monitor PM2 processes
pm2 monit

# Monitor Docker containers
docker stats
```

### 3. Database Maintenance

```bash
# Analyze database performance
psql -U etsy_user -d etsy_manager -c "ANALYZE;"

# Vacuum database
psql -U etsy_user -d etsy_manager -c "VACUUM;"

# Check database size
psql -U etsy_user -d etsy_manager -c "SELECT pg_database_size('etsy_manager');"
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Errors
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection string
psql "postgresql://username:password@localhost:5432/etsy_manager"

# Check pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

#### 2. Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### 3. Memory Issues
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm start

# Check memory usage
free -h
```

#### 4. SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew

# Test certificate
sudo certbot certificates
```

### Debug Mode

Enable debug logging:
```bash
# Set debug environment variable
DEBUG=* pnpm start

# Or in production
NODE_ENV=production DEBUG=etsy-manager:* pm2 start ecosystem.config.js
```

### Health Checks

```bash
# Check application health
curl http://localhost:3000/api/health

# Check database connection
cd apps/web && pnpm prisma db pull

# Check Redis connection
redis-cli ping
```

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] SSL certificate is properly configured
- [ ] Firewall rules are configured
- [ ] Database uses strong passwords
- [ ] Regular backups are scheduled
- [ ] Monitoring is set up
- [ ] Error tracking (Sentry) is configured
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Security headers are set

## Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install dependencies
pnpm install

# Run database migrations
cd apps/web && pnpm prisma migrate deploy

# Build application
pnpm build

# Restart services
pm2 restart etsy-manager
# or
docker-compose up -d --build
```

## Support

For deployment issues:
1. Check the [troubleshooting section](#troubleshooting)
2. Review application logs
3. Check GitHub Issues
4. Contact support at support@your-domain.com

---

Last updated: January 2024