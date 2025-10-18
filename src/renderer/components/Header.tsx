// src/renderer/components/Header.tsx
import React from "react";
import { Search, Sun, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { loadSettings, saveSettings, type UserSettings } from "../settings";

type ThemePreference = UserSettings["theme"];
type ResolvedTheme = "light" | "dark";

interface HeaderProps {
  searchQuery: string;
  onSearch: (query: string) => void;
}

const getStoredThemePreference = (): ThemePreference => {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    return loadSettings().theme;
  } catch (err) {
    console.warn("Failed to read stored theme preference", err);
    return "system";
  }
};

const resolveSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const resolveTheme = (preference: ThemePreference): ResolvedTheme =>
  preference === "system" ? resolveSystemTheme() : preference;

const applyThemeToDocument = (theme: ResolvedTheme) => {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.classList.toggle("dark", theme === "dark");
};

const Header: React.FC<HeaderProps> = ({ searchQuery, onSearch }) => {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState(searchQuery);
  const [themePreference, setThemePreference] = React.useState<ThemePreference>(getStoredThemePreference);
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(resolveSystemTheme);
  const resolvedTheme = themePreference === "system" ? systemTheme : themePreference;

  React.useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    applyThemeToDocument(resolvedTheme);
    if (typeof window !== "undefined") {
      saveSettings({ theme: themePreference });
    }
  }, [resolvedTheme, themePreference]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    setSystemTheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(query.trim());
  };

  const toggleTheme = () => {
    setThemePreference((prev) => (resolveTheme(prev) === "dark" ? "light" : "dark"));
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-gray-900/70 backdrop-blur flex items-center justify-between px-8 border-b border-gray-800">
      <form onSubmit={handleSubmit} className="flex items-center bg-gray-800/80 border border-gray-700 rounded-full px-4 py-2 w-full max-w-xl shadow-lg">
        <Search className="text-gray-400 mr-3 h-5 w-5" aria-hidden="true" />
        <input
          type="text"
          className="bg-transparent w-full focus:outline-none text-white placeholder-gray-500"
          placeholder={t("header.searchPlaceholder")}
          value={query}
          onChange={handleSearchInput}
          aria-label={t("header.searchPlaceholder")}
        />
      </form>
      <div className="ml-6 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label={t("header.themeToggle")}
          title={t("header.themeToggle")}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          ) : (
            <Moon className="h-5 w-5 text-gray-300" aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
