import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface TrailerInfo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  publishedAt: string;
}

interface TrailerModalProps {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  onClose: () => void;
}

export function TrailerModal({ tmdbId, mediaType, title, onClose }: TrailerModalProps) {
  const { t } = useTranslation();
  const [trailers, setTrailers] = useState<TrailerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrailer, setSelectedTrailer] = useState<TrailerInfo | null>(null);
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (offline) {
      setError(t("trailer.offlineMessage", "Trailers require an internet connection"));
      setLoading(false);
      return;
    }

    const fetchTrailers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `http://localhost:3000/metadata/${mediaType}/${tmdbId}/trailers`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch trailers: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setTrailers(data.data);
          if (data.data.length > 0) {
            setSelectedTrailer(data.data[0]); // Auto-select first trailer
          } else {
            setError(t("trailer.noTrailers", "No trailers available for this title"));
          }
        } else {
          throw new Error(data.error || "Unknown error");
        }
      } catch (err: any) {
        console.error("Failed to fetch trailers:", err);
        setError(
          err.message.includes("fetch")
            ? t("trailer.networkError", "Network error. Please check your connection.")
            : t("trailer.fetchError", "Failed to load trailers")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTrailers();
  }, [tmdbId, mediaType, offline, t]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="trailer-modal-backdrop"
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="trailer-modal-content"
        style={{
          backgroundColor: "#1a1a1a",
          borderRadius: "8px",
          padding: "1.5rem",
          maxWidth: "90vw",
          maxHeight: "90vh",
          width: "900px",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #333",
            paddingBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#fff" }}>
            {t("trailer.title", "Trailers")} - {title}
          </h2>
          <button
            onClick={onClose}
            aria-label={t("common.close", "Close")}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "0.25rem 0.5rem",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
          {loading && (
            <div style={{ textAlign: "center", color: "#ccc", padding: "2rem" }}>
              {t("common.loading", "Loading...")}
            </div>
          )}

          {error && !loading && (
            <div
              style={{
                textAlign: "center",
                color: "#ff6b6b",
                padding: "2rem",
                backgroundColor: "#2a1f1f",
                borderRadius: "4px",
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && selectedTrailer && (
            <>
              {/* Video player */}
              <div
                style={{
                  position: "relative",
                  paddingBottom: "56.25%", // 16:9 aspect ratio
                  height: 0,
                  overflow: "hidden",
                  backgroundColor: "#000",
                  borderRadius: "4px",
                }}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${selectedTrailer.key}?autoplay=1&rel=0`}
                  title={selectedTrailer.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                />
              </div>

              {/* Trailer selector */}
              {trailers.length > 1 && (
                <div>
                  <h3 style={{ fontSize: "1rem", color: "#ccc", marginBottom: "0.5rem" }}>
                    {t("trailer.selectTrailer", "Select Trailer")}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      overflowX: "auto",
                      padding: "0.5rem 0",
                    }}
                  >
                    {trailers.map((trailer) => (
                      <button
                        key={trailer.id}
                        onClick={() => setSelectedTrailer(trailer)}
                        style={{
                          padding: "0.75rem 1rem",
                          backgroundColor:
                            selectedTrailer.id === trailer.id ? "#e50914" : "#333",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          fontSize: "0.9rem",
                          transition: "background-color 0.2s",
                        }}
                        onMouseOver={(e) => {
                          if (selectedTrailer.id !== trailer.id) {
                            (e.target as HTMLElement).style.backgroundColor = "#444";
                          }
                        }}
                        onMouseOut={(e) => {
                          if (selectedTrailer.id !== trailer.id) {
                            (e.target as HTMLElement).style.backgroundColor = "#333";
                          }
                        }}
                      >
                        {trailer.official && "⭐ "}
                        {trailer.name}
                        {trailer.type === "Teaser" && " (Teaser)"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
