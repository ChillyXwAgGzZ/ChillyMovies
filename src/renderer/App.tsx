import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./App.css";

// View components (to be implemented)
import DiscoveryView from "./views/DiscoveryView";
import LibraryView from "./views/LibraryView";
import DownloadsView from "./views/DownloadsView";
import SettingsView from "./views/SettingsView";

function App() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "sw" : "en";
    i18n.changeLanguage(newLang);
    // Persist language preference
    localStorage.setItem("language", newLang);
  };

  React.useEffect(() => {
    // Restore language preference on mount
    const savedLang = localStorage.getItem("language");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  return (
    <BrowserRouter>
      <div className="app">
        {/* Navigation Bar */}
        <nav className="app-nav" role="navigation" aria-label="Main navigation">
          <div className="nav-brand">
            <h1>Chilly Movies</h1>
          </div>
          <div className="nav-links">
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              aria-label={t("nav.discovery")}
            >
              {t("nav.discovery")}
            </NavLink>
            <NavLink
              to="/library"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              aria-label={t("nav.library")}
            >
              {t("nav.library")}
            </NavLink>
            <NavLink
              to="/downloads"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              aria-label={t("nav.downloads")}
            >
              {t("nav.downloads")}
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              aria-label={t("nav.settings")}
            >
              {t("nav.settings")}
            </NavLink>
          </div>
          <div className="nav-actions">
            <button
              onClick={toggleLanguage}
              className="lang-toggle"
              aria-label="Toggle language"
            >
              {i18n.language === "en" ? "SW" : "EN"}
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="app-content" role="main">
          <Routes>
            <Route path="/" element={<DiscoveryView />} />
            <Route path="/library" element={<LibraryView />} />
            <Route path="/downloads" element={<DownloadsView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
