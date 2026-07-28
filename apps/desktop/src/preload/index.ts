import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings } from '@mooly/shared-types';

contextBridge.exposeInMainWorld('mooly', {
  reportOverlayHover: (hovering: boolean) => ipcRenderer.send('overlay:hover', hovering),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  setSettings: (partial: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:set', partial)
});
