# Etsy Store Manager

A comprehensive platform for managing Etsy stores with web app, Chrome extension, and desktop app capabilities.

## Features

### 🌐 Web Application
- **Dashboard**: Real-time metrics and store overview
- **Listing Management**: Create, edit, and manage product listings
- **Inventory Tracking**: Monitor stock levels with low-stock alerts
- **Order Processing**: Streamlined order management workflow
- **Analytics**: Comprehensive reporting and insights
- **Bulk Operations**: Import/export and bulk edit capabilities

### 🧩 Chrome Extension
- Quick listing edits directly from Etsy pages
- One-click sync functionality
- Real-time notifications
- Context menu integration

### 🖥️ Desktop Application
- Native desktop experience with Electron
- System tray integration
- Offline capabilities
- File system access for bulk operations

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Chrome Extension**: Plasmo Framework
- **Desktop App**: Electron
- **Package Management**: pnpm workspaces

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/etsy-manager.git
cd etsy-manager
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp apps/web/.env.example apps/web/.env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/etsy_manager"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
ETSY_CLIENT_ID="your-etsy-client-id"
ETSY_CLIENT_SECRET="your-etsy-client-secret"
```

4. Set up the database:
```bash
cd apps/web
pnpm prisma migrate dev
pnpm prisma generate
```

5. (Optional) Seed the database:
```bash
pnpm prisma db seed
```

### Development

#### Web Application
```bash
cd apps/web
pnpm dev
```
Visit [http://localhost:3000](http://localhost:3000)

#### Chrome Extension
```bash
cd apps/extension
pnpm dev
```
Load the extension from `apps/extension/build/chrome-mv3-dev`

#### Desktop Application
```bash
cd apps/desktop
pnpm dev
```

### Building for Production

#### Web Application
```bash
cd apps/web
pnpm build
pnpm start
```

#### Chrome Extension
```bash
cd apps/extension
pnpm build
```
The production build will be in `apps/extension/build/chrome-mv3-prod`

#### Desktop Application
```bash
cd apps/desktop
pnpm build
pnpm dist
```
The installers will be in `apps/desktop/dist-electron`

## Project Structure

```
etsy-manager/
├── apps/
│   ├── web/              # Next.js web application
│   ├── extension/        # Chrome extension
│   └── desktop/          # Electron desktop app
├── packages/
│   ├── shared/           # Shared utilities and types
│   └── ui/               # Shared UI components
└── docs/                 # Documentation
```

## Features Overview

### Authentication
- Email/password authentication
- OAuth integration with Etsy
- Session management with NextAuth.js

### Listing Management
- CRUD operations for listings
- Rich text editor for descriptions
- Image upload and management
- Category and tag management
- SEO optimization tools

### Inventory Tracking
- Real-time stock monitoring
- Low stock alerts
- Stock history tracking
- Bulk inventory updates

### Order Processing
- Order status management
- Shipping label generation
- Customer communication
- Order analytics

### Analytics & Reporting
- Sales metrics and trends
- Product performance
- Customer insights
- Custom date ranges
- Export capabilities

### Bulk Operations
- CSV/Excel import/export
- Bulk edit multiple listings
- Quick actions (activate, deactivate, etc.)
- Field mapping for imports
- Progress tracking

## API Documentation

The application provides RESTful APIs for all major operations:

- `/api/auth/*` - Authentication endpoints
- `/api/shops/*` - Shop management
- `/api/listings/*` - Listing operations
- `/api/inventory/*` - Inventory management
- `/api/orders/*` - Order processing
- `/api/analytics/*` - Analytics data
- `/api/bulk/*` - Bulk operations

## 📚 Documentation

- [Quick Start Guide](docs/QUICK_START.md) - Get running in 10 minutes
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Comprehensive deployment instructions
- [Production Checklist](docs/PRODUCTION_CHECKLIST.md) - Pre-launch verification
- [API Documentation](docs/API.md) - REST API reference
- [Database Schema](docs/DATABASE.md) - Data model documentation
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@etsymanager.com or join our Discord community.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Chrome extension framework by [Plasmo](https://www.plasmo.com/)
- Desktop app powered by [Electron](https://www.electronjs.org/)