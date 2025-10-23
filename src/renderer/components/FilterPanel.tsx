import { useState, useEffect } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp, X } from "lucide-react";

export interface FilterState {
  genres: number[]; // Changed from string[] to number[] for TMDB genre IDs
  yearRange: [number, number];
  minRating: number;
  sortBy: "popularity" | "rating" | "release_date" | "title";
}

interface FilterPanelProps {
  mediaType: "movie" | "tv";
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const MOVIE_GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

const TV_GENRES = [
  { id: 10759, name: "Action & Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 10762, name: "Kids" },
  { id: 9648, name: "Mystery" },
  { id: 10763, name: "News" },
  { id: 10764, name: "Reality" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10766, name: "Soap" },
  { id: 10767, name: "Talk" },
  { id: 10768, name: "War & Politics" },
  { id: 37, name: "Western" },
];

const SORT_OPTIONS = [
  { value: "popularity", label: "Popularity" },
  { value: "rating", label: "Rating" },
  { value: "release_date", label: "Release Date" },
  { value: "title", label: "Title (A-Z)" },
];

const FilterPanel: React.FC<FilterPanelProps> = ({
  mediaType,
  filters,
  onFiltersChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const genres = mediaType === "movie" ? MOVIE_GENRES : TV_GENRES;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleGenreToggle = (genreId: number) => {
    const newGenres = localFilters.genres.includes(genreId)
      ? localFilters.genres.filter((g) => g !== genreId)
      : [...localFilters.genres, genreId];
    
    const newFilters = { ...localFilters, genres: newGenres };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleYearChange = (type: "min" | "max", value: number) => {
    const newRange: [number, number] = type === "min"
      ? [value, localFilters.yearRange[1]]
      : [localFilters.yearRange[0], value];
    
    const newFilters = { ...localFilters, yearRange: newRange };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRatingChange = (value: number) => {
    const newFilters = { ...localFilters, minRating: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSortChange = (value: string) => {
    const newFilters = { ...localFilters, sortBy: value as FilterState["sortBy"] };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      genres: [],
      yearRange: [1900, currentYear],
      minRating: 0,
      sortBy: "popularity",
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const hasActiveFilters = 
    localFilters.genres.length > 0 ||
    localFilters.yearRange[0] !== 1900 ||
    localFilters.yearRange[1] !== currentYear ||
    localFilters.minRating > 0 ||
    localFilters.sortBy !== "popularity";

  const activeFiltersCount = 
    localFilters.genres.length + 
    (localFilters.yearRange[0] !== 1900 || localFilters.yearRange[1] !== currentYear ? 1 : 0) + 
    (localFilters.minRating > 0 ? 1 : 0) + 
    (localFilters.sortBy !== "popularity" ? 1 : 0);

  return (
    <div className="mb-6">
      {/* Collapsed Filter Bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold text-gray-900 dark:text-white">Filters & Sort</span>
          {activeFiltersCount > 0 && (
            <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-xs font-medium rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="px-3 py-1 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition"
            >
              Clear All
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </button>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="mt-4 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-white">Sort By</label>
              <select
                value={localFilters.sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Range */}
            <div>
              <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-white">
                Year: {localFilters.yearRange[0]} - {localFilters.yearRange[1]}
              </label>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">From</label>
                  <input
                    type="range"
                    min="1900"
                    max={currentYear}
                    value={localFilters.yearRange[0]}
                    onChange={(e) => handleYearChange("min", parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">To</label>
                  <input
                    type="range"
                    min="1900"
                    max={currentYear}
                    value={localFilters.yearRange[1]}
                    onChange={(e) => handleYearChange("max", parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* Minimum Rating */}
            <div>
              <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-white">
                Min Rating: {localFilters.minRating.toFixed(1)} ⭐
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={localFilters.minRating}
                onChange={(e) => handleRatingChange(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            {/* Genres - Takes full width on smaller screens */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-white">
                Genres {localFilters.genres.length > 0 && `(${localFilters.genres.length})`}
              </label>
              <div className="max-h-48 overflow-y-auto pr-2 space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
                {genres.map((genre) => (
                  <label
                    key={genre.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-white dark:hover:bg-gray-700 p-2 rounded-lg transition"
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.genres.includes(genre.id)}
                      onChange={() => handleGenreToggle(genre.id)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">{genre.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filters Pills */}
          {hasActiveFilters && localFilters.genres.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Selected Genres:</div>
              <div className="flex flex-wrap gap-2">
                {localFilters.genres.map((genreId) => {
                  const genre = genres.find((g) => g.id === genreId);
                  return (
                    <span
                      key={genreId}
                      className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs flex items-center gap-1.5"
                    >
                      {genre?.name}
                      <button 
                        onClick={() => handleGenreToggle(genreId)} 
                        className="hover:text-red-500 transition"
                        aria-label={`Remove ${genre?.name} filter`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
