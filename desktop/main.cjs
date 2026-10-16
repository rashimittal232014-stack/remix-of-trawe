const { app, BrowserWindow, Tray, Menu, shell, Notification, nativeImage } = require('electron');
const path = require('path');

const APP_URL = 'https://app.trawe.in';
const START_URL = 'https://app.trawe.in/auth';
const ICON_PATH = path.join(__dirname, 'build', 'icon.png');

let mainWindow = null;
let tray = null;
let isQuitting = false;

// Enforce single instance so clicking the shortcut focuses the existing window
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: 'TraWe',
    icon: ICON_PATH,
    autoHideMenuBar: true,
    backgroundColor: '#0B1F3A',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(START_URL);

  // Open external links (mailto:, whatsapp, etc.) in the user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url);
      const target = new URL(APP_URL);
      if (u.origin === target.origin) return { action: 'allow' };
    } catch {}
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const u = new URL(url);
      const target = new URL(APP_URL);
      if (u.origin !== target.origin) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch {}
  });

  // Minimize to tray instead of quitting
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (Notification.isSupported() && process.platform === 'win32') {
        new Notification({
          title: 'TraWe is still running',
          body: 'The app is minimized to your system tray. Right-click the icon to quit.',
          icon: ICON_PATH,
        }).show();
      }
    }
  });
}

function createTray() {
  const image = nativeImage.createFromPath(ICON_PATH);
  tray = new Tray(image.isEmpty() ? nativeImage.createEmpty() : image.resize({ width: 16, height: 16 }));
  tray.setToolTip('TraWe');
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open TraWe', click: () => { mainWindow && mainWindow.show(); mainWindow && mainWindow.focus(); } },
    { label: 'Reload', click: () => { mainWindow && mainWindow.reload(); } },
    { type: 'separator' },
    {
      label: 'Launch on Windows startup',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({ openAtLogin: item.checked, path: process.execPath });
      },
    },
    { type: 'separator' },
    { label: 'Quit TraWe', click: () => { isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) mainWindow.hide();
    else { mainWindow.show(); mainWindow.focus(); }
  });
}

app.setAppUserModelId('in.trawe.desktop');

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('before-quit', () => { isQuitting = true; });

app.on('window-all-closed', () => {
  // Keep app alive in tray on Windows
  if (process.platform !== 'win32') app.quit();
});