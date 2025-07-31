# Etsy Store Manager Desktop App

A powerful desktop application for managing your Etsy store with native features and enhanced performance.

## Features

### 🖥️ Native Desktop Experience
- **System Tray Integration**: Quick access to key features
- **Desktop Notifications**: Real-time alerts for orders and messages
- **Keyboard Shortcuts**: Boost productivity with hotkeys
- **File System Access**: Direct import/export capabilities

### 🚀 Performance Benefits
- **Offline Support**: Work without internet connection
- **Local Caching**: Faster data access
- **Background Sync**: Automatic data synchronization
- **Resource Optimization**: Efficient memory usage

### 🔧 Desktop-Specific Features
- **Bulk File Import**: Drag & drop CSV files
- **Quick Export**: One-click data export
- **Print Support**: Native printing capabilities
- **Auto Updates**: Seamless app updates

## Installation

### Download
- **Windows**: [Download .exe installer](https://etsymanager.com/download/windows)
- **macOS**: [Download .dmg installer](https://etsymanager.com/download/mac)
- **Linux**: [Download .AppImage](https://etsymanager.com/download/linux)

### System Requirements
- **Windows**: Windows 10 or later
- **macOS**: macOS 10.13 or later
- **Linux**: Ubuntu 18.04 or equivalent

## Development

### Prerequisites
- Node.js 18+
- pnpm
- Git

### Setup
```bash
# Clone repository
git clone https://github.com/etsymanager/desktop.git
cd desktop

# Install dependencies
pnpm install

# Run in development
pnpm dev

# Build for production
pnpm build

# Package for distribution
pnpm package
```

### Project Structure
```
src/
├── main/           # Main process (Electron)
│   ├── index.ts    # App entry point
│   ├── menu.ts     # Application menu
│   └── tray.ts     # System tray
├── preload/        # Preload scripts
│   └── index.ts    # API bridge
├── renderer/       # Renderer process
│   ├── index.html  # App shell
│   └── renderer.ts # Renderer logic
└── resources/      # App resources
    └── icons/      # App icons
```

### Key Technologies
- **Electron**: Cross-platform desktop framework
- **Electron Vite**: Build tooling
- **Electron Store**: Persistent data storage
- **Electron Updater**: Auto-update functionality

## Configuration

### Settings Storage
Settings are stored in:
- **Windows**: `%APPDATA%/etsy-store-manager`
- **macOS**: `~/Library/Application Support/etsy-store-manager`
- **Linux**: `~/.config/etsy-store-manager`

### Available Settings
```json
{
  "apiUrl": "http://localhost:3000",
  "startAtLogin": false,
  "minimizeToTray": true,
  "showNotifications": true,
  "autoSync": true,
  "syncInterval": 30
}
```

## Features in Detail

### System Tray
- Shows current stats (orders, revenue, listings)
- Quick actions menu
- Settings access
- App visibility toggle

### Menu Bar
- **File**: New listing, import/export, print
- **Edit**: Standard editing operations
- **View**: Navigation shortcuts
- **Tools**: Bulk edit, calculators, sync
- **Window**: Window management
- **Help**: Documentation, support

### Keyboard Shortcuts
- `Cmd/Ctrl + N`: New listing
- `Cmd/Ctrl + I`: Import listings
- `Cmd/Ctrl + E`: Export listings
- `Cmd/Ctrl + S`: Sync now
- `Cmd/Ctrl + B`: Bulk edit
- `Cmd/Ctrl + 1-4`: Navigate sections

### Notifications
- New order alerts
- Low inventory warnings
- Sync status updates
- Error notifications

### IPC Communication
The app uses secure IPC channels for:
- File operations
- System dialogs
- Clipboard access
- Shell operations
- Store management

## Security

### Permissions
- File system access (user-approved)
- Network access (API communication)
- Notification permissions
- System tray access

### Data Protection
- Encrypted local storage
- Secure API communication
- No telemetry without consent
- Sandboxed renderer process

## Troubleshooting

### App won't start
1. Check if port 3000 is available
2. Verify API server is running
3. Clear app data and restart
4. Check logs in app data directory

### Connection issues
1. Verify API URL in settings
2. Check firewall settings
3. Test API connectivity
4. Review proxy settings

### Performance issues
1. Clear cache from Tools menu
2. Reduce sync frequency
3. Check system resources
4. Disable unnecessary features

## Building & Distribution

### Code Signing
- **Windows**: Requires code signing certificate
- **macOS**: Requires Apple Developer ID
- **Linux**: No signing required

### Auto Updates
Configure update server in `electron-builder.yml`:
```yaml
publish:
  provider: github
  owner: etsymanager
  repo: desktop
```

### Build Commands
```bash
# Windows
pnpm build:win

# macOS
pnpm build:mac

# Linux
pnpm build:linux

# All platforms
pnpm build:all
```

## Support

For issues or questions:
- [Documentation](https://docs.etsymanager.com/desktop)
- [GitHub Issues](https://github.com/etsymanager/desktop/issues)
- Email: desktop@etsymanager.com