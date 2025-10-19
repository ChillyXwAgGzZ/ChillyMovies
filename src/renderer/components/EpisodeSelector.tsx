import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Download, X, CheckSquare, Square, Loader2, Play } from "lucide-react";
import { downloadApi, torrentApi, ApiError } from "../services/api";
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
  
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(
    seasons.length > 0 ? seasons[0] : null
  );
  const [selectedEpisodes, setSelectedEpisodes] = useState<Set<number>>(new Set());
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Map<number, number>>(new Map());

  const handleSeasonChange = (season: Season) => {
    setSelectedSeason(season);
    setSelectedEpisodes(new Set());
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
          // Search for torrent
          const results = await torrentApi.search(episodeQuery, {
            limit: 5,
            quality: ['1080p', '720p'],
            minSeeders: 1,
          });

          if (results.length > 0) {
            const bestTorrent = results.sort((a: any, b: any) => b.seeders - a.seeders)[0];
            
            await downloadApi.start({
              tmdbId,
              mediaType: 'tv',
              title: `${title} - ${episode.name}`,
              quality: bestTorrent.quality || '1080p',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              {t("tv.selectEpisodes") || "Select Episodes"}
            </h2>
            <p className="text-gray-400 text-sm">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Seasons Sidebar */}
          <div className="w-64 border-r border-gray-700 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
                {t("tv.seasons") || "Seasons"}
              </h3>
              <div className="space-y-2">
                {seasons.map((season) => (
                  <button
                    key={season.id}
                    onClick={() => handleSeasonChange(season)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      selectedSeason?.id === season.id
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
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
                  <div className="text-sm text-gray-400">
                    {selectedEpisodes.size} {t("tv.selected") || "selected"}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllEpisodes}
                      className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                    >
                      {t("common.selectAll") || "Select All"}
                    </button>
                    <button
                      onClick={deselectAllEpisodes}
                      className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition"
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
                        className={`text-left p-4 rounded-lg border-2 transition-all ${
                          selectedEpisodes.has(episode.episodeNumber)
                            ? "border-indigo-500 bg-indigo-900/30"
                            : "border-gray-700 bg-gray-700/30 hover:border-gray-600"
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
                              <h4 className="font-semibold text-white truncate">
                                {episode.name}
                              </h4>
                            </div>
                            
                            {episode.overview && (
                              <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                                {episode.overview}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
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
        <div className="p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {selectedEpisodes.size > 0 && (
                <span>
                  {selectedEpisodes.size} episode(s) will be downloaded sequentially
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                onClick={handleDownload}
                disabled={selectedEpisodes.size === 0 || downloading}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition flex items-center gap-2"
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
