import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Define the exposed API
const electronAPI = {
  // Store operations
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store:delete', key),
    clear: () => ipcRenderer.invoke('store:clear'),
  },
  
  // Dialog operations
  dialog: {
    showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:showOpenDialog', options),
    showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:showSaveDialog', options),
    showMessageBox: (options: any) => ipcRenderer.invoke('dialog:showMessageBox', options),
  },
  
  // File operations
  file: {
    read: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
    write: (filePath: string, data: string) => ipcRenderer.invoke('file:write', filePath, data),
    exists: (filePath: string) => ipcRenderer.invoke('file:exists', filePath),
  },
  
  // Shell operations
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
    openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
    showItemInFolder: (path: string) => ipcRenderer.invoke('shell:showItemInFolder', path),
  },
  
  // App operations
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getName: () => ipcRenderer.invoke('app:getName'),
    getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  },
  
  // Notification operations
  notification: {
    show: (options: any) => ipcRenderer.invoke('notification:show', options),
  },
  
  // Clipboard operations
  clipboard: {
    writeText: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),
    readText: () => ipcRenderer.invoke('clipboard:readText'),
  },
  
  // Auto updater
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:checkForUpdates'),
    downloadUpdate: () => ipcRenderer.invoke('updater:downloadUpdate'),
    quitAndInstall: () => ipcRenderer.invoke('updater:quitAndInstall'),
  },
  
  // Export operations
  export: {
    csv: (data: any[], filename: string) => ipcRenderer.invoke('export:csv', data, filename),
  },
  
  // Bulk operations
  bulk: {
    importCSV: (filePath: string) => ipcRenderer.invoke('bulk:importCSV', filePath),
  },
  
  // System info
  system: {
    getInfo: () => ipcRenderer.invoke('system:getInfo'),
  },
  
  // IPC communication
  on: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
  },
  
  off: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.off(channel, callback);
  },
  
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
  },
};

// Expose in main world
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
  } catch (error) {
    console.error(error);
  }
} else {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  (window as any).electron = electronAPI;
}

// Type declarations for TypeScript
declare global {
  interface Window {
    electron: typeof electronAPI;
  }
}
