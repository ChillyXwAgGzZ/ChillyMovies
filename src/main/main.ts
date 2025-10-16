import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { config } from "dotenv";
import { createServer } from "../api-server";
import { StorageManager } from "../storage";
import type { DownloadJob } from "../downloader";

// Load environment variables
config();

// Backend API server instance
let apiServer: any = null;
let mainWindow: BrowserWindow | null = null;

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    title: "Chilly Movies",
    show: false, // Show after ready-to-show event
  });

  // Load the app UI
  if (process.env.NODE_ENV === "development") {
    // In development, load from Vite dev server (when implemented)
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  // Show window when ready to prevent flickering
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/**
 * Initialize backend API server (or connect to existing one in development)
 */
async function startBackendServer(): Promise<number> {
  // In development, the backend is already running via npm script on port 3000
  if (process.env.NODE_ENV === "development") {
    const devPort = 3000;
    console.log(`Using existing development backend on port ${devPort}`);
    return devPort;
  }

  // In production, start the backend server embedded in Electron
  return new Promise((resolve, reject) => {
    try {
      const server = createServer();
      const listener = server.listen(0, () => {
        // Use port 0 to get random available port
        const address = listener.address();
        const port = typeof address === "object" && address?.port ? address.port : 3000;
        console.log(`Backend API server running on port ${port}`);
        apiServer = listener;
        resolve(port);
      });

      listener.on("error", (err) => {
        console.error("Failed to start backend server:", err);
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Set up IPC handlers for renderer communication
 */
function setupIpcHandlers(backendPort: number) {
  // Provide backend port to renderer
  ipcMain.handle("get-backend-port", () => {
    return backendPort;
  });

  // Download management handlers (proxy to backend API)
  ipcMain.handle("download:start", async (_event, job: DownloadJob) => {
    try {
      const response = await fetch(`http://localhost:${backendPort}/download/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });
      return await response.json();
    } catch (err) {
      console.error("Download start failed:", err);
      throw err;
    }
  });

  ipcMain.handle("download:pause", async (_event, id: string) => {
    try {
      const response = await fetch(`http://localhost:${backendPort}/download/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      return await response.json();
    } catch (err) {
      console.error("Download pause failed:", err);
      throw err;
    }
  });

  ipcMain.handle("download:resume", async (_event, id: string) => {
    try {
      const response = await fetch(`http://localhost:${backendPort}/download/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      return await response.json();
    } catch (err) {
      console.error("Download resume failed:", err);
      throw err;
    }
  });

  ipcMain.handle("download:cancel", async (_event, id: string) => {
    try {
      const response = await fetch(`http://localhost:${backendPort}/download/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      return await response.json();
    } catch (err) {
      console.error("Download cancel failed:", err);
      throw err;
    }
  });

  ipcMain.handle("download:status", async (_event, id: string) => {
    try {
      const response = await fetch(`http://localhost:${backendPort}/download/status/${id}`);
      return await response.json();
    } catch (err) {
      console.error("Download status failed:", err);
      throw err;
    }
  });

  // Storage/library management
  ipcMain.handle("library:get-items", async () => {
    try {
      const storage = new StorageManager();
      return storage.getAllItems();
    } catch (err) {
      console.error("Library get items failed:", err);
      throw err;
    }
  });

  ipcMain.handle("library:get-item", async (_event, id: string) => {
    try {
      const storage = new StorageManager();
      return storage.getItem(id);
    } catch (err) {
      console.error("Library get item failed:", err);
      throw err;
    }
  });

  // App info
  ipcMain.handle("app:get-version", () => {
    return app.getVersion();
  });

  ipcMain.handle("app:get-path", (_event, name: string) => {
    return app.getPath(name as any);
  });
}

/**
 * App lifecycle management
 */
app.whenReady().then(async () => {
  try {
    // Start backend server first
    const backendPort = await startBackendServer();

    // Set up IPC handlers
    setupIpcHandlers(backendPort);

    // Create main window
    createWindow();

    app.on("activate", () => {
      // On macOS, recreate window when dock icon is clicked
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (err) {
    console.error("Failed to initialize app:", err);
    app.quit();
  }
});

// Quit when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Clean up on quit (only close server if we started it - not in dev mode)
app.on("before-quit", () => {
  if (apiServer && process.env.NODE_ENV !== "development") {
    apiServer.close();
  }
});
