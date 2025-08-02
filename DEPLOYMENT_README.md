# 🚀 Etsy Manager Pro - Deployment Guide

## Quick Start (5 minutes)

### Option 1: One-Command Deploy (Recommended)
```bash
curl -fsSL https://raw.githubusercontent.com/DrBalls/etsy-manager/main/quick-deploy.sh | bash
```

### Option 2: Clone and Deploy
```bash
git clone https://github.com/DrBalls/etsy-manager.git
cd etsy-manager
./quick-deploy.sh
```

## 📋 Prerequisites

### Minimum Requirements
- **OS**: Linux, macOS, or Windows with WSL2
- **RAM**: 4GB minimum (8GB recommended)
- **Disk**: 5GB free space
- **Ports**: 3000, 8000, 5432, 6379 must be available

### Software Requirements
- **Git**: For cloning the repository
- **Docker & Docker Compose**: For containerized deployment (recommended)
- **Node.js 18+**: For non-Docker deployment
- **pnpm 9.15.0**: Package manager (auto-installed by scripts)

## 🛠️ Deployment Options

### 1. Automated Docker Deployment (Recommended)
```bash
./deploy-etsy-manager.sh
```

Features:
- Automatic dependency installation
- Interactive configuration
- Health checks and validation
- Monitoring setup option
- Comprehensive error handling

### 2. Quick Docker Deployment
```bash
./quick-deploy.sh
```

Features:
- Minimal prompts
- Sensible defaults
- Fast deployment
- Basic configuration

### 3. Manual Docker Deployment
```bash
# 1. Copy and configure environment
cp .env.docker.example .env
# Edit .env with your settings

# 2. Build and start services
docker-compose build
docker-compose up -d

# 3. Run database migrations
docker-compose exec web pnpm db:migrate
```

### 4. Traditional Deployment (No Docker)
```bash
./deploy-etsy-manager.sh --no-docker
```

This will:
- Install Node.js and pnpm if needed
- Set up PostgreSQL and Redis locally
- Use PM2 for process management
- Configure systemd services

### 5. Development Deployment
```bash
# Use the development setup script
./scripts/setup-dev-env.sh

# Or manually:
pnpm install
pnpm dev
```

## 🔑 Configuration

### Essential Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `ETSY_CLIENT_ID` | Your Etsy app client ID | ✅ | `abc123...` |
| `ETSY_CLIENT_SECRET` | Your Etsy app client secret | ✅ | `xyz789...` |
| `DATABASE_URL` | PostgreSQL connection string | ✅ | `postgresql://user:pass@localhost:5432/etsy_manager` |
| `NEXTAUTH_SECRET` | Authentication secret | ✅ | Auto-generated |
| `JWT_SECRET` | JWT signing secret | ✅ | Auto-generated |

### Getting Etsy API Credentials

1. Visit https://www.etsy.com/developers/register
2. Create a new app
3. Note your Client ID and Client Secret
4. Add these to your `.env` file

### OAuth Scopes Required
- `listings_r` - Read shop listings
- `listings_w` - Manage listings
- `shops_r` - Read shop information
- `transactions_r` - Read transaction data

## 🌐 Cloud Deployment

### Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### Deploy to Heroku
```bash
# Create app and add-ons
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set ETSY_CLIENT_ID=your_id
heroku config:set ETSY_CLIENT_SECRET=your_secret

# Deploy
git push heroku main
```

### Deploy to AWS
See `docs/aws-deployment.md` for detailed AWS ECS deployment guide.

## 🔧 Post-Deployment

### 1. Verify Installation
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Test endpoints
curl http://localhost:3000/api/health
curl http://localhost:8000/health
```

### 2. Create Admin User
1. Navigate to http://localhost:3000
2. Click "Sign Up"
3. First user automatically gets admin privileges

### 3. Connect Etsy Shop
1. Log in to the admin panel
2. Navigate to Settings → Integrations
3. Click "Connect Etsy Shop"
4. Authorize the application

### 4. Configure SSL (Production)
```bash
# Using the included SSL setup
./scripts/setup-ssl.sh yourdomain.com
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change ports in .env
WEB_PORT=3001
```

#### Database Connection Failed
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

#### Build Failures
```bash
# Clear caches and rebuild
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build

# Or with Docker
docker-compose build --no-cache
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Fix Docker permissions
sudo usermod -aG docker $USER
# Log out and back in
```

### Debug Mode
```bash
# Run with debug output
DEBUG=* ./deploy-etsy-manager.sh

# Or set in .env
NODE_ENV=development
DEBUG=etsy-manager:*
```

## 📊 Monitoring

### Built-in Monitoring
```bash
# Deploy monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d
```

Access:
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

### Health Checks
- Web Health: http://localhost:3000/api/health
- API Health: http://localhost:8000/health
- Metrics: http://localhost:8000/metrics

## 🔄 Updates

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d

# Run new migrations
docker-compose exec web pnpm db:migrate
```

### Backup Before Update
```bash
# Backup database
docker-compose exec postgres pg_dump -U etsy_user etsy_manager > backup.sql

# Backup uploads
tar -czf uploads-backup.tar.gz ./uploads
```

## 🛡️ Security

### Production Checklist
- [ ] Change all default passwords
- [ ] Enable SSL/TLS
- [ ] Configure firewall rules
- [ ] Set up regular backups
- [ ] Enable application monitoring
- [ ] Configure rate limiting
- [ ] Review OAuth permissions
- [ ] Set up log rotation

### Environment Hardening
```bash
# Generate secure secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For JWT_SECRET

# Restrict file permissions
chmod 600 .env
chmod 700 scripts/
```

## 📚 Additional Resources

- [Full Documentation](docs/README.md)
- [API Reference](docs/API_REFERENCE.md)
- [Development Guide](docs/DEVELOPMENT_GUIDE.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## 🆘 Support

### Get Help
- GitHub Issues: https://github.com/DrBalls/etsy-manager/issues
- Documentation: Check `/docs` directory
- Logs: `docker-compose logs -f [service]`

### Useful Commands
```bash
# View all logs
make logs

# Restart all services
make restart

# Run tests
make test

# Database console
make db-console

# Generate API docs
make docs
```

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.