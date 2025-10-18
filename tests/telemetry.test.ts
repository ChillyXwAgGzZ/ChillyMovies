import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TelemetryService } from "../src/telemetry";

describe("TelemetryService", () => {
  let telemetry: TelemetryService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (telemetry) {
      await telemetry.shutdown();
    }
  });

  it("should not track events when disabled", () => {
    telemetry = new TelemetryService({ enabled: false });
    
    telemetry.trackEvent("test.event", { foo: "bar" });
    
    // No events should be queued
    expect((telemetry as any).eventQueue.length).toBe(0);
  });

  it("should track events when enabled", () => {
    telemetry = new TelemetryService({ enabled: true });
    
    telemetry.trackEvent("test.event", { foo: "bar" });
    
    expect((telemetry as any).eventQueue.length).toBe(1);
    expect((telemetry as any).eventQueue[0].eventName).toBe("test.event");
    expect((telemetry as any).eventQueue[0].properties.foo).toBe("bar");
  });

  it("should sanitize PII from properties", () => {
    telemetry = new TelemetryService({ enabled: true });
    
    telemetry.trackEvent("user.action", {
      email: "user@example.com",
      username: "testuser",
      action: "download",
      count: 5,
    });
    
    const event = (telemetry as any).eventQueue[0];
    expect(event.properties.email).toBe("[REDACTED]");
    expect(event.properties.username).toBe("[REDACTED]");
    expect(event.properties.action).toBe("download");
    expect(event.properties.count).toBe(5);
  });

  it("should sanitize file paths", () => {
    telemetry = new TelemetryService({ enabled: true });
    
    telemetry.trackEvent("file.saved", {
      path: "/home/user/documents/file.txt",
      size: 1024,
    });
    
    const event = (telemetry as any).eventQueue[0];
    expect(event.properties.path).toBe("[PATH_REDACTED]");
    expect(event.properties.size).toBe(1024);
  });

  it("should auto-flush when batch size is reached", async () => {
    telemetry = new TelemetryService({ enabled: true, batchSize: 3 });
    
    const flushSpy = vi.spyOn(telemetry as any, "flush");
    
    telemetry.trackEvent("event.1");
    telemetry.trackEvent("event.2");
    expect(flushSpy).not.toHaveBeenCalled();
    
    telemetry.trackEvent("event.3");
    expect(flushSpy).toHaveBeenCalledOnce();
  });

  it("should include session metadata in events", () => {
    telemetry = new TelemetryService({ enabled: true });
    
    telemetry.trackEvent("test.event");
    
    const event = (telemetry as any).eventQueue[0];
    expect(event.sessionId).toBeDefined();
    expect(event.timestamp).toBeDefined();
    expect(event.platform).toBe(process.platform);
    expect(event.appVersion).toBeDefined();
  });

  it("should update config after initialization", () => {
    telemetry = new TelemetryService({ enabled: false });
    
    telemetry.trackEvent("event.1");
    expect((telemetry as any).eventQueue.length).toBe(0);
    
    telemetry.updateConfig({ enabled: true });
    telemetry.trackEvent("event.2");
    expect((telemetry as any).eventQueue.length).toBe(1);
  });

  it("should clear queue after flush", async () => {
    telemetry = new TelemetryService({ enabled: true });
    
    telemetry.trackEvent("event.1");
    telemetry.trackEvent("event.2");
    expect((telemetry as any).eventQueue.length).toBe(2);
    
    await telemetry.flush();
    expect((telemetry as any).eventQueue.length).toBe(0);
  });

  it("should handle flush errors gracefully", async () => {
    // Mock fetch to simulate error
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    
    telemetry = new TelemetryService({
      enabled: true,
      endpoint: "https://telemetry.example.com/events",
    });
    
    telemetry.trackEvent("event.1");
    const initialCount = (telemetry as any).eventQueue.length;
    
    await telemetry.flush();
    
    // Events should be re-queued on error
    expect((telemetry as any).eventQueue.length).toBeGreaterThan(0);
  });

  it("should not send events when no endpoint is configured", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;
    
    telemetry = new TelemetryService({ enabled: true });
    
    telemetry.trackEvent("event.1");
    await telemetry.flush();
    
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should respect privacy settings", () => {
    telemetry = new TelemetryService({ enabled: true });
    
    // Sensitive data should be redacted
    telemetry.trackEvent("user.login", {
      email: "user@example.com",
      password: "secret123",
      token: "abc123xyz",
      success: true,
    });
    
    const event = (telemetry as any).eventQueue[0];
    expect(event.properties.email).toBe("[REDACTED]");
    expect(event.properties.password).toBe("[REDACTED]");
    expect(event.properties.token).toBe("[REDACTED]");
    expect(event.properties.success).toBe(true);
  });
});
