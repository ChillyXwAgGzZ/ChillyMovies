import React from "react";
import { useTranslation } from "react-i18next";
import { DownloadCard, EmptyState } from "../components";

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
      // Fallback to default port
      setBackendPort(3000);
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
      if (window.electronAPI) {
        await window.electronAPI.download.pause(id);
      } else {
        // Direct API call if not in Electron
        const response = await fetch(`http://localhost:${backendPort}/download/pause`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (!response.ok) throw new Error('Failed to pause');
      }
      // Refresh downloads list
      // TODO: Implement real-time updates via EventSource
    } catch (err) {
      console.error("Failed to pause download:", err);
    }
  };

  const handleResume = async (id: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.download.resume(id);
      } else {
        const response = await fetch(`http://localhost:${backendPort}/download/resume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (!response.ok) throw new Error('Failed to resume');
      }
    } catch (err) {
      console.error("Failed to resume download:", err);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.download.cancel(id);
      } else {
        const response = await fetch(`http://localhost:${backendPort}/download/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (!response.ok) throw new Error('Failed to cancel');
      }
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
    <DownloadCard
      key={download.id}
      id={download.id}
      title={download.title}
      status={download.status}
      progress={download.progress}
      onPause={() => handlePause(download.id)}
      onResume={() => handleResume(download.id)}
      onCancel={() => handleCancel(download.id)}
    />
  );

  return (
    <div className="view downloads-view">
      <h2>{t("downloads.title")}</h2>
      
      {downloads.length > 0 ? (
        <div className="downloads-list" role="region" aria-label="Active downloads">
          {downloads.map(renderDownloadCard)}
        </div>
      ) : (
        <EmptyState description={t("downloads.empty")} />
      )}
    </div>
  );
}

export default DownloadsView;
