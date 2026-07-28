import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('mooly', {
  reportOverlayHover: (hovering: boolean) => ipcRenderer.send('overlay:hover', hovering)
});
