import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import FilterPanel, { type FilterState } from "../components/FilterPanel";
import { metadataApi, type MediaMetadata } from "../services/api";

const TV_PER_PAGE = 20;
const SCROLL_POSITION_KEY = "tvSeriesView_scrollPosition";
const FILTERS_STORAGE_KEY = "tvSeriesView_filters";

const TVSeriesView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tvShows, setTvShows] = useState<MediaMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that genres are numbers
        if (parsed.genres && Array.isArray(parsed.genres)) {
          parsed.genres = parsed.genres.filter((g: any) => typeof g === 'number');
        }
        return parsed;
      }
    } catch (err) {
      console.warn("Failed to parse saved TV filters, using defaults", err);
      localStorage.removeItem(FILTERS_STORAGE_KEY);
    }
    
    return {
      genres: [],
      yearRange: [1900, new Date().getFullYear()] as [number, number],
      minRating: 0,
      sortBy: "popularity" as const,
    };
  });
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  // Restore scroll position on mount
  useEffect(() => {
    const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
    if (savedPosition && containerRef.current) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPosition, 10));
      }, 100);
    }
  }, []);

  // Save scroll position on unmount
  useEffect(() => {
    return () => {
      sessionStorage.setItem(SCROLL_POSITION_KEY, window.scrollY.toString());
    };
  }, []);

  // Apply filters and sorting to TV shows
  const filteredAndSortedTVShows = useCallback(() => {
    let result = [...tvShows];

    console.log("Filtering TV shows:", {
      totalShows: result.length,
      selectedGenres: filters.genres,
      selectedGenreTypes: filters.genres.map(g => typeof g),
      sampleShows: result.slice(0, 3).map(s => ({
        title: s.title,
        genreIds: s.genreIds,
        genreIdTypes: s.genreIds?.map(g => typeof g)
      }))
    });

    // Filter by genres
    if (filters.genres.length > 0) {
      result = result.filter((show) => {
        if (!show.genreIds || show.genreIds.length === 0) {
          return false;
        }
        // Show must have at least one of the selected genres
        return filters.genres.some(selectedGenre => 
          show.genreIds!.includes(selectedGenre)
        );
      });
      console.log("After genre filter:", result.length, "TV shows");
    }

    // Filter by rating
    if (filters.minRating > 0) {
      result = result.filter((show) => (show.voteAverage || 0) >= filters.minRating);
    }

    // Filter by year
    result = result.filter((show) => {
      const year = show.year || new Date(show.releaseDate || "").getFullYear();
      return year >= filters.yearRange[0] && year <= filters.yearRange[1];
    });

    // Sort
    switch (filters.sortBy) {
      case "rating":
        result.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
        break;
      case "release_date":
        result.sort((a, b) => {
          const dateA = new Date(a.releaseDate || 0).getTime();
          const dateB = new Date(b.releaseDate || 0).getTime();
          return dateB - dateA;
        });
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "popularity":
      default:
        // Keep original order from API (already sorted by popularity)
        break;
    }

    return result;
  }, [tvShows, filters]);

  const displayedTVShows = filteredAndSortedTVShows();

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // Fetch TV shows
  const fetchTVShows = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const newShows = await metadataApi.getPopular("tv", pageNum);
      
      // Debug: Check if genreIds are present
      console.log("Fetched TV shows sample:", newShows.slice(0, 2).map(s => ({
        title: s.title,
        genreIds: s.genreIds,
        year: s.year
      })));
      
      if (newShows.length === 0 || newShows.length < TV_PER_PAGE) {
        setHasMore(false);
      }

      setTvShows((prev) => pageNum === 1 ? newShows : [...prev, ...newShows]);
    } catch (err) {
      console.error("Failed to fetch TV shows:", err);
      setError(err instanceof Error ? err.message : "Failed to load TV shows");
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTVShows(1);
  }, [fetchTVShows]);

  // Infinite scroll observer
  useEffect(() => {
    const currentTarget = observerTarget.current;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !loading && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadingMore, loading, hasMore]);

  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchTVShows(page);
    }
  }, [page, fetchTVShows]);

  const handleCardClick = (show: MediaMetadata) => {
    navigate(`/tv/${show.id}`);
  };

  const handleRetry = () => {
    setPage(1);
    setHasMore(true);
    fetchTVShows(1);
  };

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
          {t("nav.tvSeries")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {loading ? t("discovery.loading") : `${displayedTVShows.length} of ${tvShows.length} TV series`}
        </p>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        mediaType="tv"
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Initial Loading State */}
      {loading && tvShows.length === 0 && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && tvShows.length === 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            {t("common.retry")}
          </button>
        </div>
      )}

      {/* TV Shows Grid */}
      {!loading && displayedTVShows.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
            {displayedTVShows.map((show) => (
              <MovieCard
                key={`tv-${show.id}`}
                title={show.title}
                year={show.year?.toString() || ""}
                poster={show.poster || ""}
                rating={show.voteAverage || 0}
                onClick={() => handleCardClick(show)}
              />
            ))}
          </div>

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          )}

          {/* Intersection Observer Target */}
          {hasMore && !loadingMore && (
            <div ref={observerTarget} className="h-20" />
          )}

          {/* End of Results */}
          {!hasMore && displayedTVShows.length > 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">That's all the TV series for now</p>
            </div>
          )}
        </>
      )}

      {/* No Results After Filtering */}
      {!loading && !error && tvShows.length > 0 && displayedTVShows.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8 text-center">
          <p className="text-yellow-800 dark:text-yellow-200 text-lg mb-4">
            No TV series match your filters
          </p>
          <button
            onClick={() => setFilters({
              genres: [],
              yearRange: [1900, new Date().getFullYear()],
              minRating: 0,
              sortBy: "popularity",
            })}
            className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Empty State - No TV shows loaded */}
      {!loading && !error && tvShows.length === 0 && (
        <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No TV series available
          </p>
        </div>
      )}
    </div>
  );
};

export default TVSeriesView;
