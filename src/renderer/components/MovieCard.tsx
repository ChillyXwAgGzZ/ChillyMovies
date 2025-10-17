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
 * Reusable MovieCard component for displaying media items
 * Prepared for design system integration
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
    <div className={`movie-card ${className}`}>
      {poster && (
        <img
          src={poster}
          alt={`${title} poster`}
          className="movie-card-poster"
          loading="lazy"
        />
      )}
      <div className="movie-card-content">
        <h3 className="movie-card-title">{title}</h3>
        
        {year && <p className="movie-card-year">{year}</p>}
        
        {mediaType && (
          <span className="movie-card-badge">
            {mediaType === "movie" ? "Movie" : "TV Show"}
          </span>
        )}
        
        {overview && (
          <p className="movie-card-overview">
            {overview.length > 150 ? `${overview.slice(0, 150)}...` : overview}
          </p>
        )}
        
        {voteAverage !== undefined && (
          <p className="movie-card-rating">
            ⭐ {voteAverage.toFixed(1)}/10
          </p>
        )}
        
        <div className="movie-card-actions">
          {onWatchTrailer && (
            <button
              className="btn-secondary"
              onClick={onWatchTrailer}
              aria-label={`Watch trailer for ${title}`}
            >
              🎬 Watch Trailer
            </button>
          )}
          {onFindTorrents && (
            <button
              className="btn-primary"
              onClick={onFindTorrents}
              aria-label={`Find torrents for ${title}`}
            >
              🔍 Find Torrents
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
