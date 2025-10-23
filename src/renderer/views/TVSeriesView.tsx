import { useEffect, useState, useRef, useCallback, useLayoutEffect } from "react";
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
      const saved = sessionStorage.getItem(FILTERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that genres are numbers
        if (parsed.genres && Array.isArray(parsed.genres)) {
          parsed.genres = parsed.genres.filter((g: any) => typeof g === 'number');
        }
        console.log('[TVSeriesView] Restored filters from sessionStorage:', parsed);
        return parsed;
      }
    } catch (err) {
      console.warn("[TVSeriesView] Failed to parse saved TV filters, using defaults", err);
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
        console.log(`[TVSeriesView] Saved scroll position: ${scrollPos}`);
      }
    };

    // Save on unmount
    return () => {
      saveScrollPosition();
    };
  }, []);

  // Restore scroll position ONLY on initial mount (prevents scroll reset during infinite scroll)
  useLayoutEffect(() => {
    if (isInitialMount && !loading && tvShows.length > 0 && mainContainerRef.current && !hasRestoredScroll.current) {
      const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedPosition) {
        const scrollPos = parseInt(savedPosition, 10);
        console.log(`[TVSeriesView] Restoring scroll position on mount: ${scrollPos}`);
        mainContainerRef.current.scrollTop = scrollPos;
        hasRestoredScroll.current = true;
      }
      setIsInitialMount(false);
    }
  }, [isInitialMount, loading, tvShows.length]);

  // No client-side filtering needed - discover API handles all filtering server-side

  // Firebase pattern: Filter changes trigger API refetch with reset pagination
  const handleFiltersChange = (newFilters: FilterState) => {
    console.log('[TVSeriesView] Filters changed, triggering refetch:', newFilters);
    setFilters(newFilters);
    setPage(1);
    setTvShows([]); // Clear current results
    setHasMore(true); // Reset pagination state
    // fetchTVShows(1) will be called by useEffect when filters change
  };

  // Fetch TV shows with filters (Firebase pattern - using discover endpoint)
  const fetchTVShows = useCallback(async (pageNum: number) => {
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

      console.log('[TVSeriesView] Fetching with filters:', { page: pageNum, filters: filterParams });
      const newShows = await metadataApi.discover("tv", pageNum, filterParams);
      
      console.log('[TVSeriesView] Received TV shows:', newShows.length);
      
      if (newShows.length === 0 || newShows.length < TV_PER_PAGE) {
        setHasMore(false);
      }

      setTvShows((prev) => pageNum === 1 ? newShows : [...prev, ...newShows]);
    } catch (err) {
      console.error("[TVSeriesView] Failed to fetch TV shows:", err);
      setError(err instanceof Error ? err.message : "Failed to load TV shows");
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

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
    // Save scroll position immediately before navigation
    if (mainContainerRef.current) {
      const scrollPos = mainContainerRef.current.scrollTop;
      sessionStorage.setItem(SCROLL_POSITION_KEY, scrollPos.toString());
      console.log(`[TVSeriesView] Saved scroll position on click: ${scrollPos}`);
    }
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
          {loading ? t("discovery.loading") : `${tvShows.length} ${tvShows.length === 1 ? 'series' : 'series'}`}
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
      {!loading && tvShows.length > 0 && (
        <>
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {tvShows.map((show) => (
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
          {!hasMore && tvShows.length > 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">That's all the TV series for now</p>
            </div>
          )}
        </>
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
