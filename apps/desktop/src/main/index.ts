import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { 
  BrowserWindow, 
  app, 
  shell, 
  ipcMain, 
  Menu, 
  Tray, 
  nativeImage,
  dialog,
  Notification
} from 'electron';
import { join } from 'path';
import Store from 'electron-store';
import { autoUpdater } from 'electron-updater';
import { setupIpcHandlers } from './ipc-handlers';
import { createAppMenu } from './menu';
import { createTray } from './tray';

// Initialize store
const store = new Store();

// Global reference to keep windows alive
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: false,
    icon: join(__dirname, '../../resources/icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    if (!store.get('startMinimized')) {
      mainWindow?.show();
    }
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting && store.get('minimizeToTray', true)) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load the app
  const startUrl = is.dev && process.env['ELECTRON_RENDERER_URL'] 
    ? process.env['ELECTRON_RENDERER_URL']
    : store.get('apiUrl', 'http://localhost:3000');

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    // In production, load the web app
    void mainWindow.loadURL(startUrl as string);
  }
}

// Add app quit flag
declare module 'electron' {
  interface App {
    isQuitting?: boolean;
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
void app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.etsymanager');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Setup IPC handlers
  setupIpcHandlers(store);

  // Create tray
  tray = createTray(mainWindow, store);

  // Create app menu
  const menu = createAppMenu(mainWindow, store);
  Menu.setApplicationMenu(menu);

  createWindow();

  // Setup auto updater
  autoUpdater.checkForUpdatesAndNotify();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Handle app quit
app.on('before-quit', () => {
  app.isQuitting = true;
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
