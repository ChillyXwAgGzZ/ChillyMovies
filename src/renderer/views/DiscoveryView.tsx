import React from "react";
import { useTranslation } from "react-i18next";

interface MediaResult {
  id: number;
  title: string;
  overview?: string;
  year?: number;
  poster?: string;
  mediaType?: "movie" | "tv";
  voteAverage?: number;
}

function DiscoveryView() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [results, setResults] = React.useState<MediaResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [backendPort, setBackendPort] = React.useState<number | null>(null);

  // Get backend port on mount
  React.useEffect(() => {
    window.electronAPI.getBackendPort().then(port => {
      setBackendPort(port);
      console.log("Backend API running on port:", port);
    }).catch(err => {
      console.error("Failed to get backend port:", err);
      setError("Failed to connect to backend API");
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
      const response = await fetch(`http://localhost:${backendPort}/metadata/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setResults(data.data);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err: any) {
      console.error("Search failed:", err);
      setError(err.message || "Failed to search. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (item: MediaResult) => {
    try {
      // TODO: Implement download flow
      console.log("Starting download for:", item.title);
      alert(`Download feature coming soon! Selected: ${item.title}`);
    } catch (err) {
      console.error("Failed to start download:", err);
    }
  };

  return (
    <div className="view discovery-view">
      <h2>{t("discovery.title")}</h2>
      
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSearch} className="search-form" role="search">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("discovery.search")}
          className="search-input"
          aria-label={t("discovery.search")}
        />
        <button type="submit" className="search-button" disabled={loading || !backendPort}>
          {loading ? t("discovery.loading") : "Search"}
        </button>
      </form>

      <div className="results-grid" role="region" aria-label="Search results">
        {results.length > 0 ? (
          results.map((item) => (
            <div key={item.id} className="result-card">
              {item.poster && (
                <img 
                  src={item.poster} 
                  alt={`${item.title} poster`}
                  className="result-poster"
                  loading="lazy"
                />
              )}
              <div className="result-info">
                <h3>{item.title}</h3>
                {item.year && <p className="result-year">{item.year}</p>}
                {item.mediaType && (
                  <span className="media-type-badge">{item.mediaType === "movie" ? "Movie" : "TV Show"}</span>
                )}
                {item.overview && <p className="result-overview">{item.overview.slice(0, 150)}...</p>}
                {item.voteAverage !== undefined && (
                  <p className="result-rating">⭐ {item.voteAverage.toFixed(1)}/10</p>
                )}
                <button 
                  className="btn-primary" 
                  onClick={() => handleDownload(item)}
                  aria-label={`Download ${item.title}`}
                >
                  {t("download.start")}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">
            {searchQuery ? "No results found. Try a different search." : "Search for movies and TV shows to get started"}
          </p>
        )}
      </div>
    </div>
  );
}

export default DiscoveryView;
