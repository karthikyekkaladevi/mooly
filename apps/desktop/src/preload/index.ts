import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('mooly', {});
