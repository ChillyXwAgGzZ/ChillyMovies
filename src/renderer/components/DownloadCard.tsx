import React from "react";

export interface DownloadCardProps {
  id: string;
  title: string;
  status: string;
  progress?: {
    percent: number;
    bytesDownloaded: number;
    speed?: number;
    eta?: number;
  };
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * Reusable DownloadCard component for displaying active downloads
 * Prepared for design system integration
 */
export const DownloadCard: React.FC<DownloadCardProps> = ({
  title,
  status,
  progress,
  onPause,
  onResume,
  onCancel,
  className = "",
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds === Infinity) return "--";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className={`download-card ${className}`} role="article" aria-label={`Download: ${title}`}>
      <h3 className="download-title">{title}</h3>
      
      <div className="download-status">
        <span className={`status-badge status-${status}`}>{status}</span>
        
        {progress && (
          <>
            <div
              className="progress-bar"
              role="progressbar"
              aria-valuenow={progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="progress-fill"
                style={{ width: `${progress.percent}%` }}
              />
              <span className="progress-text">{progress.percent.toFixed(1)}%</span>
            </div>
            
            <div className="progress-details">
              <span>{formatBytes(progress.bytesDownloaded)} downloaded</span>
              {progress.speed && <span> • {formatBytes(progress.speed)}/s</span>}
              {progress.eta && <span> • ETA: {formatTime(progress.eta)}</span>}
            </div>
          </>
        )}
      </div>
      
      <div className="download-actions">
        {status === "active" && onPause && (
          <button onClick={onPause} aria-label={`Pause ${title}`}>
            Pause
          </button>
        )}
        {status === "paused" && onResume && (
          <button onClick={onResume} aria-label={`Resume ${title}`}>
            Resume
          </button>
        )}
        {onCancel && (
          <button onClick={onCancel} className="btn-danger" aria-label={`Cancel ${title}`}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
