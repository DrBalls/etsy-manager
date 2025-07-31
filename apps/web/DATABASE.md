# Database Schema Documentation

## Overview

The Etsy Manager uses PostgreSQL as its primary database with Prisma as the ORM. The schema is designed to efficiently store and manage Etsy shop data while providing fast access for analytics and reporting.

## Core Models

### User
- Stores user authentication and profile information
- Links to Etsy OAuth tokens for API access
- One user can manage multiple shops

### Shop
- Represents an Etsy shop
- Contains shop metadata and statistics
- Tracks sync status and settings

### Listing
- Products/items for sale on Etsy
- Includes pricing, inventory, and categorization
- Supports images and videos
- Tracks performance metrics (views, favorites)

### Order
- Customer orders/receipts from Etsy
- Includes financial details and shipping info
- Links to customer records
- Supports order status tracking

### Customer
- Buyer information and purchase history
- Aggregated statistics for customer insights
- Enables customer segmentation

### Inventory
- Detailed inventory tracking per product variation
- Low stock alerts and quantity management
- SKU support for advanced inventory

### Analytics
- Daily aggregated metrics for shops
- Traffic, sales, and engagement data
- Enables trend analysis and reporting

## Database Setup

### Prerequisites
- PostgreSQL 14+ (via Docker or local installation)
- Node.js 18+
- pnpm package manager

### Quick Setup

```bash
# From the web app directory
cd apps/web

# Run the setup script
./scripts/setup-db.sh

# Or manually:
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Run migrations
pnpm run db:migrate

# 3. Seed with test data (optional)
pnpm run db:seed

# 4. View database
pnpm run db:studio
```

### Environment Variables

Create `.env` file in `apps/web`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/etsy_manager?schema=public"
```

## Common Operations

### Migrations

```bash
# Create a new migration
pnpm run db:migrate -- --name your_migration_name

# Apply migrations
pnpm run db:migrate

# Reset database (WARNING: deletes all data)
pnpm exec prisma migrate reset
```

### Prisma Studio

View and edit data visually:

```bash
pnpm run db:studio
```

### Generate Types

After schema changes:

```bash
pnpm run db:generate
```

## Repository Pattern

The application uses a repository pattern for database access:

```typescript
import { ShopRepository } from '@/lib/repositories';

// Get user's shops
const shops = await ShopRepository.findByUserId(userId);

// Update shop stats
await ShopRepository.updateStats(shopId, {
  listingActiveCount: 42,
  saleCount: 100
});
```

## Performance Optimizations

### Indexes
- All foreign keys are indexed
- Unique constraints on Etsy IDs for fast lookups
- Composite indexes for common query patterns

### Caching Strategy
- Redis caches frequently accessed data
- Listing and shop data cached for 5 minutes
- Order data cached for 1 minute
- Analytics cached for 1 hour

### Batch Operations
- Bulk inserts for sync operations
- Transaction support for data consistency
- Pagination for large datasets

## Data Sync

The system maintains two-way sync with Etsy:

1. **Pull Sync**: Fetches latest data from Etsy API
   - Scheduled every 6 hours
   - Manual sync available
   - Incremental updates based on timestamps

2. **Push Sync**: Updates Etsy when local changes occur
   - Real-time for critical updates (inventory, orders)
   - Batched for non-critical updates

3. **Conflict Resolution**
   - Etsy data is source of truth
   - Local changes marked as pending until confirmed
   - Automatic retry with exponential backoff

## Security

- All sensitive data encrypted at rest
- OAuth tokens stored securely
- Row-level security via application logic
- No direct database access from client

## Backup and Recovery

Recommended backup strategy:

```bash
# Daily backups
pg_dump -h localhost -U postgres etsy_manager > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -h localhost -U postgres etsy_manager < backup_20250730.sql
```

## Monitoring

Key metrics to monitor:
- Query performance (>100ms queries)
- Connection pool usage
- Table sizes and growth
- Index usage statistics

## Future Considerations

- Partitioning for analytics table (by month)
- Read replicas for reporting queries
- Time-series database for detailed analytics
- Full-text search for listings