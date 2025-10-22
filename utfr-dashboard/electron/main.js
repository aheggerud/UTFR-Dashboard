// Minimal Electron main process to host the Next.js app and expose an IPC handler
// for launching MoTeC i2 Pro on Windows. Adjust the executable path to match your installation.

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const DEFAULT_URL = process.env.UTFR_APP_URL || 'http://localhost:3000';

function openInMotec(payload) {
  // payload: { localPath?: string, url?: string }
  if (process.platform !== 'win32') {
    return false;
  }

  // NOTE: Verify this path for your environment
  const motecExe = 'C\\\x3a\\Program Files\\MoTeC\\i2\\i2 Pro\\MoTeC.exe';

  const candidate = payload?.localPath || payload?.url || '';
  if (!candidate) return false;

  try {
    const child = spawn(motecExe, [candidate], { detached: true, stdio: 'ignore', windowsHide: true });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(DEFAULT_URL);
}

app.whenReady().then(() => {
  ipcMain.handle('utfr:open-in-motec', (_evt, payload) => openInMotec(payload));
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


