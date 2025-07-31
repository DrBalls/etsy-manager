// Renderer process script
const { electron } = window;

// Get elements
const webview = document.getElementById('webview') as any;
const loading = document.getElementById('loading')!;
const error = document.getElementById('error')!;
const errorMessage = document.getElementById('error-message')!;
const retryBtn = document.getElementById('retry')!;
const settingsBtn = document.getElementById('settings')!;
const titlebar = document.getElementById('titlebar')!;
const minimizeBtn = document.getElementById('minimize')!;
const maximizeBtn = document.getElementById('maximize')!;
const closeBtn = document.getElementById('close')!;

// Platform detection
const platform = navigator.platform.toLowerCase();
if (platform.includes('mac')) {
  titlebar.classList.add('darwin');
}

// Window controls
minimizeBtn.addEventListener('click', () => {
  electron.send('window-minimize');
});

maximizeBtn.addEventListener('click', () => {
  electron.send('window-maximize');
});

closeBtn.addEventListener('click', () => {
  electron.send('window-close');
});

// Load settings
async function loadSettings() {
  const apiUrl = await electron.store.get('apiUrl') || 'http://localhost:3000';
  return { apiUrl };
}

// Load webview
async function loadWebview() {
  const settings = await loadSettings();
  
  webview.addEventListener('did-start-loading', () => {
    loading.style.display = 'block';
    error.style.display = 'none';
  });

  webview.addEventListener('did-finish-load', () => {
    loading.style.display = 'none';
    webview.style.display = 'block';
    
    // Inject desktop-specific styles
    webview.insertCSS(`
      /* Hide web-specific elements in desktop app */
      .web-only { display: none !important; }
      
      /* Add desktop-specific styles */
      body { -webkit-user-select: none; }
      input, textarea { -webkit-user-select: text; }
    `);
    
    // Send desktop app info to web app
    webview.executeJavaScript(`
      window.isDesktopApp = true;
      window.desktopVersion = '${electron.app.getVersion()}';
      window.platform = '${platform}';
    `);
  });

  webview.addEventListener('did-fail-load', (event: any) => {
    loading.style.display = 'none';
    error.style.display = 'block';
    errorMessage.textContent = `Failed to load: ${event.errorDescription}`;
  });

  // Handle navigation
  webview.addEventListener('new-window', (event: any) => {
    event.preventDefault();
    electron.shell.openExternal(event.url);
  });

  // Handle IPC messages from main process
  electron.on('navigate', (event, path) => {
    webview.executeJavaScript(`
      if (window.router) {
        window.router.push('${path}');
      } else {
        window.location.pathname = '${path}';
      }
    `);
  });

  electron.on('create-new-listing', () => {
    webview.executeJavaScript(`
      if (window.createNewListing) {
        window.createNewListing();
      }
    `);
  });

  electron.on('open-bulk-edit', () => {
    webview.executeJavaScript(`
      if (window.openBulkEdit) {
        window.openBulkEdit();
      }
    `);
  });

  electron.on('sync-now', () => {
    webview.executeJavaScript(`
      if (window.syncNow) {
        window.syncNow();
      }
    `);
  });

  electron.on('export-listings', () => {
    webview.executeJavaScript(`
      if (window.exportListings) {
        window.exportListings();
      }
    `);
  });

  electron.on('import-listings', (event, filePath) => {
    webview.executeJavaScript(`
      if (window.importListings) {
        window.importListings('${filePath}');
      }
    `);
  });

  // Load the URL
  webview.src = settings.apiUrl;
}

// Retry button
retryBtn.addEventListener('click', () => {
  loadWebview();
});

// Settings button
settingsBtn.addEventListener('click', async () => {
  const result = await electron.dialog.showMessageBox({
    type: 'info',
    title: 'Settings',
    message: 'Configure API URL',
    detail: 'Enter the URL of your Etsy Store Manager instance',
    buttons: ['Cancel', 'OK'],
    defaultId: 1,
  });

  if (result.response === 1) {
    // TODO: Show input dialog for API URL
    // For now, just reload
    loadWebview();
  }
});

// Handle webview console messages
webview.addEventListener('console-message', (e: any) => {
  console.log('Webview:', e.message);
});

// Update tray stats periodically
setInterval(async () => {
  if (webview.style.display !== 'none') {
    const stats = await webview.executeJavaScript(`
      (function() {
        const stats = window.getTrayStats ? window.getTrayStats() : {};
        return stats;
      })();
    `);
    
    if (stats) {
      electron.send('update-tray-stats', stats);
    }
  }
}, 30000); // Update every 30 seconds

// Start loading
loadWebview();