import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Play, Star, RefreshCw, Clock, DollarSign, Film, TrendingUp } from "lucide-react";
import { metadataApi, type MediaMetadata, ApiError } from "../services/api";
import DownloadPanel from "../components/DownloadPanel";
import MetadataCard from "../components/MetadataCard";
import SimilarContent from "../components/SimilarContent";
import { formatCurrency, formatRuntime } from "../utils/formatting";
import { getGenreColor } from "../constants/genreColors";

const MovieDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [movie, setMovie] = useState<MediaMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fetchMovieDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await metadataApi.getDetails(parseInt(id), "movie");
      setMovie(data);
    } catch (err) {
      console.error("Failed to fetch movie details:", err);
      if (err instanceof ApiError) {
        setError(err);
      } else {
        setError(new ApiError(
          err instanceof Error ? err.message : "Failed to load movie details",
          undefined,
          undefined,
          false
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieDetails();
  }, [id]);

  const handleDownloadStarted = (jobId: string) => {
    console.log("Download started with job ID:", jobId);
    setDownloadSuccess(true);
    
    // Navigate to downloads page after 1.5 seconds
    setTimeout(() => {
      navigate("/downloads");
    }, 1500);
  };

  const handleWatchTrailer = async () => {
    if (!id) return;

    try {
      const trailers = await metadataApi.getTrailers(parseInt(id), "movie");
      if (trailers.length > 0) {
        const youtubeUrl = `https://www.youtube.com/watch?v=${trailers[0].key}`;
        window.open(youtubeUrl, "_blank");
      } else {
        alert(t("trailer.noTrailers") || "No trailers available");
      }
    } catch (err) {
      console.error("Failed to fetch trailers:", err);
      alert(t("trailer.fetchError") || "Failed to load trailers");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-8 max-w-md text-center">
          <p className="text-red-400 mb-2 font-semibold">
            {error ? error.getUserMessage() : "Movie not found"}
          </p>
          {error && error.errorType !== 'not-found' && (
            <p className="text-gray-400 text-sm mb-4">
              {error.message}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition"
            >
              {t("common.backToHome") || "Back to Home"}
            </button>
            {error && error.isRetryable && (
              <button
                onClick={() => fetchMovieDetails()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition flex items-center gap-2"
              >
                <RefreshCw size={16} />
                {t("common.retry") || "Retry"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:scale-105"
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        {t("common.back") || "Back"}
      </button>

      {/* Movie Header with Backdrop */}
      <div 
        className="relative rounded-lg overflow-hidden mb-8"
        style={{
          backgroundImage: movie.backdrop ? `url(${movie.backdrop})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Darker gradient overlay for better text contrast (Phase 3) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/40"></div>
        
        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster */}
            <div className="flex-shrink-0">
              <img
                src={movie.poster || "https://via.placeholder.com/300x450?text=No+Poster"}
                alt={movie.title}
                className="w-72 rounded-lg shadow-2xl"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/300x450?text=No+Poster";
                }}
              />
            </div>

            {/* Movie Info */}
            <div className="flex-1 flex flex-col justify-end">
              {/* Force white text with shadow for readability in both themes (Phase 3) */}
              <h1 
                className="text-4xl md:text-5xl font-bold mb-4 text-white"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
              >
                {movie.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {movie.year && (
                  <span className="text-gray-100 text-lg">{movie.year}</span>
                )}
                {movie.voteAverage && (
                  <div className="flex items-center bg-yellow-500/20 px-3 py-1 rounded-full">
                    <Star className="h-5 w-5 text-yellow-400 mr-1 fill-yellow-400" />
                    <span className="text-yellow-400 font-semibold">{movie.voteAverage.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Genre Pills (Phase 3 - T-DETAIL-006) */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6 max-w-3xl overflow-x-auto">
                  {movie.genres.slice(0, 6).map((genre) => (
                    <span
                      key={genre.id}
                      className={`${getGenreColor(genre.id)} text-white text-sm font-medium px-3 py-1 rounded-full backdrop-blur-sm whitespace-nowrap`}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {movie.overview && (
                <p 
                  className="text-gray-100 text-lg mb-8 max-w-3xl leading-relaxed"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
                >
                  {movie.overview}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                {downloadSuccess && (
                  <div className="mb-4 px-6 py-3 bg-green-600/20 border border-green-600 rounded-lg">
                    <p className="text-green-400 font-semibold">
                      {t("download.redirecting") || "Download started! Redirecting to Downloads..."}
                    </p>
                  </div>
                )}
                
                <DownloadPanel
                  tmdbId={parseInt(id!)}
                  mediaType="movie"
                  title={movie.title}
                  onDownloadStarted={handleDownloadStarted}
                />

                {/* Glass morphism button for better visibility (Phase 3) */}
                <button
                  onClick={handleWatchTrailer}
                  className="flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold transition-all shadow-lg hover:scale-[1.02]"
                >
                  <Play className="mr-2 h-5 w-5" />
                  {t("discovery.watchTrailer") || "Watch Trailer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Grid (Phase 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Status */}
        {movie.status && (
          <MetadataCard
            label="Status"
            value={movie.status}
            icon={<Film size={18} />}
          />
        )}

        {/* Runtime */}
        {movie.runtime && (
          <MetadataCard
            label="Runtime"
            value={formatRuntime(movie.runtime)}
            icon={<Clock size={18} />}
          />
        )}

        {/* Budget */}
        {movie.budget && movie.budget > 0 && (
          <MetadataCard
            label="Budget"
            value={formatCurrency(movie.budget)}
            icon={<DollarSign size={18} />}
          />
        )}

        {/* Revenue */}
        {movie.revenue && movie.revenue > 0 && (
          <MetadataCard
            label="Revenue"
            value={formatCurrency(movie.revenue)}
            icon={<TrendingUp size={18} />}
          />
        )}

        {/* Release Date */}
        {movie.releaseDate && (
          <MetadataCard
            label="Release Date"
            value={new Date(movie.releaseDate).toLocaleDateString()}
          />
        )}

        {/* Original Language */}
        {movie.originalLanguage && (
          <MetadataCard
            label="Language"
            value={movie.originalLanguage.toUpperCase()}
          />
        )}
      </div>

      {/* Production Companies (Phase 3) */}
      {movie.productionCompanies && movie.productionCompanies.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Production Companies
          </h3>
          <div className="flex flex-wrap gap-6 items-center">
            {movie.productionCompanies.slice(0, 5).map((company) => (
              <div
                key={company.id}
                className="flex items-center gap-2 bg-white/5 dark:bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 hover:bg-white/10 dark:hover:bg-white/15 transition-all"
              >
                {company.logoPath ? (
                  <img
                    src={company.logoPath}
                    alt={company.name}
                    className="h-8 object-contain filter brightness-0 dark:brightness-100 invert dark:invert-0"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling!.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <span className={`text-sm font-medium text-gray-900 dark:text-white ${company.logoPath ? "hidden" : ""}`}>
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tagline (Phase 3) */}
      {movie.tagline && (
        <div className="mb-8 p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-l-4 border-indigo-500 rounded-lg">
          <p className="text-lg italic text-gray-700 dark:text-gray-300">
            "{movie.tagline}"
          </p>
        </div>
      )}

      {/* Similar Movies Carousel (Phase 3 - T-DETAIL-007) */}
      <SimilarContent currentId={parseInt(id!)} mediaType="movie" />
    </div>
  );
};

export default MovieDetailView;
