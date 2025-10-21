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
    `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
      isActive
        ? "bg-indigo-600 text-white shadow-md"
        : "text-gray-400 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-700 hover:text-white"
    }`;

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-900/80 backdrop-blur-sm border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col transition-all duration-300 relative`}>
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-1.5 shadow-lg transition-all duration-200 z-10"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      <div className={`flex items-center gap-3 mb-10 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold flex-shrink-0">
          CM
        </div>
        {!isCollapsed && (
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-wide">
              {t("app.title")}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("sidebar.tagline")}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink 
            key={to} 
            to={to} 
            className={navLinkClasses}
            title={isCollapsed ? label : undefined}
          >
            <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0`} aria-hidden="true" />
            {!isCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="mt-10">
          <label className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700" htmlFor="language-select">
            <Globe className="mr-3 h-5 w-5 text-indigo-400" aria-hidden="true" />
            <div className="flex-1">
              <span className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("sidebar.languageLabel")}
              </span>
              <select
                id="language-select"
                className="mt-1 w-full bg-transparent text-gray-900 dark:text-white focus:outline-none"
                onChange={handleLanguageChange}
                value={language}
                aria-label={t("sidebar.languageLabel")}
              >
                <option value="en" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                  {t("languages.english")}
                </option>
                <option value="sw" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                  {t("languages.swahili")}
                </option>
              </select>
            </div>
          </label>
        </div>
      )}
      
      {isCollapsed && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => {
              const nextLang = language === 'en' ? 'sw' : 'en';
              setLanguage(nextLang);
              i18n.changeLanguage(nextLang);
              saveSettings({ language: nextLang });
            }}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title={t("sidebar.languageLabel")}
          >
            <Globe className="h-5 w-5" />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
