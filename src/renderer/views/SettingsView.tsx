import React from "react";
import { useTranslation } from "react-i18next";

function SettingsView() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = React.useState(i18n.language);
  const [storagePath, setStoragePath] = React.useState("");

  React.useEffect(() => {
    // Load current storage path
    window.electronAPI.app.getPath("downloads").then(setStoragePath);
  }, []);

  const handleLanguageChange = (newLang: string) => {
    i18n.changeLanguage(newLang);
    setLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  const handleSave = () => {
    // TODO: Persist settings via backend API
    console.log("Settings saved");
  };

  return (
    <div className="view settings-view">
      <h2>{t("settings.title")}</h2>
      
      <form className="settings-form">
        <div className="form-group">
          <label htmlFor="language-select">{t("settings.language")}</label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            aria-label={t("settings.language")}
          >
            <option value="en">English</option>
            <option value="sw">Kiswahili</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="storage-path">{t("settings.storage")}</label>
          <input
            id="storage-path"
            type="text"
            value={storagePath}
            onChange={(e) => setStoragePath(e.target.value)}
            aria-label={t("settings.storage")}
          />
        </div>

        <div className="form-group">
          <label htmlFor="bandwidth-limit">{t("settings.bandwidth")}</label>
          <input
            id="bandwidth-limit"
            type="number"
            placeholder="MB/s (0 = unlimited)"
            aria-label={t("settings.bandwidth")}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleSave} className="btn-primary">
            {t("common.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SettingsView;
