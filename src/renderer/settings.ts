export interface UserSettings {
  language: "en" | "sw";
  storagePath: string;
  bandwidthLimit: {
    download: number; // MB/s, 0 = unlimited
    upload: number; // MB/s, 0 = unlimited
  };
  telemetryOptIn: boolean;
  autoSyncEnabled: boolean;
  theme: "light" | "dark" | "system";
}

export const defaultSettings: UserSettings = {
  language: "en",
  storagePath: "",
  bandwidthLimit: {
    download: 0,
    upload: 0,
  },
  telemetryOptIn: false,
  autoSyncEnabled: false,
  theme: "system",
};

/**
 * Load user settings from localStorage with fallback to defaults
 */
export function loadSettings(): UserSettings {
  try {
    const stored = localStorage.getItem("userSettings");
    if (!stored) return { ...defaultSettings };
    
    const parsed = JSON.parse(stored);
    return { ...defaultSettings, ...parsed };
  } catch (err) {
    console.error("Failed to load settings:", err);
    return { ...defaultSettings };
  }
}

/**
 * Save user settings to localStorage
 */
export function saveSettings(settings: Partial<UserSettings>): UserSettings {
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem("userSettings", JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Failed to save settings:", err);
    return loadSettings();
  }
}

/**
 * Reset settings to defaults
 */
export function resetSettings(): UserSettings {
  try {
    localStorage.removeItem("userSettings");
    return { ...defaultSettings };
  } catch (err) {
    console.error("Failed to reset settings:", err);
    return defaultSettings;
  }
}
