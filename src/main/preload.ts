import { contextBridge, ipcRenderer } from "electron";
import type { DownloadJob } from "../downloader";

/**
 * Expose protected methods that allow the renderer process to use
 * ipcRenderer without exposing the entire object
 */
contextBridge.exposeInMainWorld("electronAPI", {
  // Backend connection
  getBackendPort: () => ipcRenderer.invoke("get-backend-port"),

  // Download management
  download: {
    start: (job: DownloadJob) => ipcRenderer.invoke("download:start", job),
    pause: (id: string) => ipcRenderer.invoke("download:pause", id),
    resume: (id: string) => ipcRenderer.invoke("download:resume", id),
    cancel: (id: string) => ipcRenderer.invoke("download:cancel", id),
    getStatus: (id: string) => ipcRenderer.invoke("download:status", id),
  },

  // Library management
  library: {
    getItems: () => ipcRenderer.invoke("library:get-items"),
    getItem: (id: string) => ipcRenderer.invoke("library:get-item", id),
  },

  // App info
  app: {
    getVersion: () => ipcRenderer.invoke("app:get-version"),
    getPath: (name: string) => ipcRenderer.invoke("app:get-path", name),
  },
});

/**
 * TypeScript declaration for window.electronAPI
 * This will be imported by renderer code for type safety
 */
export interface ElectronAPI {
  getBackendPort: () => Promise<number>;
  download: {
    start: (job: DownloadJob) => Promise<any>;
    pause: (id: string) => Promise<any>;
    resume: (id: string) => Promise<any>;
    cancel: (id: string) => Promise<any>;
    getStatus: (id: string) => Promise<any>;
  };
  library: {
    getItems: () => Promise<any[]>;
    getItem: (id: string) => Promise<any>;
  };
  app: {
    getVersion: () => Promise<string>;
    getPath: (name: string) => Promise<string>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
