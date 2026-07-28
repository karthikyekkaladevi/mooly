import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';

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

app.whenReady().then(() => {
  createWindow('overlay', {
    width: 360,
    height: 160,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true
  });

  createWindow('settings', {
    width: 480,
    height: 520,
    title: 'Mooly Settings'
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
