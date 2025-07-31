import { ipcMain, dialog, shell, app, Notification, clipboard } from 'electron';
import Store from 'electron-store';
import { autoUpdater } from 'electron-updater';
import fs from 'fs/promises';
import path from 'path';

export function setupIpcHandlers(store: Store) {
  // Store management
  ipcMain.handle('store:get', async (_, key: string) => {
    return store.get(key);
  });

  ipcMain.handle('store:set', async (_, key: string, value: any) => {
    store.set(key, value);
  });

  ipcMain.handle('store:delete', async (_, key: string) => {
    store.delete(key);
  });

  ipcMain.handle('store:clear', async () => {
    store.clear();
  });

  // Dialog handlers
  ipcMain.handle('dialog:showOpenDialog', async (_, options) => {
    const result = await dialog.showOpenDialog(options);
    return result;
  });

  ipcMain.handle('dialog:showSaveDialog', async (_, options) => {
    const result = await dialog.showSaveDialog(options);
    return result;
  });

  ipcMain.handle('dialog:showMessageBox', async (_, options) => {
    const result = await dialog.showMessageBox(options);
    return result;
  });

  // File operations
  ipcMain.handle('file:read', async (_, filePath: string) => {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('file:write', async (_, filePath: string, data: string) => {
    try {
      await fs.writeFile(filePath, data, 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('file:exists', async (_, filePath: string) => {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  });

  // Shell operations
  ipcMain.handle('shell:openExternal', async (_, url: string) => {
    await shell.openExternal(url);
  });

  ipcMain.handle('shell:openPath', async (_, path: string) => {
    await shell.openPath(path);
  });

  ipcMain.handle('shell:showItemInFolder', async (_, path: string) => {
    shell.showItemInFolder(path);
  });

  // App info
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });

  ipcMain.handle('app:getName', () => {
    return app.getName();
  });

  ipcMain.handle('app:getPath', (_, name: any) => {
    return app.getPath(name);
  });

  // Notifications
  ipcMain.handle('notification:show', (_, options: Electron.NotificationConstructorOptions) => {
    if (Notification.isSupported()) {
      const notification = new Notification(options);
      notification.show();
      return true;
    }
    return false;
  });

  // Clipboard
  ipcMain.handle('clipboard:writeText', (_, text: string) => {
    clipboard.writeText(text);
  });

  ipcMain.handle('clipboard:readText', () => {
    return clipboard.readText();
  });

  // Auto updater
  ipcMain.handle('updater:checkForUpdates', async () => {
    return autoUpdater.checkForUpdates();
  });

  ipcMain.handle('updater:downloadUpdate', async () => {
    return autoUpdater.downloadUpdate();
  });

  ipcMain.handle('updater:quitAndInstall', () => {
    autoUpdater.quitAndInstall();
  });

  // Export functionality
  ipcMain.handle('export:csv', async (_, data: any[], filename: string) => {
    try {
      const { filePath } = await dialog.showSaveDialog({
        defaultPath: filename,
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      });

      if (filePath) {
        // Convert data to CSV
        const headers = Object.keys(data[0] || {}).join(',');
        const rows = data.map(item => 
          Object.values(item).map(val => 
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
          ).join(',')
        );
        const csv = [headers, ...rows].join('\n');
        
        await fs.writeFile(filePath, csv, 'utf-8');
        return { success: true, filePath };
      }
      
      return { success: false, cancelled: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Bulk operations
  ipcMain.handle('bulk:importCSV', async (_, filePath: string) => {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const lines = data.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const items = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index];
          return obj;
        }, {} as any);
      });
      
      return { success: true, data: items };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // System info
  ipcMain.handle('system:getInfo', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    };
  });
}