import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Play, Star, Download } from "lucide-react";
import { metadataApi, type MediaMetadata, type TVSeason } from "../services/api";
import DownloadPanel from "../components/DownloadPanel";
import EpisodeSelector from "../components/EpisodeSelector";

const TVDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [series, setSeries] = useState<MediaMetadata | null>(null);
  const [seasons, setSeasons] = useState<TVSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showEpisodeSelector, setShowEpisodeSelector] = useState(false);

  useEffect(() => {
    const fetchSeriesDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch series details and seasons in parallel
        const [seriesData, seasonsData] = await Promise.all([
          metadataApi.getDetails(parseInt(id), "tv"),
          metadataApi.getTVSeasons(parseInt(id)),
        ]);
        
        setSeries(seriesData);
        setSeasons(seasonsData);
      } catch (err) {
        console.error("Failed to fetch series details:", err);
        setError(err instanceof Error ? err.message : "Failed to load series details");
      } finally {
        setLoading(false);
      }
    };

    fetchSeriesDetails();
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
      const trailers = await metadataApi.getTrailers(parseInt(id), "tv");
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

  if (error || !series) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-8 max-w-md text-center">
          <p className="text-red-400 mb-4">{error || "Series not found"}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
          >
            {t("common.goBack") || "Go Back"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-gray-400 hover:text-white transition"
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        {t("common.back") || "Back"}
      </button>

      {/* Series Header with Backdrop */}
      <div 
        className="relative rounded-lg overflow-hidden mb-8"
        style={{
          backgroundImage: series.backdrop ? `url(${series.backdrop})` : undefined,
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
                src={series.poster || "https://via.placeholder.com/300x450?text=No+Poster"}
                alt={series.title}
                className="w-64 rounded-lg shadow-2xl"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/300x450?text=No+Poster";
                }}
              />
            </div>

            {/* Series Info */}
            <div className="flex-1 flex flex-col justify-end">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{series.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {series.year && (
                  <span className="text-gray-300 text-lg">{series.year}</span>
                )}
                {series.voteAverage && (
                  <div className="flex items-center bg-yellow-500/20 px-3 py-1 rounded-full">
                    <Star className="h-5 w-5 text-yellow-400 mr-1 fill-yellow-400" />
                    <span className="text-yellow-400 font-semibold">{series.voteAverage.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {series.overview && (
                <p className="text-gray-300 text-lg mb-8 max-w-3xl leading-relaxed">
                  {series.overview}
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
                
                {/* Episode Selector Button for TV Shows */}
                <button
                  onClick={() => setShowEpisodeSelector(true)}
                  className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition"
                >
                  <Download className="mr-2 h-5 w-5" />
                  {t("tv.selectEpisodes") || "Select Episodes"}
                </button>

                <button
                  onClick={handleWatchTrailer}
                  className="flex items-center px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
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
        {series.releaseDate && (
          <div>
            <h3 className="text-xl font-semibold mb-2">{t("tv.firstAirDate") || "First Air Date"}</h3>
            <p className="text-gray-400">{new Date(series.releaseDate).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      {/* Episode Selector Modal */}
      {showEpisodeSelector && (
        <EpisodeSelector
          tmdbId={parseInt(id!)}
          title={series.title}
          seasons={seasons}
          onClose={() => setShowEpisodeSelector(false)}
        />
      )}
    </div>
  );
};

export default TVDetailView;
