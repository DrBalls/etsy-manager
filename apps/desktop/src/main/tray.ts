import { Tray, Menu, BrowserWindow, app, nativeImage, Notification } from 'electron';
import Store from 'electron-store';
import { join } from 'path';

export function createTray(mainWindow: BrowserWindow | null, store: Store): Tray {
  // Create tray icon
  const iconPath = join(__dirname, '../../resources/tray-icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath);
  
  const tray = new Tray(trayIcon);
  
  // Set tooltip
  tray.setToolTip('Etsy Store Manager');
  
  // Create context menu
  const updateContextMenu = (stats?: any) => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      { type: 'separator' },
      {
        label: stats ? `Orders Today: ${stats.ordersToday || 0}` : 'Orders Today: --',
        enabled: false
      },
      {
        label: stats ? `Revenue Today: $${stats.revenueToday || '0.00'}` : 'Revenue Today: --',
        enabled: false
      },
      {
        label: stats ? `Active Listings: ${stats.activeListings || 0}` : 'Active Listings: --',
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Quick Actions',
        submenu: [
          {
            label: 'New Listing',
            click: () => {
              mainWindow?.show();
              mainWindow?.webContents.send('create-new-listing');
            }
          },
          {
            label: 'View Orders',
            click: () => {
              mainWindow?.show();
              mainWindow?.webContents.send('navigate', '/dashboard/orders');
            }
          },
          {
            label: 'Sync Now',
            click: () => {
              mainWindow?.webContents.send('sync-now');
              
              // Show notification
              if (Notification.isSupported()) {
                new Notification({
                  title: 'Sync Started',
                  body: 'Syncing your Etsy store data...',
                  icon: trayIcon
                }).show();
              }
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: 'Settings',
        submenu: [
          {
            label: 'Start at Login',
            type: 'checkbox',
            checked: store.get('startAtLogin', false),
            click: (menuItem) => {
              store.set('startAtLogin', menuItem.checked);
              
              if (menuItem.checked) {
                app.setLoginItemSettings({
                  openAtLogin: true,
                  path: app.getPath('exe')
                });
              } else {
                app.setLoginItemSettings({
                  openAtLogin: false
                });
              }
            }
          },
          {
            label: 'Minimize to Tray',
            type: 'checkbox',
            checked: store.get('minimizeToTray', true),
            click: (menuItem) => {
              store.set('minimizeToTray', menuItem.checked);
            }
          },
          {
            label: 'Show Notifications',
            type: 'checkbox',
            checked: store.get('showNotifications', true),
            click: (menuItem) => {
              store.set('showNotifications', menuItem.checked);
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);
    
    tray.setContextMenu(contextMenu);
  };
  
  // Initial context menu
  updateContextMenu();
  
  // Handle tray click
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
  
  // Handle tray double click
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  
  // Listen for stats updates from renderer
  if (mainWindow) {
    mainWindow.webContents.on('ipc-message', (event, channel, data) => {
      if (channel === 'update-tray-stats') {
        updateContextMenu(data);
        
        // Update tray icon if there are new orders
        if (data.newOrders > 0) {
          // You could show a badge or different icon here
          tray.setToolTip(`Etsy Store Manager - ${data.newOrders} new orders!`);
        }
      }
    });
  }
  
  return tray;
}