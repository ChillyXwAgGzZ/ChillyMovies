// src/renderer/components/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Globe, Home, Download, Library, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { saveSettings, loadSettings } from "../settings";
import { useSidebar } from "../context/SidebarContext";

type SupportedLanguage = "en" | "sw";

const Sidebar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [language, setLanguage] = React.useState<SupportedLanguage>(() => {
    const stored = loadSettings().language;
    if (stored === "en" || stored === "sw") {
      return stored;
    }
    return (i18n.language as SupportedLanguage) ?? "en";
  });

  React.useEffect(() => {
    if (language !== i18n.language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value as SupportedLanguage;
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    saveSettings({ language: newLanguage });
  };

  const handleKeyboardToggle = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleSidebar();
    }
  };

  const handleLanguageToggleKeyboard = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const nextLang = language === 'en' ? 'sw' : 'en';
      setLanguage(nextLang);
      i18n.changeLanguage(nextLang);
      saveSettings({ language: nextLang });
    }
  };

  const navItems = React.useMemo(
    () => [
      { to: "/", icon: Home, label: t("nav.home") },
      { to: "/downloads", icon: Download, label: t("nav.downloads") },
      { to: "/library", icon: Library, label: t("nav.library") },
      { to: "/settings", icon: Settings, label: t("nav.settings") },
    ],
    [t]
  );

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]"
        : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800/70 dark:hover:to-gray-800/50 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-[1.01]"
    }`;

  return (
    <aside 
      className={`${isCollapsed ? 'w-20' : 'w-72'} bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 p-5 flex flex-col transition-all duration-300 relative shadow-xl`}
      role="navigation"
      aria-label={t("sidebar.mainNavigation") || "Main navigation"}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        onKeyDown={handleKeyboardToggle}
        className="absolute -right-3 top-8 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-full p-2 shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:scale-110 z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!isCollapsed}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Logo and Title */}
      <div className={`flex items-center gap-3 mb-8 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white font-bold flex-shrink-0 shadow-lg shadow-indigo-500/30">
          <span className="text-lg">CM</span>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent"></div>
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              {t("app.title")}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 truncate">{t("sidebar.tagline")}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5" role="navigation" aria-label={t("sidebar.primaryNavigation") || "Primary navigation"}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink 
            key={to} 
            to={to} 
            className={navLinkClasses}
            title={isCollapsed ? label : undefined}
            aria-label={label}
            tabIndex={0}
          >
            <div className={`flex items-center justify-center ${isCollapsed ? 'w-full' : ''}`}>
              <Icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
            </div>
            {!isCollapsed && (
              <span className="flex-1 truncate font-medium">{label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Language Selector */}
      {!isCollapsed && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/40 dark:to-gray-800/20 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <label className="flex items-start gap-3" htmlFor="language-select">
              <div className="mt-0.5 p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  {t("sidebar.languageLabel")}
                </span>
                <select
                  id="language-select"
                  className="w-full bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                  onChange={handleLanguageChange}
                  value={language}
                  aria-label={t("sidebar.languageLabel")}
                >
                  <option value="en" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    🇬🇧 {t("languages.english")}
                  </option>
                  <option value="sw" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    🇹🇿 {t("languages.swahili")}
                  </option>
                </select>
              </div>
            </label>
          </div>
        </div>
      )}
      
      {/* Collapsed Language Toggle */}
      {isCollapsed && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => {
              const nextLang = language === 'en' ? 'sw' : 'en';
              setLanguage(nextLang);
              i18n.changeLanguage(nextLang);
              saveSettings({ language: nextLang });
            }}
            onKeyDown={handleLanguageToggleKeyboard}
            className="w-full p-3 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            title={t("sidebar.languageLabel")}
            aria-label={`${t("sidebar.languageLabel")}: ${language === 'en' ? t("languages.english") : t("languages.swahili")}`}
          >
            <Globe className="h-5 w-5 mx-auto transition-transform duration-200 hover:rotate-12" />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
