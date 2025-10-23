import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, X, HardDrive, Users, Gauge } from "lucide-react";
import { downloadApi, torrentApi, ApiError } from "../services/api";
import { useToast } from "./Toast";

interface TorrentResult {
  id: string;
  title: string;
  quality: string;
  seeders: number;
  leechers: number;
  sizeFormatted: string;
  magnetLink: string;
  provider: string;
}

interface DownloadPanelProps {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  onDownloadStarted?: (jobId: string) => void;
  onClose?: () => void;
}

const DownloadPanel: React.FC<DownloadPanelProps> = ({
  tmdbId,
  mediaType,
  title,
  onDownloadStarted,
  onClose,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<string>("1080p");
  const [torrents, setTorrents] = useState<TorrentResult[]>([]);
  const [selectedTorrent, setSelectedTorrent] = useState<TorrentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qualities = ["2160p", "1080p", "720p", "480p"];

  const searchTorrents = async (quality: string) => {
    setLoading(true);
    setError(null);
    setTorrents([]);
    setSelectedTorrent(null);

    try {
      const results = await torrentApi.search(`${title} ${quality}`, {
        limit: 10,
        quality: [quality],
        minSeeders: 1,
      });

      if (results.length === 0) {
        setError(t("download.noTorrents") || "No torrents found for this quality. Try a different quality.");
      } else {
        setTorrents(results);
        // Auto-select the smallest file size (but still with decent seeders)
        const sortedResults = results
          .filter((torrent: TorrentResult) => torrent.seeders >= 1) // Ensure it has at least 1 seeder
          .sort((a: TorrentResult, b: TorrentResult) => {
            // Parse size strings to numbers for comparison (assume format like "1.2 GB", "850 MB")
            const parseSize = (sizeStr: string): number => {
              const match = sizeStr.match(/^([\d.]+)\s*(GB|MB|KB)$/i);
              if (!match) return 0;
              const value = parseFloat(match[1]);
              const unit = match[2].toUpperCase();
              switch (unit) {
                case 'GB': return value * 1024 * 1024;
                case 'MB': return value * 1024;
                case 'KB': return value;
                default: return value;
              }
            };
            
            const sizeA = parseSize(a.sizeFormatted);
            const sizeB = parseSize(b.sizeFormatted);
            
            // If sizes are similar (within 10%), prefer higher seeders
            const sizeDiff = Math.abs(sizeA - sizeB);
            const avgSize = (sizeA + sizeB) / 2;
            if (sizeDiff / avgSize < 0.1) {
              return b.seeders - a.seeders;
            }
            
            // Otherwise, prefer smaller size
            return sizeA - sizeB;
          });
        
        const best = sortedResults.length > 0 ? sortedResults[0] : results[0];
        setSelectedTorrent(best);
      }
    } catch (err) {
      console.error("Torrent search failed:", err);
      setError(t("download.searchError") || "Failed to search for torrents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQualityChange = (quality: string) => {
    setSelectedQuality(quality);
    searchTorrents(quality);
  };

  const handleDownload = async () => {
    if (!selectedTorrent) return;

    setDownloading(true);
    setError(null);

    try {
      const result = await downloadApi.start({
        tmdbId,
        mediaType,
        title,
        quality: selectedQuality,
        sourceUrn: selectedTorrent.magnetLink, // Pass the specific torrent's magnet link
      });

      console.log("Download started:", result);
      
      // Show success toast
      showToast({
        type: 'success',
        title: t("download.started") || "Download Started!",
        message: `${title} (${selectedQuality}) is downloading`,
        duration: 4000,
      });
      
      if (onDownloadStarted) {
        onDownloadStarted(result.id);
      }

      // Close panel with animation
      setIsOpen(false);
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Download failed:", err);
      const friendlyMessage = err instanceof ApiError
        ? err.response?.error || err.message
        : undefined;
      const errorMessage = friendlyMessage || t("download.error") || "Failed to start download. Please try again.";
      
      setError(errorMessage);
      
      // Show error toast
      showToast({
        type: 'error',
        title: t("download.error") || "Download Failed",
        message: errorMessage,
        duration: 6000,
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative">
      {/* Download Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && torrents.length === 0) {
            searchTorrents(selectedQuality);
          }
        }}
        className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:scale-[1.02]"
      >
        <Download className="mr-2 h-5 w-5" />
        {t("download.button") || "Download"}
      </button>

      {/* Download Panel Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col animate-slide-up border border-gray-200/50 dark:border-gray-700/50">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/50">
              <div>
                <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{t("download.selectQuality") || "Select Download Quality"}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{title}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all hover:scale-110"
              >
                <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Quality Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                  {t("download.quality") || "Quality"}
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {qualities.map((quality) => (
                    <button
                      key={quality}
                      onClick={() => handleQualityChange(quality)}
                      disabled={loading}
                      className={`px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                        selectedQuality === quality
                          ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-[1.02]"
                      } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                    >
                      {quality}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading State with Skeleton */}
              {loading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                    <p className="text-gray-600 dark:text-gray-400">{t("download.searching") || "Searching for torrents..."}</p>
                  </div>
                  {/* Skeleton Cards */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700/30 animate-pulse-shimmer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                        </div>
                        <div className="h-7 w-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      </div>
                      <div className="flex gap-6">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {/* Torrent Results */}
              {!loading && torrents.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("download.availableTorrents") || "Available Torrents"} ({torrents.length})
                    </label>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {selectedTorrent && (
                        <span>✨ Best option auto-selected • Click to change</span>
                      )}
                    </div>
                  </div>
                  {torrents.map((torrent, index) => (
                    <label
                      key={torrent.id}
                      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        selectedTorrent?.id === torrent.id
                          ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/30 dark:to-indigo-900/20 shadow-lg shadow-indigo-500/20 scale-[1.02]"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:scale-[1.01]"
                      }`}
                    >
                      {/* Radio Button */}
                      <input
                        type="radio"
                        name="torrent-selection"
                        checked={selectedTorrent?.id === torrent.id}
                        onChange={() => setSelectedTorrent(torrent)}
                        className="mt-1 h-5 w-5 text-indigo-600 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                      />
                      
                      <div className="flex-1">
                        {/* Auto-selected badge */}
                        {index === 0 && selectedTorrent?.id === torrent.id && (
                          <div className="inline-flex items-center gap-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold mb-2">
                            <span>⚡</span>
                            <span>RECOMMENDED</span>
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                                {torrent.title}
                              </h4>
                              {selectedTorrent?.id === torrent.id && (
                                <span className="flex-shrink-0 px-2 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded-full">
                                  ✓ {t("download.selected") || "Selected"}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {t("download.provider") || "Provider"}: {torrent.provider}
                            </p>
                          </div>
                          <span className="flex-shrink-0 px-3 py-1 bg-indigo-600 text-white text-sm font-semibold rounded-full">
                            {torrent.quality}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center text-green-500 dark:text-green-400">
                          <Users className="h-4 w-4 mr-1" />
                          <span className="font-medium">{torrent.seeders}</span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">{t("download.seeders") || "seeders"}</span>
                        </div>
                        <div className="flex items-center text-red-500 dark:text-red-400">
                          <Users className="h-4 w-4 mr-1" />
                          <span className="font-medium">{torrent.leechers}</span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">{t("download.leechers") || "leechers"}</span>
                        </div>
                        <div className="flex items-center text-blue-500 dark:text-blue-400">
                          <HardDrive className="h-4 w-4 mr-1" />
                          <span className="font-bold">{torrent.sizeFormatted}</span>
                        </div>
                        {torrent.seeders > 0 && (
                          <div className="flex items-center">
                            <Gauge className="h-4 w-4 mr-1" />
                            <span className={`font-medium ${
                              torrent.seeders > 100 ? 'text-green-400' : 
                              torrent.seeders > 50 ? 'text-yellow-400' : 
                              'text-orange-400'
                            }`}>
                              {torrent.seeders > 100 ? t("download.excellent") || "Excellent" : 
                               torrent.seeders > 50 ? t("download.good") || "Good" : 
                               t("download.slow") || "Slow"}
                            </span>
                          </div>
                        )}
                      </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {torrents.length > 0 && !loading && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30">
                {/* Selected Torrent Details */}
                {selectedTorrent && (
                  <div className="mb-4 p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Selected Download Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      {/* Full Title */}
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">Title:</span>
                        <span className="text-gray-900 dark:text-white font-semibold flex-1">{selectedTorrent.title}</span>
                      </div>
                      
                      {/* Quality Badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">Quality:</span>
                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-full border border-indigo-300 dark:border-indigo-600">
                          {selectedTorrent.quality}
                        </span>
                      </div>
                      
                      {/* File Size */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">Size:</span>
                        <span className="text-gray-900 dark:text-white font-bold">{selectedTorrent.sizeFormatted}</span>
                      </div>
                      
                      {/* Seeders/Leechers */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">Health:</span>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center text-green-600 dark:text-green-400 font-medium">
                            <Users className="h-3.5 w-3.5 mr-1" />
                            {selectedTorrent.seeders} seeders
                          </span>
                          <span className="flex items-center text-red-600 dark:text-red-400 font-medium">
                            <Users className="h-3.5 w-3.5 mr-1" />
                            {selectedTorrent.leechers} leechers
                          </span>
                        </div>
                      </div>
                      
                      {/* Download Speed Estimate */}
                      {selectedTorrent.seeders > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">Speed:</span>
                          <span className={`font-medium ${
                            selectedTorrent.seeders > 100 ? 'text-green-600 dark:text-green-400' : 
                            selectedTorrent.seeders > 50 ? 'text-yellow-600 dark:text-yellow-400' : 
                            'text-orange-600 dark:text-orange-400'
                          }`}>
                            <Gauge className="h-3.5 w-3.5 inline mr-1" />
                            {selectedTorrent.seeders > 100 ? 'Excellent (Fast download expected)' : 
                             selectedTorrent.seeders > 50 ? 'Good (Normal speed)' : 
                             'Slow (May take longer)'}
                          </span>
                        </div>
                      )}
                      
                      {/* Provider */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">Source:</span>
                        <span className="text-gray-900 dark:text-white">{selectedTorrent.provider}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedTorrent && (
                      <span>Ready to download • Review details above</span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-semibold transition-all hover:scale-[1.02]"
                    >
                      {t("common.cancel") || "Cancel"}
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={!selectedTorrent || downloading}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center shadow-lg shadow-indigo-500/30 hover:scale-[1.02] disabled:hover:scale-100 disabled:shadow-none"
                    >
                      {downloading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          {t("download.starting") || "Starting..."}
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-5 w-5" />
                          {t("download.start") || "Download"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadPanel;
