import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import { openDatabase, initSchema } from '@mooly/storage';
import { getAppSettings, setAppSettings } from './settingsStore';
import type { AppSettings } from '@mooly/shared-types';

export let overlayWindow: BrowserWindow | null = null;
export let settingsWindow: BrowserWindow | null = null;

const db = openDatabase(join(app.getPath('userData'), 'mooly.db'));
initSchema(db);

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
