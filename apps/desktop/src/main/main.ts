import { app, BrowserWindow, Menu, shell, ipcMain } from 'electron';
import { join } from 'path';
import { isDev } from './utils';

class AppManager {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.initializeApp();
  }

  private initializeApp(): void {
    // Handle app ready
    app.whenReady().then(() => {
      this.createWindow();
      this.setupMenu();
      this.setupIPC();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    // Handle all windows closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Security: Prevent new window creation
    app.on('web-contents-created', (_, contents) => {
      contents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
      });
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      titleBarStyle: 'hiddenInset',
      titleBarOverlay: {
        color: '#ffffff',
        symbolColor: '#000000',
        height: 40,
      },
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js'),
      },
      show: false,
    });

    // Load the app
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(join(__dirname, 'renderer/index.html'));
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'Serenity Notes',
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      {
        label: 'File',
        submenu: [
          {
            label: 'New Task',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.sendToRenderer('menu:new-task')
          },
          {
            label: 'New Journal Entry',
            accelerator: 'CmdOrCtrl+Shift+N',
            click: () => this.sendToRenderer('menu:new-entry')
          },
          { type: 'separator' },
          {
            label: 'Quick Add',
            accelerator: 'CmdOrCtrl+K',
            click: () => this.sendToRenderer('menu:quick-add')
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' }
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'ActionHub',
            accelerator: 'CmdOrCtrl+1',
            click: () => this.sendToRenderer('menu:navigate', 'actionhub')
          },
          {
            label: 'Today',
            accelerator: 'CmdOrCtrl+2',
            click: () => this.sendToRenderer('menu:navigate', 'today')
          },
          {
            label: 'Journal',
            accelerator: 'CmdOrCtrl+3',
            click: () => this.sendToRenderer('menu:navigate', 'journal')
          },
          {
            label: 'Analytics',
            accelerator: 'CmdOrCtrl+4',
            click: () => this.sendToRenderer('menu:navigate', 'analytics')
          },
          { type: 'separator' },
          {
            label: 'Lock App',
            accelerator: 'CmdOrCtrl+L',
            click: () => this.sendToRenderer('menu:lock-app')
          },
          { type: 'separator' },
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIPC(): void {
    // Handle database operations
    ipcMain.handle('database:test-connection', async (_, config) => {
      // This will be implemented when we add database connection
      return { success: true };
    });

    // Handle window operations
    ipcMain.handle('window:minimize', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle('window:close', () => {
      this.mainWindow?.close();
    });
  }

  private sendToRenderer(channel: string, ...args: any[]): void {
    this.mainWindow?.webContents.send(channel, ...args);
  }
}

// Initialize the app
new AppManager();