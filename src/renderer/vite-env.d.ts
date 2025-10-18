/// <reference types="vite/client" />

// Electron API types (optional when running in browser)
declare global {
  interface Window {
    electronAPI?: {
      getBackendPort: () => Promise<number>;
      download: {
        start: (job: any) => Promise<any>;
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
    };
  }
}

export {};
