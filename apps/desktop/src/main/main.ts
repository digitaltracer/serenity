import { app, BrowserWindow, Menu, shell, ipcMain, systemPreferences, safeStorage } from 'electron';
import { join } from 'path';
import { isDev } from './utils';
import { apiService } from './services/ApiService';
import { registerAllIpcHandlers } from './ipc';

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
          {
            label: 'AI Assistant',
            accelerator: 'CmdOrCtrl+5',
            click: () => this.sendToRenderer('menu:navigate', 'ai-assistant')
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
    console.log('🔐 Initializing secure business logic layer...');

    // Register organized domain-specific IPC handlers
    registerAllIpcHandlers();

    // Handle PostgreSQL database operations (legacy compatibility)
    ipcMain.handle('database:test-connection', async (_, connectionUrl: string) => {
      try {
        // Import database functions in main process where Node.js modules are available
        const { testDatabaseConnection } = await import('@serenity/database');
        
        const isConnected = await testDatabaseConnection(connectionUrl);
        
        return { success: isConnected, error: isConnected ? null : 'Connection failed' };
      } catch (error) {
        let userFriendlyError = 'Connection failed';
        if (error instanceof Error) {
          if (error.message.includes('no pg_hba.conf entry')) {
            userFriendlyError = 'Server authentication failed. Try enabling SSL connection or contact your database administrator.';
          } else if (error.message.includes('ECONNREFUSED')) {
            userFriendlyError = 'Connection refused. Check if the database server is running and accessible.';
          } else if (error.message.includes('ENOTFOUND')) {
            userFriendlyError = 'Host not found. Check the server address in your connection URL.';
          } else if (error.message.includes('password authentication failed')) {
            userFriendlyError = 'Invalid username or password.';
          } else if (error.message.includes('database') && error.message.includes('does not exist')) {
            userFriendlyError = 'Database does not exist on the server.';
          } else {
            userFriendlyError = error.message;
          }
        }
        
        return { 
          success: false, 
          error: userFriendlyError
        };
      }
    });

    // Handle biometric authentication
    ipcMain.handle('biometric:isAvailable', async () => {
      if (process.platform === 'darwin') {
        try {
          const authType = systemPreferences.getMediaAccessStatus('microphone');
          // Check if Touch ID is available
          const canPromptTouchID = await systemPreferences.canPromptTouchID();
          return { available: canPromptTouchID, type: 'touchid' };
        } catch (error) {
          console.error('Error checking Touch ID availability:', error);
          return { available: false, type: null };
        }
      } else {
        // Windows Hello, Linux fingerprint, etc. could be added here
        return { available: false, type: null };
      }
    });

    ipcMain.handle('biometric:authenticate', async (_, reason = 'authenticate') => {
      if (process.platform === 'darwin') {
        try {
          await systemPreferences.promptTouchID(reason);
          return { success: true, error: null };
        } catch (error) {
          console.error('Touch ID authentication failed:', error);
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Authentication failed',
            cancelled: (error as any)?.message?.includes('cancelled') || (error as any)?.message?.includes('User cancel')
          };
        }
      } else {
        return { success: false, error: 'Biometric authentication not available on this platform' };
      }
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

    // Handle Google OAuth flow
    ipcMain.handle('oauth:google:start', async (_, clientId: string, clientSecret: string) => {
      try {
        const authUrl = this.startGoogleOAuth(clientId, clientSecret);
        return { success: true, authUrl, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to start OAuth';
        return { success: false, authUrl: null, error: errorMessage };
      }
    });

    // Handle safeStorage operations
    ipcMain.handle('safeStorage:encryptString', async (_, plaintext: string) => {
      try {
        if (!safeStorage.isEncryptionAvailable()) {
          throw new Error('Encryption is not available on this system');
        }
        const encrypted = safeStorage.encryptString(plaintext);
        return encrypted.toString('base64'); // Convert to base64 for safe transport
      } catch (error) {
        console.error('Failed to encrypt string:', error);
        throw error;
      }
    });

    ipcMain.handle('safeStorage:decryptString', async (_, encryptedBase64: string) => {
      try {
        if (!safeStorage.isEncryptionAvailable()) {
          throw new Error('Encryption is not available on this system');
        }
        const encrypted = Buffer.from(encryptedBase64, 'base64');
        const decrypted = safeStorage.decryptString(encrypted);
        return decrypted;
      } catch (error) {
        console.error('Failed to decrypt string:', error);
        throw error;
      }
    });

    console.log('✅ All IPC handlers registered and ready');
  }

  private currentOAuthWindow: BrowserWindow | null = null;

  private startGoogleOAuth(clientId: string, clientSecret: string): string {
    const REDIRECT_URI = 'http://localhost:8080/oauth/callback';
    const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email';

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    
    // Close any existing OAuth window
    if (this.currentOAuthWindow && !this.currentOAuthWindow.isDestroyed()) {
      this.currentOAuthWindow.close();
    }
    
    // Create OAuth window
    this.currentOAuthWindow = new BrowserWindow({
      width: 500,
      height: 600,
      show: true,
      modal: true,
      parent: this.mainWindow || undefined,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
      // Ensure window is always closable
      titleBarStyle: 'default',
      minimizable: false,
      maximizable: false,
      resizable: false,
      closable: true, // Explicitly allow closing
      alwaysOnTop: false,
      skipTaskbar: false,
      title: 'Google Calendar Authentication',
    });

    this.currentOAuthWindow.loadURL(authUrl);
    
    // Store client credentials for token exchange
    (this.currentOAuthWindow as any).clientCredentials = { clientId, clientSecret };
    
    // Note: Custom close button temporarily disabled to prevent OAuth issues
    // The window already has native close controls via titleBarStyle: 'default'

    // Handle OAuth callback
    this.currentOAuthWindow.webContents.on('will-redirect', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      
      if (parsedUrl.origin === 'http://localhost:8080' && parsedUrl.pathname === '/oauth/callback') {
        const code = parsedUrl.searchParams.get('code');
        const error = parsedUrl.searchParams.get('error');
        
        if (code && this.currentOAuthWindow) {
          // Exchange code for tokens using stored credentials
          const credentials = (this.currentOAuthWindow as any).clientCredentials;
          if (credentials && credentials.clientId && credentials.clientSecret) {
            this.exchangeGoogleOAuthCode(code, credentials.clientId, credentials.clientSecret);
          } else {
            console.error('OAuth credentials missing during token exchange');
            this.mainWindow?.webContents.send('oauth:google:error', 'Missing client credentials');
          }
        } else if (error) {
          console.error('OAuth error:', error);
          this.mainWindow?.webContents.send('oauth:google:error', error);
        }
        
        if (this.currentOAuthWindow && !this.currentOAuthWindow.isDestroyed()) {
          this.currentOAuthWindow.close();
        }
      }
    });

    this.currentOAuthWindow.on('closed', () => {
      // Handle window closed without completion
      this.mainWindow?.webContents.send('oauth:google:cancelled');
      this.currentOAuthWindow = null;
    });

    return authUrl;
  }

  private async exchangeGoogleOAuthCode(code: string, clientId: string, clientSecret: string): Promise<void> {
    try {
      console.log('🔄 Starting token exchange with Google...');
      const REDIRECT_URI = 'http://localhost:8080/oauth/callback';

      console.log('📤 Sending token request to Google...');
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
          code: code,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Token exchange failed:', response.status, response.statusText, errorText);
        throw new Error(`Token exchange failed: ${response.statusText} - ${errorText}`);
      }

      console.log('✅ Token exchange successful, parsing response...');
      const tokens: any = await response.json();
      console.log('📋 Received tokens from Google (access token length:', tokens.access_token?.length, ')');
      
      // Get user info
      console.log('👤 Fetching user info from Google...');
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });

      if (!userResponse.ok) {
        console.error('❌ User info fetch failed:', userResponse.status, userResponse.statusText);
        throw new Error(`User info fetch failed: ${userResponse.statusText}`);
      }

      const userInfo: any = await userResponse.json();
      console.log('✅ User info received for:', userInfo.email);

      const authData = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + (tokens.expires_in * 1000),
        userEmail: userInfo.email,
      };

      console.log('📤 Sending OAuth success to renderer...');
      // Send tokens back to renderer
      this.mainWindow?.webContents.send('oauth:google:success', authData);
    } catch (error) {
      console.error('Token exchange failed:', error);
      this.mainWindow?.webContents.send('oauth:google:error', error instanceof Error ? error.message : 'Token exchange failed');
    }
  }

  private sendToRenderer(channel: string, ...args: any[]): void {
    this.mainWindow?.webContents.send(channel, ...args);
  }
}

// Initialize the app
new AppManager();