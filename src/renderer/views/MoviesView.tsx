import { useEffect, useState, useRef, useCallback } from "react";
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
      console.warn("Failed to parse saved filters, using defaults", err);
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

    // Apply filters and sorting to movies
  const filteredAndSortedMovies = useCallback(() => {
    let result = [...movies];

    console.log("Filtering movies:", {
      totalMovies: result.length,
      selectedGenres: filters.genres,
      selectedGenreTypes: filters.genres.map(g => typeof g),
      sampleMovies: result.slice(0, 3).map(m => ({
        title: m.title,
        genreIds: m.genreIds,
        genreIdTypes: m.genreIds?.map(g => typeof g)
      }))
    });

    // Filter by genres
    if (filters.genres.length > 0) {
      result = result.filter((movie) => {
        if (!movie.genreIds || movie.genreIds.length === 0) {
          return false;
        }
        // Movie must have at least one of the selected genres
        return filters.genres.some(selectedGenre => 
          movie.genreIds!.includes(selectedGenre)
        );
      });
      console.log("After genre filter:", result.length, "movies");
    }

    // Filter by rating
    if (filters.minRating > 0) {
      result = result.filter((movie) => (movie.voteAverage || 0) >= filters.minRating);
    }

    // Filter by year
    result = result.filter((movie) => {
      const year = movie.year || new Date(movie.releaseDate || "").getFullYear();
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
  }, [movies, filters]);

  const displayedMovies = filteredAndSortedMovies();

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

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

  // Fetch movies
  const fetchMovies = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const newMovies = await metadataApi.getPopular("movie", pageNum);
      
      // Debug: Check if genreIds are present
      console.log("Fetched movies sample:", newMovies.slice(0, 2).map(m => ({
        title: m.title,
        genreIds: m.genreIds,
        year: m.year
      })));
      
      if (newMovies.length === 0 || newMovies.length < MOVIES_PER_PAGE) {
        setHasMore(false);
      }

      setMovies((prev) => pageNum === 1 ? newMovies : [...prev, ...newMovies]);
    } catch (err) {
      console.error("Failed to fetch movies:", err);
      setError(err instanceof Error ? err.message : "Failed to load movies");
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

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
          {loading ? t("discovery.loading") : `${displayedMovies.length} of ${movies.length} movies`}
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
      {!loading && displayedMovies.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
            {displayedMovies.map((movie) => (
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

      {/* Empty State - No results after filtering */}
      {!loading && movies.length > 0 && displayedMovies.length === 0 && (
        <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
            No movies match your filters
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
