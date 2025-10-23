import { useEffect, useState, useRef, useCallback, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import FilterPanel, { type FilterState } from "../components/FilterPanel";
import { metadataApi, type MediaMetadata } from "../services/api";

const MOVIES_PER_PAGE = 20;
const SCROLL_POSITION_KEY = "moviesView_scrollPosition";
const FILTERS_STORAGE_KEY = "moviesView_filters";

const MoviesView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<MediaMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const saved = sessionStorage.getItem(FILTERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that genres are numbers
        if (parsed.genres && Array.isArray(parsed.genres)) {
          parsed.genres = parsed.genres.filter((g: any) => typeof g === 'number');
        }
        console.log('[MoviesView] Restored filters from sessionStorage:', parsed);
        return parsed;
      }
    } catch (err) {
      console.warn("[MoviesView] Failed to parse saved filters, using defaults", err);
      sessionStorage.removeItem(FILTERS_STORAGE_KEY);
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
  const mainContainerRef = useRef<HTMLElement | null>(null);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const hasRestoredScroll = useRef(false);

  // Save filters to sessionStorage when they change (Firebase pattern)
  useEffect(() => {
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  // Get reference to the scrollable main container
  useEffect(() => {
    const main = document.querySelector('main');
    if (main) {
      mainContainerRef.current = main;
    }
  }, []);

  // Save scroll position before unmounting or navigating away
  useEffect(() => {
    const saveScrollPosition = () => {
      if (mainContainerRef.current) {
        const scrollPos = mainContainerRef.current.scrollTop;
        sessionStorage.setItem(SCROLL_POSITION_KEY, scrollPos.toString());
        console.log(`[MoviesView] Saved scroll position: ${scrollPos}`);
      }
    };

    // Save on unmount
    return () => {
      saveScrollPosition();
    };
  }, []);

  // Restore scroll position ONLY on initial mount (prevents scroll reset during infinite scroll)
  useLayoutEffect(() => {
    if (isInitialMount && !loading && movies.length > 0 && mainContainerRef.current && !hasRestoredScroll.current) {
      const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedPosition) {
        const scrollPos = parseInt(savedPosition, 10);
        console.log(`[MoviesView] Restoring scroll position on mount: ${scrollPos}`);
        mainContainerRef.current.scrollTop = scrollPos;
        hasRestoredScroll.current = true;
      }
      setIsInitialMount(false);
    }
  }, [isInitialMount, loading, movies.length]);

  // No client-side filtering needed - discover API handles all filtering server-side

  // Firebase pattern: Filter changes trigger API refetch with reset pagination
  const handleFiltersChange = (newFilters: FilterState) => {
    console.log('[MoviesView] Filters changed, triggering refetch:', newFilters);
    setFilters(newFilters);
    setPage(1);
    setMovies([]); // Clear current results
    setHasMore(true); // Reset pagination state
    // fetchMovies(1) will be called by useEffect when filters change
  };

  // Restore scroll position on mount
  useEffect(() => {
    const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
    if (savedPosition) {
      setTimeout(() => {
        const mainElement = document.querySelector('main');
        if (mainElement) {
          mainElement.scrollTop = parseInt(savedPosition, 10);
        }
      }, 100);
    }
  }, []);

  // Save scroll position on unmount
  useEffect(() => {
    return () => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        sessionStorage.setItem(SCROLL_POSITION_KEY, mainElement.scrollTop.toString());
      }
    };
  }, []);

  // Fetch movies with filters (Firebase pattern - using discover endpoint)
  const fetchMovies = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      // Build filter parameters for discover API
      const currentYear = new Date().getFullYear();
      const filterParams = {
        genres: filters.genres.length > 0 ? filters.genres : undefined,
        yearFrom: filters.yearRange[0] !== 1900 ? filters.yearRange[0] : undefined,
        yearTo: filters.yearRange[1] !== currentYear ? filters.yearRange[1] : undefined,
        minRating: filters.minRating > 0 ? filters.minRating : undefined,
        sortBy: filters.sortBy
      };

      console.log('[MoviesView] Fetching with filters:', { page: pageNum, filters: filterParams });
      const newMovies = await metadataApi.discover("movie", pageNum, filterParams);
      
      console.log('[MoviesView] Received movies:', newMovies.length);
      
      if (newMovies.length === 0 || newMovies.length < MOVIES_PER_PAGE) {
        setHasMore(false);
      }

      setMovies((prev) => pageNum === 1 ? newMovies : [...prev, ...newMovies]);
    } catch (err) {
      console.error("[MoviesView] Failed to fetch movies:", err);
      setError(err instanceof Error ? err.message : "Failed to load movies");
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  // Initial fetch
  useEffect(() => {
    fetchMovies(1);
  }, [fetchMovies]);

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
      fetchMovies(page);
    }
  }, [page, fetchMovies]);

  const handleCardClick = (movie: MediaMetadata) => {
    // Save scroll position immediately before navigation
    if (mainContainerRef.current) {
      const scrollPos = mainContainerRef.current.scrollTop;
      sessionStorage.setItem(SCROLL_POSITION_KEY, scrollPos.toString());
      console.log(`[MoviesView] Saved scroll position on click: ${scrollPos}`);
    }
    navigate(`/movie/${movie.id}`);
  };

  const handleRetry = () => {
    setPage(1);
    setHasMore(true);
    fetchMovies(1);
  };

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
          {t("nav.movies")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {loading ? t("discovery.loading") : `${movies.length} ${movies.length === 1 ? 'movie' : 'movies'}`}
        </p>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        mediaType="movie"
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Initial Loading State */}
      {loading && movies.length === 0 && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && movies.length === 0 && (
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

      {/* Movies Grid */}
      {!loading && movies.length > 0 && (
        <>
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {movies.map((movie) => (
              <MovieCard
                key={`movie-${movie.id}`}
                title={movie.title}
                year={movie.year?.toString() || ""}
                poster={movie.poster || ""}
                rating={movie.voteAverage || 0}
                onClick={() => handleCardClick(movie)}
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
          {!hasMore && movies.length > 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">That's all the movies for now</p>
            </div>
          )}
        </>
      )}



      {/* Empty State - No movies loaded */}
      {!loading && !error && movies.length === 0 && (
        <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No movies available
          </p>
        </div>
      )}
    </div>
  );
};

export default MoviesView;
