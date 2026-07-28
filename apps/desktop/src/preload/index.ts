import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings } from '@mooly/shared-types';

export interface SuggestionChunkPayload {
  text: string;
  done: boolean;
}

contextBridge.exposeInMainWorld('mooly', {
  reportOverlayHover: (hovering: boolean) => ipcRenderer.send('overlay:hover', hovering),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  setSettings: (partial: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:set', partial),
  onSuggestionChunk: (callback: (payload: SuggestionChunkPayload) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: SuggestionChunkPayload) =>
      callback(payload);
    ipcRenderer.on('suggestion:chunk', listener);
    return () => ipcRenderer.removeListener('suggestion:chunk', listener);
  }
});
