# Etsy Store Manager Extension

A powerful Chrome extension that enhances the Etsy seller experience with advanced management tools.

## Features

### 🚀 Quick Actions
- **Quick Edit**: Edit listings directly from Etsy pages
- **Bulk Operations**: Select and update multiple listings at once
- **One-Click Sync**: Sync listings with your dashboard instantly

### 📊 Analytics Integration
- **Competition Analysis**: Real-time market insights on search pages
- **Performance Metrics**: View listing stats without leaving Etsy
- **Traffic Sources**: See where your views are coming from

### 🔔 Smart Notifications
- **New Orders**: Get instant alerts for new sales
- **Messages**: Never miss customer inquiries
- **Inventory Alerts**: Low stock warnings

### ⚡ Page Enhancements
- **Enhanced Listings Manager**: Bulk actions and filters
- **Order Processing**: Quick fulfill and ship options
- **Dashboard Widgets**: Key metrics at a glance

## Installation

### Development
1. Run `pnpm dev` in the extension directory
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `build/chrome-mv3-dev` directory

### Production
1. Run `pnpm build` to create production build
2. The extension will be in `build/chrome-mv3-prod`
3. Upload to Chrome Web Store or distribute the .zip file

## Configuration

1. Click the extension icon in Chrome toolbar
2. Go to Settings tab
3. Enter your API URL and authentication token
4. Configure features and sync settings

## Usage

### Quick Edit
- Navigate to any Etsy listing page
- Click the "Quick Edit" button in the toolbar
- Make changes and save instantly

### Competition Analysis
- Go to any Etsy search results page
- The analysis panel appears automatically
- View average prices, top keywords, and recommendations

### Bulk Operations
1. Go to your Etsy listings manager
2. Select multiple listings using checkboxes
3. Choose an action from the bulk actions menu
4. Confirm and apply changes

## Development

### Project Structure
```
src/
├── background/          # Background service worker
├── content/            # Content scripts
├── components/         # React components
├── popup.tsx          # Extension popup
├── options.tsx        # Options page
└── utils/             # Utilities and helpers
```

### Key Technologies
- Plasmo Framework
- React 18
- TypeScript
- Chrome Extensions Manifest V3

### API Integration
The extension communicates with your Etsy Store Manager backend via:
- REST API for data operations
- WebSocket for real-time updates
- Local storage for caching

## Permissions

The extension requires:
- **Storage**: Save settings and cache data
- **Tabs**: Access Etsy pages
- **ContextMenus**: Add right-click options
- **Host Permission**: Access etsy.com domains

## Security

- All API calls use secure HTTPS
- Authentication tokens are encrypted
- No sensitive data is stored locally
- Follows Chrome's security best practices

## Troubleshooting

### Extension not working
1. Check if you're logged into Etsy
2. Verify API URL and token in settings
3. Check browser console for errors
4. Try reloading the extension

### Sync issues
1. Ensure stable internet connection
2. Check API server status
3. Verify authentication token
4. Try manual sync from popup

## Support

For issues or questions:
- Check the [documentation](https://docs.etsymanager.com)
- Contact support at support@etsymanager.com
- Report bugs on GitHub