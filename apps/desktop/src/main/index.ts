import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { join } from 'node:path';
import { openDatabase, initSchema, createSession, endSession } from '@mooly/storage';
import { getAppSettings, setAppSettings } from './settingsStore';
import { startPipeline } from './pipeline';
import type Database from 'better-sqlite3';
import type { AppSettings } from '@mooly/shared-types';

export let overlayWindow: BrowserWindow | null = null;
export let settingsWindow: BrowserWindow | null = null;

let db: Database.Database;
try {
  db = openDatabase(join(app.getPath('userData'), 'mooly.db'));
  initSchema(db);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  dialog.showErrorBox('Mooly failed to start', message);
  app.quit();
  // `app.quit()` is asynchronous; make sure nothing below this module scope runs.
  throw error;
}

function createWindow(entry: 'overlay' | 'settings', options: Electron.BrowserWindowConstructorOptions) {
  const win = new BrowserWindow({
    ...options,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/${entry}/index.html`);
  } else {
    win.loadFile(join(__dirname, `../renderer/${entry}/index.html`));
  }

  return win;
}

function applySettingsToOverlay(settings: AppSettings) {
  if (!overlayWindow) return;
  overlayWindow.setOpacity(settings.overlayOpacity);
  overlayWindow.setPosition(Math.round(settings.overlayX), Math.round(settings.overlayY));
}

app.whenReady().then(() => {
  const settings = getAppSettings(db);

  overlayWindow = createWindow('overlay', {
    width: 360,
    height: 160,
    x: Math.round(settings.overlayX),
    y: Math.round(settings.overlayY),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true
  });
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.setOpacity(settings.overlayOpacity);

  settingsWindow = createWindow('settings', {
    width: 480,
    height: 520,
    title: 'Mooly Settings'
  });

  const sessionId = createSession(db, Date.now());
  const stopPipeline = startPipeline(db, sessionId, overlayWindow);

  app.on('before-quit', () => {
    stopPipeline();
    endSession(db, sessionId, Date.now());
  });

  ipcMain.on('overlay:hover', (_event, hovering: boolean) => {
    overlayWindow?.setIgnoreMouseEvents(!hovering, { forward: true });
  });

  ipcMain.handle('settings:get', () => getAppSettings(db));

  ipcMain.handle('settings:set', (_event, partial: Partial<AppSettings>) => {
    const merged = setAppSettings(db, partial);
    applySettingsToOverlay(merged);
    return merged;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
