import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Tv, Loader2 } from "lucide-react";
import type { MediaMetadata } from "../services/api";

interface SearchSuggestionsProps {
  results: MediaMetadata[];
  isLoading: boolean;
  error: string | null;
  query: string;
  onSelect: () => void;
  onClose: () => void;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  results,
  isLoading,
  error,
  query,
  onSelect,
  onClose,
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleItemClick = (item: MediaMetadata) => {
    const route = item.mediaType === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`;
    navigate(route);
    onSelect();
  };

  if (!query.trim()) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-[500px] overflow-y-auto z-50 animate-fade-in"
    >
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Searching...</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="px-4 py-8 text-center">
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      )}

      {!isLoading && !error && results.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No results found for "{query}"
          </p>
        </div>
      )}

      {!isLoading && !error && results.length > 0 && (
        <div className="py-2">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </div>
          {results.slice(0, 8).map((item) => (
            <button
              key={`${item.mediaType}-${item.id}`}
              onClick={() => handleItemClick(item)}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-left"
            >
              {/* Poster Thumbnail */}
              <div className="flex-shrink-0 w-12 h-16 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                {item.poster ? (
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {item.mediaType === "tv" ? (
                      <Tv className="w-6 h-6 text-gray-400" />
                    ) : (
                      <Film className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {item.title}
                  </h4>
                  {item.mediaType && (
                    <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">
                      {item.mediaType === "tv" ? "TV" : "Movie"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  {item.year && <span>{item.year}</span>}
                  {item.voteAverage && item.voteAverage > 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        ⭐ {item.voteAverage.toFixed(1)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </button>
          ))}

          {results.length > 8 && (
            <div className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
              Showing 8 of {results.length} results. Press Enter to see all.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
