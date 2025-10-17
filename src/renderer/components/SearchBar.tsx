import React from "react";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  buttonText?: string;
  className?: string;
}

/**
 * Reusable SearchBar component
 * Prepared for design system integration
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Search...",
  isLoading = false,
  disabled = false,
  buttonText = "Search",
  className = "",
}) => {
  return (
    <form onSubmit={onSubmit} className={`search-form ${className}`} role="search">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
        aria-label={placeholder}
        disabled={disabled}
      />
      <button
        type="submit"
        className="search-button"
        disabled={isLoading || disabled}
      >
        {isLoading ? "Searching..." : buttonText}
      </button>
    </form>
  );
};
