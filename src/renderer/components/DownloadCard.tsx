import React from "react";
import { Button } from "./Button";
import { ProgressBar } from "./ProgressBar";

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
 * Cinematic DownloadCard Component with Progress Animations
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

  const statusConfig: Record<string, { color: string; label: string; icon: JSX.Element }> = {
    active: {
      color: "text-neon-cyan",
      label: "Downloading",
      icon: (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ),
    },
    paused: {
      color: "text-yellow-400",
      label: "Paused",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    completed: {
      color: "text-green-400",
      label: "Completed",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    error: {
      color: "text-red-400",
      label: "Error",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const config = statusConfig[status] || statusConfig.active;

  return (
    <div className={`relative bg-cinema-dark border border-white border-opacity-5 rounded-lg p-5 hover:border-opacity-10 transition-all duration-300 ${className}`} role="article" aria-label={`Download: ${title}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-medium text-white line-clamp-1 flex-1">
          {title}
        </h3>
        <div className={`flex items-center gap-1.5 ${config.color} shrink-0`}>
          {config.icon}
          <span className="text-sm font-semibold">{config.label}</span>
        </div>
      </div>

      {/* Progress */}
      {progress && (
        <>
          <ProgressBar
            percent={progress.percent}
            variant={
              status === "error"
                ? "danger"
                : status === "completed"
                ? "success"
                : "primary"
            }
            size="md"
            showLabel={true}
            className="mb-3"
          />

          {/* Info */}
          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
            <div className="flex items-center gap-1.5">
              <span>{formatBytes(progress.bytesDownloaded)} downloaded</span>
            </div>
            <div className="flex items-center gap-3">
              {progress.speed && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>{formatBytes(progress.speed)}/s</span>
                </div>
              )}
              {progress.eta && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>ETA: {formatTime(progress.eta)}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {status === "active" && onPause && (
          <Button variant="secondary" size="sm" onClick={onPause} aria-label={`Pause ${title}`}>
            Pause
          </Button>
        )}
        {status === "paused" && onResume && (
          <Button variant="neon" size="sm" onClick={onResume} aria-label={`Resume ${title}`}>
            Resume
          </Button>
        )}
        {onCancel && (
          <Button variant="danger" size="sm" onClick={onCancel} aria-label={`Cancel ${title}`}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};
