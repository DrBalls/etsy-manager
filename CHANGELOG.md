# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of Etsy Store Manager
- Web application with Next.js 14
  - Authentication system with NextAuth.js
  - Dashboard with real-time metrics
  - Listing management (CRUD operations)
  - Inventory tracking with low-stock alerts
  - Order processing workflows
  - Analytics and reporting
  - Bulk operations (import/export, bulk edit)
- Chrome extension
  - Quick edit listings from Etsy pages
  - Context menu integration
  - Background sync
  - Popup interface
- Desktop application with Electron
  - System tray integration
  - Native menu system
  - IPC handlers for file operations
  - Auto-updater support
- Comprehensive database schema with Prisma
- RESTful API endpoints
- Real-time synchronization with Etsy API
- CSV/Excel import/export functionality
- Responsive UI with Tailwind CSS
- TypeScript throughout

### Security
- Secure authentication with encrypted sessions
- CSRF protection
- Input validation and sanitization
- Secure API token storage

## [0.1.0] - 2024-01-XX

### Added
- Initial project setup
- Basic project structure
- Development environment configuration