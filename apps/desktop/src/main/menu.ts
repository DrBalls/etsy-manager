import { Menu, MenuItemConstructorOptions, BrowserWindow, shell, app, dialog } from 'electron';
import Store from 'electron-store';

export function createAppMenu(mainWindow: BrowserWindow | null, store: Store): Menu {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        {
          label: 'Preferences...',
          accelerator: 'Cmd+,',
          click: () => {
            mainWindow?.webContents.send('open-preferences');
          }
        },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ] as MenuItemConstructorOptions[]
    }] : []),

    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Listing',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('create-new-listing');
          }
        },
        {
          label: 'Import Listings...',
          accelerator: 'CmdOrCtrl+I',
          click: async () => {
            const result = await dialog.showOpenDialog({
              properties: ['openFile'],
              filters: [
                { name: 'CSV Files', extensions: ['csv'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });
            
            if (!result.canceled && result.filePaths[0]) {
              mainWindow?.webContents.send('import-listings', result.filePaths[0]);
            }
          }
        },
        {
          label: 'Export Listings...',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow?.webContents.send('export-listings');
          }
        },
        { type: 'separator' },
        {
          label: 'Print',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow?.webContents.print();
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ] as MenuItemConstructorOptions[]
    },

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' as const },
          { role: 'delete' as const },
          { role: 'selectAll' as const },
          { type: 'separator' as const },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' as const },
              { role: 'stopSpeaking' as const }
            ]
          }
        ] : [
          { role: 'delete' as const },
          { type: 'separator' as const },
          { role: 'selectAll' as const }
        ])
      ]
    },

    // View menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow?.webContents.send('navigate', '/dashboard');
          }
        },
        {
          label: 'Listings',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow?.webContents.send('navigate', '/dashboard/listings');
          }
        },
        {
          label: 'Orders',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow?.webContents.send('navigate', '/dashboard/orders');
          }
        },
        {
          label: 'Analytics',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            mainWindow?.webContents.send('navigate', '/dashboard/analytics');
          }
        },
        { type: 'separator' },
        {
          label: 'Refresh',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow?.webContents.reload();
          }
        },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },

    // Tools menu
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Bulk Edit',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow?.webContents.send('open-bulk-edit');
          }
        },
        {
          label: 'Price Calculator',
          click: () => {
            mainWindow?.webContents.send('open-price-calculator');
          }
        },
        {
          label: 'Keyword Research',
          click: () => {
            mainWindow?.webContents.send('open-keyword-research');
          }
        },
        { type: 'separator' },
        {
          label: 'Sync Now',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('sync-now');
          }
        },
        {
          label: 'Clear Cache',
          click: async () => {
            const result = await dialog.showMessageBox({
              type: 'warning',
              buttons: ['Cancel', 'Clear Cache'],
              defaultId: 0,
              message: 'Clear application cache?',
              detail: 'This will remove all cached data and may require re-syncing with Etsy.'
            });
            
            if (result.response === 1) {
              await mainWindow?.webContents.session.clearCache();
              mainWindow?.webContents.reload();
            }
          }
        }
      ]
    },

    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
          { type: 'separator' as const },
          { role: 'window' as const }
        ] : [])
      ]
    },

    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://docs.etsymanager.com');
          }
        },
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            mainWindow?.webContents.send('show-shortcuts');
          }
        },
        { type: 'separator' },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/etsymanager/desktop/issues');
          }
        },
        {
          label: 'Contact Support',
          click: () => {
            shell.openExternal('mailto:support@etsymanager.com');
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Updates...',
          click: () => {
            mainWindow?.webContents.send('check-for-updates');
          }
        },
        ...(isMac ? [] : [
          { type: 'separator' as const },
          {
            label: 'About',
            click: () => {
              dialog.showMessageBox({
                type: 'info',
                title: 'About Etsy Store Manager',
                message: 'Etsy Store Manager',
                detail: `Version ${app.getVersion()}\n\nA powerful desktop application for managing your Etsy store.`,
                buttons: ['OK']
              });
            }
          }
        ])
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
}