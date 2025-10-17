import React from "react";

export interface TorrentCardProps {
  id: string;
  title: string;
  year?: number;
  quality?: string;
  sizeFormatted: string;
  seeders: number;
  leechers: number;
  provider: string;
  onDownload: () => void;
  className?: string;
}

/**
 * Reusable TorrentCard component for displaying torrent results
 * Prepared for design system integration
 */
export const TorrentCard: React.FC<TorrentCardProps> = ({
  title,
  quality,
  sizeFormatted,
  seeders,
  leechers,
  provider,
  onDownload,
  className = "",
}) => {
  const isUnavailable = seeders === 0;

  return (
    <div className={`torrent-card ${className}`}>
      <div className="torrent-info">
        <h4 className="torrent-title">{title}</h4>
        <div className="torrent-meta">
          {quality && <span className="quality-badge">{quality}</span>}
          <span className="size-info">💾 {sizeFormatted}</span>
          <span className="seeders-info" title="Seeders">
            🌱 {seeders}
          </span>
          <span className="leechers-info" title="Leechers">
            📥 {leechers}
          </span>
          <span className="provider-badge">{provider}</span>
        </div>
      </div>
      <button
        className="btn-primary download-btn"
        onClick={onDownload}
        aria-label={`Download ${title}`}
        disabled={isUnavailable}
      >
        {isUnavailable ? "⚠️ No Seeders" : "⬇️ Download"}
      </button>
    </div>
  );
};
