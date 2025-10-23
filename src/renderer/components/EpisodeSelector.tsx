import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Download, X, CheckSquare, Square, Loader2, Play } from "lucide-react";
import { downloadApi, torrentApi, metadataApi, ApiError } from "../services/api";
import { useToast } from "./Toast";

interface Episode {
  id: number;
  episodeNumber: number;
  name: string;
  overview?: string;
  stillPath?: string;
  airDate?: string;
  runtime?: number;
  voteAverage?: number;
}

interface Season {
  id: number;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  posterPath?: string;
  airDate?: string;
  overview?: string;
  episodes?: Episode[];
}

interface EpisodeSelectorProps {
  tmdbId: number;
  title: string;
  seasons: Season[];
  onClose: () => void;
}

const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({
  tmdbId,
  title,
  seasons,
  onClose,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedEpisodes, setSelectedEpisodes] = useState<Set<number>>(new Set());
  const [selectedQuality, setSelectedQuality] = useState<string>("1080p");
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Map<number, number>>(new Map());

  // Load episodes for the first season on mount
  useEffect(() => {
    if (seasons.length > 0 && !selectedSeason) {
      handleSeasonChange(seasons[0]);
    }
  }, [seasons]);

  const handleSeasonChange = async (season: Season) => {
    setSelectedSeason(season);
    setSelectedEpisodes(new Set());
    
    // If season doesn't have episodes loaded, fetch them
    if (!season.episodes || season.episodes.length === 0) {
      setLoadingEpisodes(true);
      try {
        const seasonDetails = await metadataApi.getTVSeasonDetails(tmdbId, season.seasonNumber);
        // Update the season with loaded episodes
        season.episodes = seasonDetails.episodes;
        setSelectedSeason({ ...season });
      } catch (err) {
        console.error(`Failed to load episodes for season ${season.seasonNumber}:`, err);
        showToast({
          type: 'error',
          title: 'Failed to Load Episodes',
          message: `Could not load episodes for ${season.name}`,
          duration: 4000,
        });
      } finally {
        setLoadingEpisodes(false);
      }
    }
  };

  const toggleEpisode = (episodeNumber: number) => {
    setSelectedEpisodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(episodeNumber)) {
        newSet.delete(episodeNumber);
      } else {
        newSet.add(episodeNumber);
      }
      return newSet;
    });
  };

  const selectAllEpisodes = () => {
    if (!selectedSeason?.episodes) return;
    
    const allEpisodeNumbers = selectedSeason.episodes.map((ep) => ep.episodeNumber);
    setSelectedEpisodes(new Set(allEpisodeNumbers));
  };

  const deselectAllEpisodes = () => {
    setSelectedEpisodes(new Set());
  };

  const handleDownload = async () => {
    if (!selectedSeason || selectedEpisodes.size === 0) {
      showToast({
        type: 'warning',
        title: t("download.noSelection") || "No Episodes Selected",
        message: "Please select at least one episode to download",
      });
      return;
    }

    setDownloading(true);

    try {
      const selectedEpisodesList = selectedSeason.episodes?.filter((ep) =>
        selectedEpisodes.has(ep.episodeNumber)
      ) || [];

      showToast({
        type: 'info',
        title: t("download.queueing") || "Queueing Downloads",
        message: `Adding ${selectedEpisodesList.length} episode(s) to download queue`,
      });

      // Download episodes sequentially
      for (const episode of selectedEpisodesList) {
        const episodeQuery = `${title} S${String(selectedSeason.seasonNumber).padStart(2, '0')}E${String(episode.episodeNumber).padStart(2, '0')}`;
        
        try {
          // Search for torrent with selected quality
          const results = await torrentApi.search(episodeQuery, {
            limit: 5,
            quality: [selectedQuality],
            minSeeders: 1,
          });

          if (results.length > 0) {
            const bestTorrent = results.sort((a: any, b: any) => b.seeders - a.seeders)[0];
            
            await downloadApi.start({
              tmdbId,
              mediaType: 'tv',
              title: `${title} - ${episode.name}`,
              quality: selectedQuality,
              sourceUrn: bestTorrent.magnetLink,
              seasonNumber: selectedSeason.seasonNumber,
              episodeNumber: episode.episodeNumber,
            });

            setDownloadProgress((prev) => new Map(prev).set(episode.episodeNumber, 100));
            
            showToast({
              type: 'success',
              title: t("download.started") || "Episode Added",
              message: `S${selectedSeason.seasonNumber}E${episode.episodeNumber}: ${episode.name}`,
              duration: 3000,
            });
          } else {
            showToast({
              type: 'warning',
              title: t("download.notFound") || "Torrent Not Found",
              message: `No torrents for S${selectedSeason.seasonNumber}E${episode.episodeNumber}`,
              duration: 3000,
            });
          }
        } catch (err) {
          console.error(`Failed to download episode ${episode.episodeNumber}:`, err);
          showToast({
            type: 'error',
            title: t("download.error") || "Download Failed",
            message: `S${selectedSeason.seasonNumber}E${episode.episodeNumber}: ${episode.name}`,
            duration: 4000,
          });
        }

        // Small delay between downloads to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      showToast({
        type: 'success',
        title: t("download.complete") || "Queue Complete",
        message: `${selectedEpisodesList.length} episode(s) added to downloads`,
      });

      onClose();
    } catch (err) {
      console.error("Batch download failed:", err);
      showToast({
        type: 'error',
        title: t("download.error") || "Download Failed",
        message: "Failed to queue episode downloads",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex flex-col animate-slide-up border border-gray-200/50 dark:border-gray-700/50">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/50">
          <div>
            <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t("tv.selectEpisodes") || "Select Episodes"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all hover:scale-110"
          >
            <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Seasons Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-800/30">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-3">
                {t("tv.seasons") || "Seasons"}
              </h3>
              <div className="space-y-2">
                {seasons.map((season) => (
                  <button
                    key={season.id}
                    onClick={() => handleSeasonChange(season)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                      selectedSeason?.id === season.id
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]"
                        : "bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-[1.01]"
                    }`}
                  >
                    <div className="font-semibold">{season.name}</div>
                    <div className="text-sm opacity-75">
                      {season.episodeCount} {t("tv.episodes") || "episodes"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Episodes Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedSeason && (
              <>
                {/* Selection Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedEpisodes.size} {t("tv.selected") || "selected"}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllEpisodes}
                      className="px-4 py-2 text-sm bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600 hover:from-gray-300 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-900 dark:text-white rounded-xl transition-all hover:scale-[1.02] shadow-md border border-gray-300 dark:border-gray-600"
                    >
                      {t("common.selectAll") || "Select All"}
                    </button>
                    <button
                      onClick={deselectAllEpisodes}
                      className="px-4 py-2 text-sm bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600 hover:from-gray-300 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-900 dark:text-white rounded-xl transition-all hover:scale-[1.02] shadow-md border border-gray-300 dark:border-gray-600"
                    >
                      {t("common.deselectAll") || "Deselect All"}
                    </button>
                  </div>
                </div>

                {/* Episodes Grid */}
                {loadingEpisodes ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSeason.episodes?.map((episode) => (
                      <button
                        key={episode.id}
                        onClick={() => toggleEpisode(episode.episodeNumber)}
                        className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                          selectedEpisodes.has(episode.episodeNumber)
                            ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/30 dark:to-indigo-900/20 shadow-lg shadow-indigo-500/20 scale-[1.01]"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 hover:border-indigo-300 dark:hover:border-indigo-600 hover:scale-[1.01]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {selectedEpisodes.has(episode.episodeNumber) ? (
                              <CheckSquare className="h-5 w-5 text-indigo-400" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-indigo-400">
                                E{String(episode.episodeNumber).padStart(2, '0')}
                              </span>
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                {episode.name}
                              </h4>
                            </div>
                            
                            {episode.overview && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                {episode.overview}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                              {episode.airDate && (
                                <span>{new Date(episode.airDate).toLocaleDateString()}</span>
                              )}
                              {episode.runtime && (
                                <span>{episode.runtime} min</span>
                              )}
                              {episode.voteAverage && (
                                <span>⭐ {episode.voteAverage.toFixed(1)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30">
          {/* Quality Selector */}
          {selectedEpisodes.size > 0 && (
            <div className="mb-4 p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <label className="block mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Download Quality for All Selected Episodes
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This quality will be applied to all {selectedEpisodes.size} selected episode(s)
                </p>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["2160p", "1080p", "720p", "480p"].map((quality) => (
                  <button
                    key={quality}
                    onClick={() => setSelectedQuality(quality)}
                    className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      selectedQuality === quality
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-[1.02]"
                    }`}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Action Section */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedEpisodes.size > 0 ? (
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedEpisodes.size} episode(s)
                  </span>
                  {" "}· Quality: {" "}
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {selectedQuality}
                  </span>
                </div>
              ) : (
                <span>Select episodes to download</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-semibold transition-all hover:scale-[1.02]"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                onClick={handleDownload}
                disabled={selectedEpisodes.size === 0 || downloading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/30 hover:scale-[1.02] disabled:hover:scale-100 disabled:shadow-none"
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t("download.queueing") || "Queueing..."}
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    {t("download.start") || "Download"} ({selectedEpisodes.size})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EpisodeSelector;
