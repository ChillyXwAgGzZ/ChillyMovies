import React from "react";
import { Button } from "./Button";

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
 * Cinematic TorrentCard Component
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
  const healthScore = seeders / (seeders + leechers || 1);
  const healthColor =
    healthScore > 0.7
      ? "text-green-400"
      : healthScore > 0.4
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <div className={`group relative bg-cinema-dark hover:bg-cinema-darker border border-white border-opacity-5 hover:border-opacity-10 rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:shadow-neon-cyan hover:shadow-opacity-10 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="text-sm font-medium text-white line-clamp-2 flex-1">
          {title}
        </h4>
        {quality && (
          <span className="px-2 py-1 bg-neon-blue bg-opacity-20 text-neon-blue text-xs font-bold rounded-md shrink-0">
            {quality}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
          </svg>
          <span className={`text-sm font-semibold ${healthColor}`}>{seeders}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-gray-400">{leechers}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-xs font-medium text-gray-400">{sizeFormatted}</span>
        </div>

        <span className="px-2 py-0.5 bg-cinema-gray bg-opacity-30 text-gray-400 text-xs rounded-md">
          {provider}
        </span>
      </div>

      {/* Action */}
      <Button
        variant={isUnavailable ? "secondary" : "neon"}
        size="sm"
        onClick={onDownload}
        disabled={isUnavailable}
        className="w-full"
        aria-label={`Download ${title}`}
      >
        {isUnavailable ? "⚠️ No Seeders" : "Download"}
      </Button>
    </div>
  );
};
