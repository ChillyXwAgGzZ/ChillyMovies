import debug from "debug";
import fs from "fs";
import path from "path";

export const log = debug("chilly:core");

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
}

export class StructuredLogger {
  private logDir: string;
  private logFilePath: string;
  private writeStream: fs.WriteStream | null = null;

  constructor(logDir?: string) {
    this.logDir = logDir ?? path.resolve(process.cwd(), "logs");
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    this.logFilePath = path.join(this.logDir, `chilly-${this.getDateString()}.log`);
    this.initializeStream();
  }

  private initializeStream() {
    this.writeStream = fs.createWriteStream(this.logFilePath, { flags: "a" });
  }

  private getDateString(): string {
    const now = new Date();
    return now.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  private formatEntry(entry: LogEntry): string {
    return JSON.stringify(entry) + "\n";
  }

  private write(entry: LogEntry) {
    const formatted = this.formatEntry(entry);
    
    // Write to file
    if (this.writeStream) {
      this.writeStream.write(formatted);
    }
    
    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      const consoleMsg = `[${entry.level}] ${entry.message}`;
      if (entry.level === LogLevel.ERROR) {
        console.error(consoleMsg, entry.context || "", entry.error || "");
      } else {
        console.log(consoleMsg, entry.context || "");
      }
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.write({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context,
    });
  }

  info(message: string, context?: Record<string, any>) {
    this.write({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
    });
  }

  warn(message: string, context?: Record<string, any>) {
    this.write({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context,
    });
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.write({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
      error: error ? {
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  close() {
    if (this.writeStream) {
      this.writeStream.end();
      this.writeStream = null;
    }
  }

  /**
   * Rotate old log files (keep last N days)
   */
  rotateOldLogs(daysToKeep: number = 7) {
    const files = fs.readdirSync(this.logDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    files.forEach(file => {
      if (!file.startsWith("chilly-") || !file.endsWith(".log")) return;
      
      const filePath = path.join(this.logDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        this.info(`Rotated old log file: ${file}`);
      }
    });
  }
}

// Global logger instance
let globalLogger: StructuredLogger | null = null;

export function getLogger(): StructuredLogger {
  if (!globalLogger) {
    globalLogger = new StructuredLogger();
  }
  return globalLogger;
}

// Legacy exports for backward compatibility
export function info(msg: string, ...args: any[]) {
  log(`INFO: ${msg}`, ...args);
  getLogger().info(msg, args.length > 0 ? { data: args } : undefined);
}

export function error(msg: string, ...args: any[]) {
  log(`ERROR: ${msg}`, ...args);
  const err = args.find(a => a instanceof Error);
  getLogger().error(msg, err, args.length > 0 ? { data: args } : undefined);
}
