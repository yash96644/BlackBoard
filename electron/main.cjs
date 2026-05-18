const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

// Register custom protocol for OAuth deep linking
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('blackboard',
      process.execPath,
      [path.resolve(process.argv[1])]
    );
  }
} else {
  app.setAsDefaultProtocolClient('blackboard');
}

// Store reference to main window
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:     1440,
    height:    900,
    minWidth:  900,
    minHeight: 600,
    show:      false,
    backgroundColor: '#111827',

    // macOS: native traffic lights top-left
    titleBarStyle: process.platform === 'darwin'
      ? 'hiddenInset'
      : 'default',
    trafficLightPosition: { x: 16, y: 16 },

    // Windows: hide default menu bar
    autoHideMenuBar: true,
    frame: true,

    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  // Dev: load Vite dev server
  // Prod: load built React files
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexHtml = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexHtml).catch((err) => {
      console.error('[Blackboard] Failed to load index.html:', indexHtml, err);
    });
  }

  mainWindow.webContents.on('did-fail-load', (_event, code, desc, url) => {
    console.error('[Blackboard] did-fail-load:', code, desc, url);
  });

  // No white flash — show only when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open all external links in system browser
  // NOT inside Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle OAuth redirect back to app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Allow localhost and Supabase callback URLs
    const allowedHosts = ['localhost', '127.0.0.1'];
    try {
      const urlObj = new URL(url);
      if (!allowedHosts.includes(urlObj.hostname)) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch (e) {}
  });

  // Remove default menu on Windows/Linux
  if (process.platform !== 'darwin') {
    Menu.setApplicationMenu(null);
  }

  // macOS: minimal app menu (just quit and about)
  if (process.platform === 'darwin') {
    const template = [
      {
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'quit' },
        ],
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
          { role: 'selectAll' },
        ],
      },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  }
}

ipcMain.handle('open-external', (_event, url) => {
  if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
    return shell.openExternal(url);
  }
});

// App ready
app.whenReady().then(createWindow);

// macOS: re-create window if dock icon clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Windows/Linux: quit when all windows closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// DEEP LINK HANDLER — macOS
// Fires when blackboard:// URL is opened on Mac
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// DEEP LINK HANDLER — Windows
// Fires when blackboard:// URL is opened on Windows
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    // Someone opened a second instance with a deep link
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    // Extract URL from command line args on Windows
    const url = commandLine.find(arg => arg.startsWith('blackboard://'));
    if (url) handleDeepLink(url);
  });
}

// Handle the deep link URL — send to React
function handleDeepLink(url) {
  if (mainWindow) {
    mainWindow.focus();
    // Send the full URL to React so Supabase can extract the token
    mainWindow.webContents.send('deep-link', url);
  }
}
