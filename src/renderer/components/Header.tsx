// src/renderer/components/Header.tsx
import React, { useState, useCallback, useEffect } from "react";
import { Search, Sun, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import SearchSuggestions from "./SearchSuggestions";
import { metadataApi, debounce, type MediaMetadata } from "../services/api";

interface HeaderProps {
  searchQuery: string;
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, onSearch }) => {
  const { t } = useTranslation();
  const { actualTheme, setTheme } = useTheme();
  const [query, setQuery] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MediaMetadata[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  // Debounced search for live suggestions
  const performLiveSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        setIsSearching(false);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      setShowSuggestions(true);

      try {
        const results = await metadataApi.search(searchQuery);
        setSuggestions(results);
      } catch (error) {
        console.error("Live search error:", error);
        setSearchError(error instanceof Error ? error.message : "Search failed");
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    performLiveSearch(value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Only navigate on Enter key
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = () => {
    setShowSuggestions(false);
    setQuery("");
  };

  const handleCloseSuggestions = () => {
    setShowSuggestions(false);
  };

  const toggleTheme = () => {
    // Toggle between light and dark (ignore system for now)
    setTheme(actualTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/70 dark:bg-gray-900/70 backdrop-blur flex items-center justify-between px-8 border-b border-gray-200 dark:border-gray-800 transition-colors">
      <form onSubmit={handleSubmit} className="relative flex items-center bg-gray-100 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-full px-4 py-2 w-full max-w-xl shadow-lg">
        <Search className="text-gray-500 dark:text-gray-400 mr-3 h-5 w-5" aria-hidden="true" />
        <input
          type="text"
          className="bg-transparent w-full focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          placeholder={t("header.searchPlaceholder")}
          value={query}
          onChange={handleSearchInput}
          aria-label={t("header.searchPlaceholder")}
        />
        
        {/* Live Search Suggestions */}
        {showSuggestions && (
          <SearchSuggestions
            results={suggestions}
            isLoading={isSearching}
            error={searchError}
            query={query}
            onSelect={handleSuggestionSelect}
            onClose={handleCloseSuggestions}
          />
        )}
      </form>
      <div className="ml-6 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          aria-label={t("header.themeToggle")}
          title={t("header.themeToggle")}
        >
          {actualTheme === "dark" ? (
            <Sun className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          ) : (
            <Moon className="h-5 w-5 text-gray-600" aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
