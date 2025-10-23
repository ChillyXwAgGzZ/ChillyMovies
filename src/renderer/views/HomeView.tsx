import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import HeroBanner from "../components/HeroBanner";
import { metadataApi, type MediaMetadata } from "../services/api";

interface HomeViewProps {
  searchResults?: MediaMetadata[];
  isSearching?: boolean;
  searchError?: string | null;
  searchQuery?: string;
}

const HomeView: React.FC<HomeViewProps> = ({ 
  searchResults = [], 
  isSearching = false,
  searchError = null,
  searchQuery = ""
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [popularMovies, setPopularMovies] = useState<MediaMetadata[]>([]);
  const [popularTV, setPopularTV] = useState<MediaMetadata[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<MediaMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [movies, tv] = await Promise.all([
          metadataApi.getPopular("movie", 1),
          metadataApi.getPopular("tv", 1),
        ]);
        
        setPopularMovies(movies);
        setPopularTV(tv);
        
        // Get 6 featured movies for hero banner (from popular movies)
        setFeaturedMovies(movies.slice(0, 6));
      } catch (err) {
        console.error("Failed to fetch popular content:", err);
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    fetchPopularContent();
  }, []);

  const handleCardClick = (item: MediaMetadata) => {
    const route = item.mediaType === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`;
    navigate(route);
  };

  // Show search results if searching or have results
  if (searchQuery && (isSearching || searchResults.length > 0 || searchError)) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">{t("home.searchResults")}</h2>
          <p className="text-gray-400">
            {isSearching
              ? t("home.searching")
              : searchError
              ? t("home.searchError")
              : `Found ${searchResults.length} results for "${searchQuery}"`}
          </p>
        </div>

        {isSearching && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {searchError && !isSearching && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
            <p className="text-red-400">{searchError}</p>
          </div>
        )}

        {!isSearching && !searchError && searchResults.length === 0 && (
          <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">{t("home.noResults")}</p>
          </div>
        )}

        {!isSearching && searchResults.length > 0 && (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {searchResults.map((item) => (
              <div key={`${item.mediaType}-${item.id}`} className="transform transition-transform duration-300 hover:scale-105">
                <MovieCard
                  title={item.title}
                  year={item.year?.toString() || ""}
                  poster={item.poster || ""}
                  rating={item.voteAverage || 0}
                  onClick={() => handleCardClick(item)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show popular content by default
  return (
    <div className="space-y-0">
      {/* Hero Banner - Featured Movies */}
      {!loading && !error && featuredMovies.length > 0 && (
        <div className="relative">
          <HeroBanner 
            movies={featuredMovies}
            autoSlideInterval={4000}
            onMovieClick={handleCardClick}
          />
          {/* Artistic fade transition from banner to content */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900 pointer-events-none -mb-1" />
        </div>
      )}

      {/* Popular Movies Section */}
      <section className="pt-8 px-1">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 tracking-tight">{t("home.popularMovies")}</h2>
        
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
            >
              {t("common.retry")}
            </button>
          </div>
        )}

        {!loading && !error && popularMovies.length > 0 && (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {popularMovies.map((movie) => (
              <div key={`movie-${movie.id}`} className="transform transition-transform duration-300 hover:scale-105">
                <MovieCard
                  title={movie.title}
                  year={movie.year?.toString() || ""}
                  poster={movie.poster || ""}
                  rating={movie.voteAverage || 0}
                  onClick={() => handleCardClick(movie)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Popular TV Series Section */}
      <section className="pt-8 px-1">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 tracking-tight">{t("home.popularTV")}</h2>
        
        {!loading && !error && popularTV.length > 0 && (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {popularTV.map((show) => (
              <div key={`tv-${show.id}`} className="transform transition-transform duration-300 hover:scale-105">
                <MovieCard
                  title={show.title}
                  year={show.year?.toString() || ""}
                  poster={show.poster || ""}
                  rating={show.voteAverage || 0}
                  onClick={() => handleCardClick(show)}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomeView;
