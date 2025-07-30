import { app, BrowserWindow, Menu, shell, ipcMain, systemPreferences, safeStorage } from 'electron';
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
    // Handle PostgreSQL database operations (legacy)
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

    // Handle SQLite database operations
    let sqliteService: any = null;

    // Function to verify data loading from SQLite
    ipcMain.handle('sqlite:verify-data-loading', async () => {
      try {
        if (!sqliteService) {
          const { sqliteService: service } = await import('@serenity/database');
          sqliteService = service;
          await sqliteService.initialize();
        }

        console.log('🔍 VERIFYING DATA LOADING FROM SQLITE...');
        
        // Get all data just like the renderer should
        const tasksData = await sqliteService.getTasks();
        const projectsData = await sqliteService.getProjects();
        const journalData = await sqliteService.getJournalEntries();
        
        console.log('📊 VERIFICATION RESULTS:');
        console.log(`  - Tasks in SQLite: ${tasksData.length}`);
        console.log(`  - Projects in SQLite: ${projectsData.length}`);
        console.log(`  - Journal entries in SQLite: ${journalData.length}`);
        
        if (tasksData.length > 0) {
          console.log('📋 TASKS IN SQLITE:');
          tasksData.forEach((task: any, i: number) => {
            console.log(`  ${i+1}. ${task.title} (${task.id})`);
          });
        }

        return { 
          success: true, 
          tasks: tasksData,
          projects: projectsData,
          journal: journalData,
          counts: {
            tasks: tasksData.length,
            projects: projectsData.length,
            journal: journalData.length
          }
        };
      } catch (error) {
        console.error('❌ Data loading verification failed:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });

    // Test function to verify SQLite persistence
    ipcMain.handle('sqlite:test-persistence', async () => {
      try {
        if (!sqliteService) {
          const { sqliteService: service } = await import('@serenity/database');
          sqliteService = service;
          await sqliteService.initialize();
        }

        console.log('🧪 Testing SQLite persistence...');
        
        // Create a test task
        const testTask = {
          title: 'SQLite Test Task',
          description: 'Testing SQLite persistence',
          completed: false,
          priority: 'high' as const,
          tags: ['test'],
          dueDate: new Date()
        };

        console.log('📝 Creating test task:', testTask);
        const createdTask = await sqliteService.createTask(testTask);
        console.log('✅ Task created in SQLite:', createdTask);

        // Retrieve all tasks and log what we got
        console.log('📂 Retrieving all tasks from SQLite...');
        const allTasks = await sqliteService.getTasks();
        console.log('📊 TOTAL TASKS IN SQLITE:', allTasks.length);
        console.log('📋 TASKS RETRIEVED FROM SQLITE:');
        allTasks.forEach((task: any, index: number) => {
          console.log(`  ${index + 1}. ${task.title} (ID: ${task.id})`);
          console.log(`     Description: ${task.description}`);
          console.log(`     Priority: ${task.priority}, Completed: ${task.completed}`);
          console.log(`     Created: ${task.createdAt}`);
          console.log('     ---');
        });

        return { 
          success: true, 
          createdTask, 
          allTasks,
          totalTasks: allTasks.length 
        };
      } catch (error) {
        console.error('❌ SQLite test failed:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });

    ipcMain.handle('sqlite:initialize', async () => {
      try {
        const { sqliteService: service } = await import('@serenity/database');
        sqliteService = service;
        await sqliteService.initialize();
        
        return { success: true, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize database';
        return { success: false, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:test-connection', async () => {
      try {
        if (!sqliteService) {
          const { sqliteService: service } = await import('@serenity/database');
          sqliteService = service;
          await sqliteService.initialize();
        }
        
        const isConnected = await sqliteService.testConnection();
        return { success: isConnected, error: isConnected ? null : 'Connection failed' };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
        return { success: false, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:get-stats', async () => {
      try {
        if (!sqliteService) {
          throw new Error('Database not initialized');
        }
        
        const stats = sqliteService.getStatistics();
        return { success: true, data: stats, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get statistics';
        return { success: false, data: null, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:backup', async (_, backupPath?: string) => {
      try {
        if (!sqliteService) {
          throw new Error('Database not initialized');
        }
        
        const path = await sqliteService.backup(backupPath);
        return { success: true, path, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Backup failed';
        return { success: false, path: null, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:import-from-localstorage', async (_, data) => {
      try {
        if (!sqliteService) {
          const { sqliteService: service } = await import('@serenity/database');
          sqliteService = service;
          await sqliteService.initialize();
        }
        
        const result = await sqliteService.importFromLocalStorage(data);
        return { success: true, result, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Import failed';
        return { success: false, result: null, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:export-all-data', async () => {
      try {
        if (!sqliteService) {
          throw new Error('Database not initialized');
        }
        
        const data = await sqliteService.exportAllData();
        return { success: true, data, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Export failed';
        return { success: false, data: null, error: errorMessage };
      }
    });

    // Task operations
    ipcMain.handle('sqlite:get-tasks', async () => {
      try {
        if (!sqliteService) throw new Error('Database not initialized');
        const tasks = await sqliteService.getTasks();
        return { success: true, data: tasks, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get tasks';
        return { success: false, data: null, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:create-task', async (_, task) => {
      try {
        if (!sqliteService) throw new Error('Database not initialized');
        const newTask = await sqliteService.createTask(task);
        return { success: true, data: newTask, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
        return { success: false, data: null, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:create-task-with-id', async (_, task) => {
      try {
        if (!sqliteService) throw new Error('Database not initialized');
        const newTask = await sqliteService.createTaskWithId(task);
        return { success: true, data: newTask, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create task with ID';
        return { success: false, data: null, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:update-task', async (_, id, updates) => {
      try {
        if (!sqliteService) throw new Error('Database not initialized');
        const task = await sqliteService.updateTask(id, updates);
        return { success: true, data: task, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
        return { success: false, data: null, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:delete-task', async (_, id) => {
      try {
        if (!sqliteService) throw new Error('Database not initialized');
        const deleted = await sqliteService.deleteTask(id);
        return { success: true, data: deleted, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
        return { success: false, data: false, error: errorMessage };
      }
    });

    // Project operations
    ipcMain.handle('sqlite:get-projects', async () => {
      try {
        if (!sqliteService) throw new Error('Database not initialized');
        const projects = await sqliteService.getProjects();
        return { success: true, data: projects, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get projects';
        return { success: false, data: null, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:get-project', async (_, id) => {
      try {
        if (!sqliteService) throw new Error('Database not initialized');
        const project = await sqliteService.getProject(id);
        return { success: true, data: project, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get project';
        return { success: false, data: null, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:create-project', async (_, project) => {
      try {
        if (!sqliteService) throw new Error('Database not initialized');
        const newProject = await sqliteService.createProject(project);
        return { success: true, data: newProject, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
        return { success: false, data: null, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:create-project-with-id', async (_, project) => {
      try {
        if (!sqliteService) throw new Error('Database not initialized');
        console.log('📁 Main: Creating project with ID via IPC:', project.name, project.id);
        const newProject = await sqliteService.createProjectWithId(project);
        console.log('✅ Main: Project created successfully:', newProject.id);
        return { success: true, data: newProject, error: null };
      } catch (error) {
        console.error('❌ Main: Project creation failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create project with ID';
        return { success: false, data: null, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:create-journal-entry-with-id', async (_, entry) => {
      try {
        if (!sqliteService) throw new Error('Database not initialized');
        console.log('📝 Main: Creating journal entry with ID via IPC:', entry.title, entry.id);
        const newEntry = await sqliteService.createJournalEntryWithId(entry);
        console.log('✅ Main: Journal entry created successfully:', newEntry.id);
        return { success: true, data: newEntry, error: null };
      } catch (error) {
        console.error('❌ Main: Journal entry creation failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create journal entry with ID';
        return { success: false, data: null, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:update-project', async (_, id, updates) => {
      try {
        if (!sqliteService) throw new Error('Database not initialized');
        const project = await sqliteService.updateProject(id, updates);
        return { success: true, data: project, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
        return { success: false, data: null, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:delete-project', async (_, id) => {
      try {
        if (!sqliteService) throw new Error('Database not initialized');
        const deleted = await sqliteService.deleteProject(id);
        return { success: true, data: deleted, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
        return { success: false, data: false, error: errorMessage };
      }
    });

    // Journal operations
    ipcMain.handle('sqlite:get-journal-entries', async () => {
      try {
        if (!sqliteService) throw new Error('Database not initialized');
        const entries = await sqliteService.getJournalEntries();
        return { success: true, data: entries, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get journal entries';
        return { success: false, data: null, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:create-journal-entry', async (_, entry) => {
      try {
        if (!sqliteService) throw new Error('Database not initialized');
        const newEntry = await sqliteService.createJournalEntry(entry);
        return { success: true, data: newEntry, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create journal entry';
        return { success: false, data: null, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:update-journal-entry', async (_, id, updates) => {
      try {
        if (!sqliteService) throw new Error('Database not initialized');
        const entry = await sqliteService.updateJournalEntry(id, updates);
        return { success: true, data: entry, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update journal entry';
        return { success: false, data: null, error: errorMessage };
      }
    });

    ipcMain.handle('sqlite:delete-journal-entry', async (_, id) => {
      try {
        if (!sqliteService) throw new Error('Database not initialized');
        const deleted = await sqliteService.deleteJournalEntry(id);
        return { success: true, data: deleted, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete journal entry';
        return { success: false, data: false, error: errorMessage };
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

    // Handle raw SQL query execution for encrypted integrations
    ipcMain.handle('sqlite:query', async (_, query: string, params?: any[]) => {
      try {
        if (!sqliteService) {
          const { sqliteService: service } = await import('@serenity/database');
          sqliteService = service;
          await sqliteService.initialize();
        }
        
        // Execute raw SQL query
        const result = await sqliteService.executeRawQuery(query, params);
        return { success: true, data: result, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Query execution failed';
        return { success: false, data: null, error: errorMessage };
      }
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