import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import { metadataApi, type MediaMetadata } from "../services/api";

const MOVIES_PER_PAGE = 20;
const SCROLL_POSITION_KEY = "moviesView_scrollPosition";

const MoviesView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<MediaMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
          {loading ? t("discovery.loading") : `${movies.length} movies`}
        </p>
      </div>

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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

      {/* Empty State */}
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
