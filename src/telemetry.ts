import { StructuredLogger, getLogger } from "./logger";

export interface TelemetryEvent {
  eventName: string;
  timestamp: string;
  sessionId: string;
  appVersion: string;
  platform: string;
  properties?: Record<string, any>;
}

export interface TelemetryConfig {
  enabled: boolean;
  endpoint?: string;
  batchSize?: number;
  flushInterval?: number; // milliseconds
}

export class TelemetryService {
  private config: TelemetryConfig;
  private logger: StructuredLogger;
  private sessionId: string;
  private eventQueue: TelemetryEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: TelemetryConfig) {
    this.config = {
      batchSize: 10,
      flushInterval: 60000, // 1 minute
      ...config,
    };
    this.logger = getLogger();
    this.sessionId = this.generateSessionId();

    // Start flush timer if enabled
    if (this.config.enabled && this.config.flushInterval) {
      this.startFlushTimer();
    }

    this.logger.info("Telemetry service initialized", {
      enabled: this.config.enabled,
      sessionId: this.sessionId,
    });
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Track an event (only if telemetry is enabled)
   */
  trackEvent(eventName: string, properties?: Record<string, any>) {
    if (!this.config.enabled) {
      return; // Telemetry disabled, do nothing
    }

    const event: TelemetryEvent = {
      eventName,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      appVersion: process.env.npm_package_version || "unknown",
      platform: process.platform,
      properties: this.sanitizeProperties(properties),
    };

    this.eventQueue.push(event);
    this.logger.debug("Telemetry event tracked", { eventName, properties });

    // Auto-flush if batch size reached
    if (this.eventQueue.length >= (this.config.batchSize || 10)) {
      this.flush();
    }
  }

  /**
   * Sanitize properties to remove any PII (Personally Identifiable Information)
   */
  private sanitizeProperties(properties?: Record<string, any>): Record<string, any> | undefined {
    if (!properties) return undefined;

    const sanitized: Record<string, any> = {};
    const piiKeys = ["email", "name", "username", "password", "token", "key", "secret"];

    for (const [key, value] of Object.entries(properties)) {
      // Skip PII keys
      if (piiKeys.some(piiKey => key.toLowerCase().includes(piiKey))) {
        sanitized[key] = "[REDACTED]";
        continue;
      }

      // Skip file paths and URLs with user info
      if (typeof value === "string") {
        if (value.includes("/home/") || value.includes("/Users/") || value.includes("C:\\Users\\")) {
          sanitized[key] = "[PATH_REDACTED]";
          continue;
        }
      }

      sanitized[key] = value;
    }

    return sanitized;
  }

  /**
   * Flush queued events to the telemetry endpoint
   */
  async flush() {
    if (this.eventQueue.length === 0) return;
    if (!this.config.enabled) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    this.logger.info("Flushing telemetry events", {
      count: eventsToSend.length,
    });

    if (!this.config.endpoint) {
      // No endpoint configured, just log locally
      this.logger.debug("Telemetry events (no endpoint configured)", {
        events: eventsToSend,
      });
      return;
    }

    try {
      // Send events to telemetry endpoint
      const response = await fetch(this.config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events: eventsToSend }),
      });

      if (!response.ok) {
        throw new Error(`Telemetry upload failed: ${response.statusText}`);
      }

      this.logger.info("Telemetry events sent successfully", {
        count: eventsToSend.length,
      });
    } catch (error) {
      this.logger.error("Failed to send telemetry events", error as Error, {
        count: eventsToSend.length,
      });
      
      // Re-queue events on failure (up to a limit to avoid memory issues)
      if (this.eventQueue.length < 100) {
        this.eventQueue.unshift(...eventsToSend);
      }
    }
  }

  /**
   * Update telemetry configuration (e.g., when user changes settings)
   */
  updateConfig(config: Partial<TelemetryConfig>) {
    this.config = { ...this.config, ...config };

    if (this.config.enabled && this.config.flushInterval) {
      this.startFlushTimer();
    } else if (!this.config.enabled && this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    this.logger.info("Telemetry config updated", { config: this.config });
  }

  /**
   * Shutdown telemetry service and flush pending events
   */
  async shutdown() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    await this.flush();
    this.logger.info("Telemetry service shutdown");
  }
}

// Global telemetry instance
let globalTelemetry: TelemetryService | null = null;

export function initTelemetry(config: TelemetryConfig): TelemetryService {
  if (globalTelemetry) {
    globalTelemetry.updateConfig(config);
  } else {
    globalTelemetry = new TelemetryService(config);
  }
  return globalTelemetry;
}

export function getTelemetry(): TelemetryService | null {
  return globalTelemetry;
}

/**
 * Track an event using the global telemetry instance
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (globalTelemetry) {
    globalTelemetry.trackEvent(eventName, properties);
  }
}
