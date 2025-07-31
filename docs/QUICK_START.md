# Etsy Store Manager - Quick Start Guide

Get up and running with Etsy Store Manager in under 10 minutes!

## 🚀 Quick Local Development Setup

### Prerequisites
- Node.js 18+ installed
- PostgreSQL installed locally or Docker
- pnpm (`npm install -g pnpm`)

### 1. Clone and Install
```bash
# Clone the repository
git clone https://github.com/your-username/etsy-manager.git
cd etsy-manager

# Install dependencies
pnpm install
```

### 2. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Database will be available at:
# postgresql://etsy_user:etsy_password@localhost:5432/etsy_manager
```

#### Option B: Using Local PostgreSQL
```bash
# Create database
createdb etsy_manager

# Update DATABASE_URL in .env
```

### 3. Environment Configuration
```bash
# Copy example environment file
cp apps/web/.env.example apps/web/.env

# Edit the file and add your credentials
nano apps/web/.env
```

**Minimum required variables:**
```env
DATABASE_URL="postgresql://etsy_user:etsy_password@localhost:5432/etsy_manager"
NEXTAUTH_SECRET="your-secret-here"  # Generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Initialize Database
```bash
# Generate Prisma client
cd apps/web
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# (Optional) Seed with sample data
pnpm prisma db seed
```

### 5. Start Development Server
```bash
# From project root
pnpm dev

# Or start individual apps
pnpm dev --filter=@etsy-manager/web      # Web app only
pnpm dev --filter=@etsy-manager/extension # Extension only
pnpm dev --filter=@etsy-manager/desktop   # Desktop app only
```

### 6. Access the Application
- Web App: http://localhost:3000
- Login with seeded user: `admin@example.com` / `password123`

## 🎯 Quick Production Deployment

### Using Docker (Fastest)
```bash
# Create production env file
cp .env.example .env
# Edit .env with production values

# Build and run
docker-compose up -d

# Application available at http://localhost:3000
```

### Using Vercel (Easiest)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/web
vercel

# Follow prompts and add environment variables
```

## 📱 Quick Extension Setup

### Development
```bash
# Build extension
pnpm build --filter=@etsy-manager/extension

# Load in Chrome:
# 1. Open chrome://extensions/
# 2. Enable Developer Mode
# 3. Load unpacked: apps/extension/build/chrome-mv3-dev
```

## 🖥️ Quick Desktop App Setup

### Development
```bash
# Start desktop app
pnpm dev --filter=@etsy-manager/desktop

# Build for current platform
cd apps/desktop
pnpm dist
```

## 🔧 Common Commands

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build all apps
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm typecheck

# Database commands (from apps/web)
pnpm prisma studio     # Visual database editor
pnpm prisma migrate dev # Create migration
pnpm prisma db push    # Push schema changes
```

## 🐛 Quick Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database connection issues
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql "postgresql://etsy_user:etsy_password@localhost:5432/etsy_manager"
```

### Dependencies issues
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Build errors
```bash
# Clean build
pnpm clean
pnpm build
```

## 📚 Next Steps

1. **Configure Etsy API**: Get credentials from [Etsy Developers](https://www.etsy.com/developers/)
2. **Set up authentication**: Configure OAuth providers in `.env`
3. **Customize settings**: Update `apps/web/config/settings.ts`
4. **Deploy to production**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🆘 Need Help?

- Check the full [README.md](../README.md)
- Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- See [CONTRIBUTING.md](../CONTRIBUTING.md)
- Open an issue on GitHub

---

Happy selling! 🛍️