import React from "react";

export interface MovieCardProps {
  id: number | string;
  title: string;
  year?: number;
  poster?: string;
  overview?: string;
  mediaType?: "movie" | "tv";
  voteAverage?: number;
  onFindTorrents?: () => void;
  onWatchTrailer?: () => void;
  className?: string;
}

/**
 * Cinematic MovieCard Component
 */
export const MovieCard: React.FC<MovieCardProps> = ({
  title,
  year,
  poster,
  overview,
  mediaType,
  voteAverage,
  onFindTorrents,
  onWatchTrailer,
  className = "",
}) => {
  return (
    <div className={`group relative cinema-card overflow-hidden ${className}`}>
      {/* Poster Image */}
      {poster && (
        <div className="aspect-[2/3] overflow-hidden">
          <img
            src={poster}
            alt={`${title} poster`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </div>
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
        <div className="space-y-2">
          {/* Title */}
          <h3 className="text-lg font-bold text-white line-clamp-2">{title}</h3>
          
          {/* Metadata */}
          <div className="flex items-center gap-3 text-sm">
            {year && <span className="text-gray-400">{year}</span>}
            {mediaType && (
              <span className="px-2 py-0.5 bg-neon-cyan bg-opacity-20 text-neon-cyan rounded text-xs font-semibold uppercase">
                {mediaType === "movie" ? "Movie" : "TV"}
              </span>
            )}
            {voteAverage !== undefined && (
              <span className="flex items-center gap-1 text-yellow-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {voteAverage.toFixed(1)}
              </span>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {onWatchTrailer && (
              <button
                onClick={onWatchTrailer}
                className="flex-1 px-3 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 backdrop-blur-sm text-white rounded-md text-sm font-medium transition-all"
              >
                🎬 Trailer
              </button>
            )}
            {onFindTorrents && (
              <button
                onClick={onFindTorrents}
                className="flex-1 px-3 py-2 bg-neon-cyan hover:bg-neon-blue text-cinema-black rounded-md text-sm font-bold transition-all"
              >
                🔍 Download
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
