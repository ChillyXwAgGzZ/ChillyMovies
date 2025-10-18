import React, { useState, useCallback } from "react";

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  initialValue?: string;
  className?: string;
}

/**
 * Cinematic SearchBar Component with Neon Focus States
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search movies...",
  isLoading = false,
  initialValue = "",
  className = "",
}) => {
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
      }
    },
    [query, onSearch]
  );

  return (
    <form
      className={`relative ${className}`}
      onSubmit={handleSubmit}
      role="search"
    >
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-28 py-3 bg-cinema-dark border border-white border-opacity-10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:shadow-neon transition-all duration-300"
          disabled={isLoading}
          aria-label="Search"
        />

        {/* Search Button */}
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-1.5 bg-gradient-to-r from-neon-cyan to-neon-blue text-white text-sm font-semibold rounded-full hover:shadow-neon transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Submit search"
        >
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            "Search"
          )}
        </button>
      </div>
    </form>
  );
};
