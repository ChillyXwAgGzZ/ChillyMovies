import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Play, Star, RefreshCw } from "lucide-react";
import { metadataApi, type MediaMetadata, ApiError } from "../services/api";
import DownloadPanel from "../components/DownloadPanel";

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
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
        
        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster */}
            <div className="flex-shrink-0">
              <img
                src={movie.poster || "https://via.placeholder.com/300x450?text=No+Poster"}
                alt={movie.title}
                className="w-64 rounded-lg shadow-2xl"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/300x450?text=No+Poster";
                }}
              />
            </div>

            {/* Movie Info */}
            <div className="flex-1 flex flex-col justify-end">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{movie.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {movie.year && (
                  <span className="text-gray-300 text-lg">{movie.year}</span>
                )}
                {movie.voteAverage && (
                  <div className="flex items-center bg-yellow-500/20 px-3 py-1 rounded-full">
                    <Star className="h-5 w-5 text-yellow-400 mr-1 fill-yellow-400" />
                    <span className="text-yellow-400 font-semibold">{movie.voteAverage.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {movie.overview && (
                <p className="text-gray-300 text-lg mb-8 max-w-3xl leading-relaxed">
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

                <button
                  onClick={handleWatchTrailer}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 rounded-xl font-semibold transition-all shadow-md hover:scale-[1.02]"
                >
                  <Play className="mr-2 h-5 w-5" />
                  {t("discovery.watchTrailer") || "Watch Trailer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {movie.releaseDate && (
          <div>
            <h3 className="text-xl font-semibold mb-2">{t("movie.releaseDate") || "Release Date"}</h3>
            <p className="text-gray-400">{new Date(movie.releaseDate).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetailView;
