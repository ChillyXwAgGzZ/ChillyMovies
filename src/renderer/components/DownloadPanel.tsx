import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, X, HardDrive, Users, Gauge } from "lucide-react";
import { downloadApi, torrentApi, ApiError } from "../services/api";

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
        // Auto-select the best torrent (highest seeders)
        const best = results.sort((a, b) => b.seeders - a.seeders)[0];
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
      });

      console.log("Download started:", result);
      
      if (onDownloadStarted) {
        onDownloadStarted(result.id);
      }

      // Close panel and show success
      setIsOpen(false);
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Download failed:", err);
      const friendlyMessage = err instanceof ApiError
        ? err.response?.error || err.message
        : undefined;
      setError(
        friendlyMessage || t("download.error") || "Failed to start download. Please try again."
      );
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
        className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition shadow-lg"
      >
        <Download className="mr-2 h-5 w-5" />
        {t("download.button") || "Download"}
      </button>

      {/* Download Panel Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">{t("download.selectQuality") || "Select Download Quality"}</h2>
                <p className="text-gray-400 text-sm">{title}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Quality Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3 text-gray-300">
                  {t("download.quality") || "Quality"}
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {qualities.map((quality) => (
                    <button
                      key={quality}
                      onClick={() => handleQualityChange(quality)}
                      disabled={loading}
                      className={`px-4 py-3 rounded-lg font-semibold transition ${
                        selectedQuality === quality
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {quality}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                  <p className="text-gray-400">{t("download.searching") || "Searching for torrents..."}</p>
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
                  <label className="block text-sm font-medium mb-3 text-gray-300">
                    {t("download.availableTorrents") || "Available Torrents"} ({torrents.length})
                  </label>
                  {torrents.map((torrent) => (
                    <div
                      key={torrent.id}
                      onClick={() => setSelectedTorrent(torrent)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                        selectedTorrent?.id === torrent.id
                          ? "border-indigo-500 bg-indigo-900/20"
                          : "border-gray-700 bg-gray-700/30 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1 line-clamp-1">
                            {torrent.title}
                          </h4>
                          <p className="text-xs text-gray-400 mb-2">
                            {t("download.provider") || "Provider"}: {torrent.provider}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-indigo-600 text-white text-sm font-semibold rounded-full ml-4">
                          {torrent.quality}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center text-green-400">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{torrent.seeders} {t("download.seeders") || "seeders"}</span>
                        </div>
                        <div className="flex items-center text-red-400">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{torrent.leechers} {t("download.leechers") || "leechers"}</span>
                        </div>
                        <div className="flex items-center text-gray-400">
                          <HardDrive className="h-4 w-4 mr-1" />
                          <span>{torrent.sizeFormatted}</span>
                        </div>
                        {torrent.seeders > 0 && (
                          <div className="flex items-center text-yellow-400">
                            <Gauge className="h-4 w-4 mr-1" />
                            <span>
                              {torrent.seeders > 100 ? t("download.excellent") || "Excellent" : 
                               torrent.seeders > 50 ? t("download.good") || "Good" : 
                               t("download.slow") || "Slow"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {torrents.length > 0 && !loading && (
              <div className="p-6 border-t border-gray-700 bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    {selectedTorrent && (
                      <p>
                        {t("download.selected") || "Selected"}:{" "}
                        <span className="font-semibold text-white">{selectedTorrent.title}</span>
                        {" "}({selectedTorrent.sizeFormatted})
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
                    >
                      {t("common.cancel") || "Cancel"}
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={!selectedTorrent || downloading}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition flex items-center"
                    >
                      {downloading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          {t("download.starting") || "Starting..."}
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-5 w-5" />
                          {t("download.start") || "Start Download"}
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
