import React from "react";
import { useTranslation } from "react-i18next";

interface Download {
  id: string;
  title: string;
  status: string;
  progress?: { percent: number; bytesDownloaded: number; speed?: number; eta?: number };
}

interface ProgressEvent {
  event: "progress" | "started" | "completed" | "error";
  progress?: { percent: number; bytesDownloaded: number; speed?: number; eta?: number };
  job?: any;
  error?: string;
}

function DownloadsView() {
  const { t } = useTranslation();
  const [downloads, setDownloads] = React.useState<Download[]>([]);
  const [backendPort, setBackendPort] = React.useState<number | null>(null);
  const eventSourcesRef = React.useRef<Map<string, EventSource>>(new Map());

  // Get backend port on mount
  React.useEffect(() => {
    window.electronAPI.getBackendPort().then(port => {
      setBackendPort(port);
      console.log("Backend API running on port:", port);
    }).catch(err => {
      console.error("Failed to get backend port:", err);
    });

    // Cleanup EventSources on unmount
    return () => {
      eventSourcesRef.current.forEach(es => es.close());
      eventSourcesRef.current.clear();
    };
  }, []);

  // Subscribe to SSE for a download
  const subscribeToDownload = React.useCallback((downloadId: string) => {
    if (!backendPort || eventSourcesRef.current.has(downloadId)) {
      return; // Already subscribed or port not ready
    }

    const eventSource = new EventSource(`http://localhost:${backendPort}/events/${downloadId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data: ProgressEvent = JSON.parse(event.data);
        
        setDownloads(prev => {
          const index = prev.findIndex(d => d.id === downloadId);
          if (index === -1) return prev;
          
          const updated = [...prev];
          
          if (data.event === "progress" && data.progress) {
            updated[index] = {
              ...updated[index],
              progress: data.progress,
            };
          } else if (data.event === "started" && data.job) {
            updated[index] = {
              ...updated[index],
              status: "active",
            };
          } else if (data.event === "completed") {
            updated[index] = {
              ...updated[index],
              status: "completed",
              progress: { percent: 100, bytesDownloaded: updated[index].progress?.bytesDownloaded || 0 },
            };
            // Close EventSource for completed downloads
            const es = eventSourcesRef.current.get(downloadId);
            if (es) {
              es.close();
              eventSourcesRef.current.delete(downloadId);
            }
          } else if (data.event === "error") {
            updated[index] = {
              ...updated[index],
              status: "failed",
            };
          }
          
          return updated;
        });
      } catch (err) {
        console.error("Failed to parse SSE event:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error for download:", downloadId, err);
      // Don't close immediately - browser will auto-reconnect
    };

    eventSourcesRef.current.set(downloadId, eventSource);
  }, [backendPort]);

  // Subscribe to all active downloads when backend port is ready
  React.useEffect(() => {
    if (backendPort) {
      downloads.forEach(download => {
        if (download.status === "active" || download.status === "queued") {
          subscribeToDownload(download.id);
        }
      });
    }
  }, [backendPort, downloads, subscribeToDownload]);

  const handlePause = async (id: string) => {
    try {
      await window.electronAPI.download.pause(id);
      // Refresh downloads list
      // TODO: Implement real-time updates via EventSource
    } catch (err) {
      console.error("Failed to pause download:", err);
    }
  };

  const handleResume = async (id: string) => {
    try {
      await window.electronAPI.download.resume(id);
    } catch (err) {
      console.error("Failed to resume download:", err);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await window.electronAPI.download.cancel(id);
      setDownloads((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Failed to cancel download:", err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds === Infinity) return '--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const renderDownloadCard = (download: Download) => (
    <div key={download.id} className="download-card" role="article" aria-label={`Download: ${download.title}`}>
      <h3>{download.title}</h3>
      <div className="download-status">
        <span className={`status-badge status-${download.status}`}>
          {t(`downloads.${download.status}`) || download.status}
        </span>
        {download.progress && (
          <>
            <div className="progress-bar" role="progressbar" aria-valuenow={download.progress.percent} aria-valuemin={0} aria-valuemax={100}>
              <div 
                className="progress-fill" 
                style={{ width: `${download.progress.percent}%` }}
              />
              <span className="progress-text">{download.progress.percent.toFixed(1)}%</span>
            </div>
            <div className="progress-details">
              <span>{formatBytes(download.progress.bytesDownloaded)} downloaded</span>
              {download.progress.speed && (
                <span> • {formatBytes(download.progress.speed)}/s</span>
              )}
              {download.progress.eta && (
                <span> • ETA: {formatTime(download.progress.eta)}</span>
              )}
            </div>
          </>
        )}
      </div>
      <div className="download-actions">
        {download.status === "active" && (
          <button onClick={() => handlePause(download.id)} aria-label={`Pause ${download.title}`}>
            {t("download.pause")}
          </button>
        )}
        {download.status === "paused" && (
          <button onClick={() => handleResume(download.id)} aria-label={`Resume ${download.title}`}>
            {t("download.resume")}
          </button>
        )}
        <button onClick={() => handleCancel(download.id)} className="btn-danger" aria-label={`Cancel ${download.title}`}>
          {t("download.cancel")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="view downloads-view">
      <h2>{t("downloads.title")}</h2>
      
      {downloads.length > 0 ? (
        <div className="downloads-list" role="region" aria-label="Active downloads">
          {downloads.map(renderDownloadCard)}
        </div>
      ) : (
        <div className="empty-state">
          <p>{t("downloads.empty")}</p>
        </div>
      )}
    </div>
  );
}

export default DownloadsView;
