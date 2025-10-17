import React from "react";
import { useTranslation } from "react-i18next";
import { TrailerModal } from "../components/TrailerModal";
import { MovieCard, TorrentCard, SearchBar, EmptyState } from "../components";

interface MediaResult {
  id: number;
  title: string;
  overview?: string;
  year?: number;
  poster?: string;
  mediaType?: "movie" | "tv";
  voteAverage?: number;
}

interface TorrentResult {
  id: string;
  title: string;
  year?: number;
  quality?: string;
  size: number;
  sizeFormatted: string;
  seeders: number;
  leechers: number;
  magnetLink: string;
  provider: string;
  type: "movie" | "tv";
}

type SearchMode = "metadata" | "torrents";

function DiscoveryView() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [results, setResults] = React.useState<MediaResult[]>([]);
  const [torrentResults, setTorrentResults] = React.useState<TorrentResult[]>([]);
  const [searchMode, setSearchMode] = React.useState<SearchMode>("metadata");
  const [selectedItem, setSelectedItem] = React.useState<MediaResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [backendPort, setBackendPort] = React.useState<number | null>(null);
  const [trailerModalOpen, setTrailerModalOpen] = React.useState(false);
  const [trailerItem, setTrailerItem] = React.useState<MediaResult | null>(null);

  // Get backend port on mount
  React.useEffect(() => {
    // Check if running in Electron
    if (!window.electronAPI) {
      console.warn("Not running in Electron, using default backend port");
      setBackendPort(3000);
      return;
    }

    window.electronAPI.getBackendPort().then(port => {
      setBackendPort(port);
      console.log("Backend API running on port:", port);
    }).catch(err => {
      console.error("Failed to get backend port:", err);
      setError("Failed to connect to backend API");
      // Fallback to default port
      setBackendPort(3000);
    });
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (!backendPort) {
      setError("Backend API not ready");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      if (searchMode === "metadata") {
        // Search TMDB metadata
        const response = await fetch(`http://localhost:${backendPort}/metadata/search?q=${encodeURIComponent(searchQuery)}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setResults(data.data);
          setTorrentResults([]);
        } else {
          throw new Error(data.error || "Unknown error");
        }
      } else {
        // Search torrents
        const response = await fetch(
          `http://localhost:${backendPort}/torrents/search?q=${encodeURIComponent(searchQuery)}&minSeeders=5&limit=20`
        );
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success && data.data?.results) {
          setTorrentResults(data.data.results);
          setResults([]);
        } else {
          throw new Error(data.error || "Unknown error");
        }
      }
    } catch (err: any) {
      console.error("Search failed:", err);
      setError(err.message || "Failed to search. Please try again.");
      setResults([]);
      setTorrentResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFindTorrents = async (item: MediaResult) => {
    setSelectedItem(item);
    setSearchQuery(item.title + (item.year ? ` ${item.year}` : ""));
    setSearchMode("torrents");
    
    // Auto-search for torrents
    if (!backendPort) return;
    
    setLoading(true);
    setError("");
    
    try {
      const query = item.title + (item.year ? ` ${item.year}` : "");
      const response = await fetch(
        `http://localhost:${backendPort}/torrents/search?q=${encodeURIComponent(query)}&minSeeders=5&limit=20`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data?.results) {
        setTorrentResults(data.data.results);
      } else {
        throw new Error(data.error || "No torrents found");
      }
    } catch (err: any) {
      console.error("Torrent search failed:", err);
      setError(err.message || "Failed to find torrents. Please try again.");
      setTorrentResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (torrent: TorrentResult) => {
    if (!backendPort) return;
    
    try {
      const response = await fetch(`http://localhost:${backendPort}/download/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `${Date.now()}-${torrent.id}`,
          sourceType: "torrent",
          sourceUrn: torrent.magnetLink,
          title: torrent.title,
          metadata: {
            quality: torrent.quality,
            size: torrent.sizeFormatted,
            seeders: torrent.seeders,
            provider: torrent.provider,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start download: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        alert(`Download started: ${torrent.title}\nQuality: ${torrent.quality}\nSize: ${torrent.sizeFormatted}`);
        // TODO: Navigate to Downloads view
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err: any) {
      console.error("Failed to start download:", err);
      alert(`Failed to start download: ${err.message}`);
    }
  };

  const handleBackToMetadata = () => {
    setSearchMode("metadata");
    setSelectedItem(null);
    setTorrentResults([]);
  };

  const handleWatchTrailer = (item: MediaResult) => {
    setTrailerItem(item);
    setTrailerModalOpen(true);
  };

  const handleCloseTrailer = () => {
    setTrailerModalOpen(false);
    setTrailerItem(null);
  };

  return (
    <div className="view discovery-view">
      <h2>{t("discovery.title")}</h2>
      
      {/* Mode Selector */}
      <div className="mode-selector">
        <button
          className={`mode-btn ${searchMode === "metadata" ? "active" : ""}`}
          onClick={() => setSearchMode("metadata")}
          disabled={loading}
        >
          📚 Browse Catalog
        </button>
        <button
          className={`mode-btn ${searchMode === "torrents" ? "active" : ""}`}
          onClick={() => setSearchMode("torrents")}
          disabled={loading}
        >
          🔍 Search Torrents
        </button>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      
      {/* Back button when viewing torrents for a specific item */}
      {searchMode === "torrents" && selectedItem && (
        <div className="breadcrumb">
          <button onClick={handleBackToMetadata} className="back-btn">
            ← Back to {selectedItem.title}
          </button>
        </div>
      )}

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onSubmit={handleSearch}
        placeholder={searchMode === "metadata" ? t("discovery.search") : "Search torrents..."}
        isLoading={loading}
        disabled={!backendPort}
        buttonText="Search"
      />

      {/* Metadata Results */}
      {searchMode === "metadata" && (
        <div className="results-grid" role="region" aria-label="Search results">
          {results.length > 0 ? (
            results.map((item) => (
              <MovieCard
                key={item.id}
                id={item.id}
                title={item.title}
                year={item.year}
                poster={item.poster}
                overview={item.overview}
                mediaType={item.mediaType}
                voteAverage={item.voteAverage}
                onWatchTrailer={() => handleWatchTrailer(item)}
                onFindTorrents={() => handleFindTorrents(item)}
              />
            ))
          ) : (
            <EmptyState
              description={
                searchQuery
                  ? "No results found. Try a different search."
                  : "Search for movies and TV shows to get started"
              }
            />
          )}
        </div>
      )}

      {/* Torrent Results */}
      {searchMode === "torrents" && (
        <div className="torrents-list" role="region" aria-label="Torrent results">
          {torrentResults.length > 0 ? (
            <>
              <p className="results-count">Found {torrentResults.length} torrents</p>
              {torrentResults.map((torrent) => (
                <TorrentCard
                  key={torrent.id}
                  id={torrent.id}
                  title={torrent.title}
                  year={torrent.year}
                  quality={torrent.quality}
                  sizeFormatted={torrent.sizeFormatted}
                  seeders={torrent.seeders}
                  leechers={torrent.leechers}
                  provider={torrent.provider}
                  onDownload={() => handleDownload(torrent)}
                />
              ))}
            </>
          ) : (
            <EmptyState
              description={
                searchQuery
                  ? "No torrents found. Try a different search or adjust filters."
                  : "Enter a search query to find torrents"
              }
            />
          )}
        </div>
      )}
      
      {/* Trailer Modal */}
      {trailerModalOpen && trailerItem && (
        <TrailerModal
          tmdbId={typeof trailerItem.id === 'number' ? trailerItem.id : parseInt(trailerItem.id as string)}
          mediaType={trailerItem.mediaType || "movie"}
          title={trailerItem.title}
          onClose={handleCloseTrailer}
        />
      )}
    </div>
  );
}

export default DiscoveryView;
