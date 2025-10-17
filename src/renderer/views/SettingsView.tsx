import React from "react";
import { useTranslation } from "react-i18next";
import { loadSettings, saveSettings, UserSettings } from "../settings";

function SettingsView() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = React.useState<UserSettings>(loadSettings());
  const [isSaved, setIsSaved] = React.useState(false);

  React.useEffect(() => {
    // Load settings on mount
    const loaded = loadSettings();
    setSettings(loaded);
    
    // If storage path is empty, get default from Electron
    if (!loaded.storagePath) {
      window.electronAPI.app.getPath("downloads").then((path: string) => {
        setSettings(prev => ({ ...prev, storagePath: path }));
      });
    }
  }, []);

  const handleLanguageChange = (newLang: "en" | "sw") => {
    i18n.changeLanguage(newLang);
    setSettings(prev => ({ ...prev, language: newLang }));
  };

  const handleStoragePathChange = (path: string) => {
    setSettings(prev => ({ ...prev, storagePath: path }));
  };

  const handleBandwidthChange = (type: "download" | "upload", value: number) => {
    setSettings(prev => ({
      ...prev,
      bandwidthLimit: {
        ...prev.bandwidthLimit,
        [type]: Math.max(0, value),
      },
    }));
  };

  const handleTelemetryChange = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, telemetryOptIn: enabled }));
  };

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const handleSave = () => {
    saveSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleBrowseStorage = async () => {
    // TODO: Implement directory picker via IPC
    console.log("Browse for storage location");
  };

  return (
    <div className="view settings-view">
      <h2>{t("settings.title")}</h2>
      
      <form className="settings-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        {/* Language Settings */}
        <section className="settings-section">
          <h3>{t("settings.sections.language")}</h3>
          <div className="form-group">
            <label htmlFor="language-select">
              {t("settings.language")}
            </label>
            <select
              id="language-select"
              value={settings.language}
              onChange={(e) => handleLanguageChange(e.target.value as "en" | "sw")}
              aria-label={t("settings.language")}
            >
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
            </select>
          </div>
        </section>

        {/* Storage Settings */}
        <section className="settings-section">
          <h3>{t("settings.sections.storage")}</h3>
          <div className="form-group">
            <label htmlFor="storage-path">
              {t("settings.storage")}
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                id="storage-path"
                type="text"
                value={settings.storagePath}
                onChange={(e) => handleStoragePathChange(e.target.value)}
                aria-label={t("settings.storage")}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleBrowseStorage}
                className="btn-secondary"
                aria-label="Browse for storage location"
              >
                {t("common.browse")}
              </button>
            </div>
            <small>{t("settings.storageDescription")}</small>
          </div>
        </section>

        {/* Bandwidth Settings */}
        <section className="settings-section">
          <h3>{t("settings.sections.bandwidth")}</h3>
          <div className="form-group">
            <label htmlFor="download-limit">
              {t("settings.downloadLimit")}
            </label>
            <input
              id="download-limit"
              type="number"
              min="0"
              value={settings.bandwidthLimit.download}
              onChange={(e) => handleBandwidthChange("download", parseInt(e.target.value) || 0)}
              placeholder="MB/s (0 = unlimited)"
              aria-label={t("settings.downloadLimit")}
            />
            <small>{t("settings.bandwidthDescription")}</small>
          </div>

          <div className="form-group">
            <label htmlFor="upload-limit">
              {t("settings.uploadLimit")}
            </label>
            <input
              id="upload-limit"
              type="number"
              min="0"
              value={settings.bandwidthLimit.upload}
              onChange={(e) => handleBandwidthChange("upload", parseInt(e.target.value) || 0)}
              placeholder="MB/s (0 = unlimited)"
              aria-label={t("settings.uploadLimit")}
            />
          </div>
        </section>

        {/* Appearance Settings */}
        <section className="settings-section">
          <h3>{t("settings.sections.appearance")}</h3>
          <div className="form-group">
            <label htmlFor="theme-select">
              {t("settings.theme")}
            </label>
            <select
              id="theme-select"
              value={settings.theme}
              onChange={(e) => handleThemeChange(e.target.value as "light" | "dark" | "system")}
              aria-label={t("settings.theme")}
            >
              <option value="light">{t("settings.themes.light")}</option>
              <option value="dark">{t("settings.themes.dark")}</option>
              <option value="system">{t("settings.themes.system")}</option>
            </select>
          </div>
        </section>

        {/* Privacy Settings */}
        <section className="settings-section">
          <h3>{t("settings.sections.privacy")}</h3>
          <div className="form-group">
            <label htmlFor="telemetry-opt-in" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                id="telemetry-opt-in"
                type="checkbox"
                checked={settings.telemetryOptIn}
                onChange={(e) => handleTelemetryChange(e.target.checked)}
                aria-label={t("settings.telemetry")}
              />
              {t("settings.telemetry")}
            </label>
            <small>{t("settings.telemetryDescription")}</small>
          </div>
        </section>

        {/* Save Actions */}
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {t("common.save")}
          </button>
          {isSaved && (
            <span className="save-indicator" style={{ color: "green", marginLeft: "1rem" }}>
              ✓ {t("settings.saved")}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

export default SettingsView;
