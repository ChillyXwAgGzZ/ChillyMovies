import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

// View components
import DiscoveryView from "./views/DiscoveryView";
import LibraryView from "./views/LibraryView";
import DownloadsView from "./views/DownloadsView";
import SettingsView from "./views/SettingsView";

function App() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "sw" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  React.useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-cinema-black overflow-hidden">
        {/* Sidebar Navigation */}
        <nav 
          className="w-64 bg-cinema-dark border-r border-white border-opacity-5 flex flex-col"
          role="navigation" 
          aria-label="Main navigation"
        >
          {/* Brand */}
          <div className="p-6 border-b border-white border-opacity-5">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-cyan to-neon-blue bg-clip-text text-transparent">
              Chilly Movies
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 py-4 space-y-1 px-3">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-neon-cyan to-neon-blue text-white shadow-neon"
                    : "text-gray-400 hover:text-white hover:bg-cinema-gray"
                }`
              }
              aria-label={t("nav.discovery")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="font-medium">{t("nav.discovery")}</span>
            </NavLink>

            <NavLink
              to="/library"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-neon-cyan to-neon-blue text-white shadow-neon"
                    : "text-gray-400 hover:text-white hover:bg-cinema-gray"
                }`
              }
              aria-label={t("nav.library")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="font-medium">{t("nav.library")}</span>
            </NavLink>

            <NavLink
              to="/downloads"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-neon-cyan to-neon-blue text-white shadow-neon"
                    : "text-gray-400 hover:text-white hover:bg-cinema-gray"
                }`
              }
              aria-label={t("nav.downloads")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V6" />
              </svg>
              <span className="font-medium">{t("nav.downloads")}</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-neon-cyan to-neon-blue text-white shadow-neon"
                    : "text-gray-400 hover:text-white hover:bg-cinema-gray"
                }`
              }
              aria-label={t("nav.settings")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">{t("nav.settings")}</span>
            </NavLink>
          </div>

          {/* Footer - Language Toggle */}
          <div className="p-4 border-t border-white border-opacity-5">
            <button
              onClick={toggleLanguage}
              className="w-full px-4 py-2 bg-cinema-gray hover:bg-cinema-light text-gray-300 hover:text-white rounded-lg transition-all duration-300 font-medium"
              aria-label="Toggle language"
            >
              {i18n.language === "en" ? "🌍 Switch to Swahili" : "🌍 Switch to English"}
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar" role="main">
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
