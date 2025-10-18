import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { DownloadCloud, Pause, Play, X, CheckCircle, AlertTriangle } from "lucide-react";
import { downloadApi, createResilientEventSource } from "../services/api";

interface DownloadItem {
  id: string;
  title: string;
  status: "downloading" | "paused" | "completed" | "error" | "pending";
  progress: number;
  speed?: string;
  eta?: string;
  downloadSpeed?: number;
  uploadSpeed?: number;
  bytesDownloaded?: number;
  bytesTotal?: number;
}

interface ProgressEvent {
  event: "progress" | "started" | "completed" | "error";
  progress?: {
    percent: number;
    downloadSpeed?: number;
    uploadSpeed?: number;
    bytesDownloaded?: number;
    bytesTotal?: number;
    timeRemaining?: number;
  };
  job?: any;
  error?: string;
}

const DownloadsView = () => {
  const { t } = useTranslation();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [eventSources, setEventSources] = useState<Map<string, EventSource>>(new Map());

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Format speed
  const formatSpeed = (bytesPerSecond: number): string => {
    return formatBytes(bytesPerSecond) + "/s";
  };

  // Format time remaining
  const formatTime = (seconds: number): string => {
    if (!seconds || seconds === Infinity) return "calculating...";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Subscribe to SSE progress for a download
  const subscribeToProgress = useCallback((id: string) => {
    if (eventSources.has(id)) return; // Already subscribed

    const eventSource = createResilientEventSource(`http://localhost:3000/events/${id}`);

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressEvent = JSON.parse(event.data);

        setDownloads((prev) => {
          const index = prev.findIndex((d) => d.id === id);
          if (index === -1) return prev;

          const updated = [...prev];
          const item = { ...updated[index] };

          switch (data.event) {
            case "started":
              item.status = "downloading";
              break;

            case "progress":
              if (data.progress) {
                item.progress = Math.round(data.progress.percent * 100) / 100;
                item.status = "downloading";
                
                if (data.progress.downloadSpeed) {
                  item.speed = formatSpeed(data.progress.downloadSpeed);
                  item.downloadSpeed = data.progress.downloadSpeed;
                }
                
                if (data.progress.uploadSpeed) {
                  item.uploadSpeed = data.progress.uploadSpeed;
                }
                
                if (data.progress.bytesDownloaded) {
                  item.bytesDownloaded = data.progress.bytesDownloaded;
                }
                
                if (data.progress.bytesTotal) {
                  item.bytesTotal = data.progress.bytesTotal;
                }
                
                if (data.progress.timeRemaining) {
                  item.eta = formatTime(data.progress.timeRemaining);
                }
              }
              break;

            case "completed":
              item.status = "completed";
              item.progress = 100;
              item.speed = undefined;
              item.eta = undefined;
              // Close event source for completed download
              setTimeout(() => {
                const es = eventSources.get(id);
                if (es) {
                  es.close();
                  setEventSources((prev) => {
                    const next = new Map(prev);
                    next.delete(id);
                    return next;
                  });
                }
              }, 1000);
              break;

            case "error":
              item.status = "error";
              item.speed = undefined;
              item.eta = undefined;
              break;
          }

          updated[index] = item;
          return updated;
        });
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error(`SSE error for download ${id}:`, err);
      // Don't set error status here - let the resilient reconnection handle it
    };

    setEventSources((prev) => new Map(prev).set(id, eventSource));
  }, [eventSources]);

  // Load incomplete downloads on mount
  useEffect(() => {
    const loadDownloads = async () => {
      try {
        const incomplete = await downloadApi.getIncomplete();
        
        const items: DownloadItem[] = incomplete.map((dl: any) => ({
          id: dl.id,
          title: dl.title || dl.id,
          status: dl.status || "pending",
          progress: dl.progress?.percent || 0,
          speed: dl.progress?.downloadSpeed ? formatSpeed(dl.progress.downloadSpeed) : undefined,
          eta: dl.progress?.timeRemaining ? formatTime(dl.progress.timeRemaining) : undefined,
        }));

        setDownloads(items);

        // Subscribe to progress for each active download
        incomplete.forEach((dl: any) => {
          if (dl.status === "downloading" || dl.status === "pending") {
            subscribeToProgress(dl.id);
          }
        });
      } catch (err) {
        console.error("Failed to load downloads:", err);
      }
    };

    loadDownloads();

    // Cleanup: close all event sources on unmount
    return () => {
      eventSources.forEach((es) => es.close());
    };
  }, []);

  // Handle pause
  const handlePause = async (id: string) => {
    try {
      await downloadApi.pause(id);
      setDownloads((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "paused" as const, speed: undefined, eta: undefined } : d))
      );
    } catch (err) {
      console.error("Failed to pause download:", err);
      alert(t("downloads.actions.pauseError") || "Failed to pause download");
    }
  };

  // Handle resume
  const handleResume = async (id: string) => {
    try {
      await downloadApi.resume(id);
      setDownloads((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "downloading" as const } : d))
      );
      // Resubscribe to progress
      subscribeToProgress(id);
    } catch (err) {
      console.error("Failed to resume download:", err);
      alert(t("downloads.actions.resumeError") || "Failed to resume download");
    }
  };

  // Handle cancel
  const handleCancel = async (id: string) => {
    try {
      await downloadApi.cancel(id);
      setDownloads((prev) => prev.filter((d) => d.id !== id));
      
      // Close event source
      const es = eventSources.get(id);
      if (es) {
        es.close();
        setEventSources((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to cancel download:", err);
      alert(t("downloads.actions.cancelError") || "Failed to cancel download");
    }
  };

  const getStatusIcon = (status: DownloadItem["status"]) => {
    switch (status) {
      case "downloading":
      case "pending":
        return <DownloadCloud className="text-blue-400" />;
      case "paused":
        return <Pause className="text-yellow-400" />;
      case "completed":
        return <CheckCircle className="text-green-400" />;
      case "error":
        return <AlertTriangle className="text-red-400" />;
    }
  };

  const getStatusColor = (status: DownloadItem["status"]) => {
    switch (status) {
      case "error":
        return "bg-red-500";
      case "completed":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      default:
        return "bg-indigo-500";
    }
  };

  if (downloads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <DownloadCloud className="h-24 w-24 text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          {t("downloads.emptyStateTitle") || "No downloads yet"}
        </h2>
        <p className="text-gray-400">
          {t("downloads.emptyStateDescription") || "Start a download from Discover to see progress here."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">{t("downloads.title") || "Downloads"}</h2>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700">
        <ul className="divide-y divide-gray-700">
          {downloads.map((item) => (
            <li key={item.id} className="p-6 hover:bg-gray-800/70 transition">
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className="mt-1">{getStatusIcon(item.status)}</div>

                {/* Download Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium mb-2 truncate">{item.title}</p>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${getStatusColor(item.status)}`}
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-400 font-mono w-12 text-right">
                      {item.progress.toFixed(1)}%
                    </span>
                  </div>

                  {/* Download Stats */}
                  {item.status === "downloading" && (
                    <div className="flex gap-4 text-xs text-gray-400">
                      {item.speed && <span className="font-mono">↓ {item.speed}</span>}
                      {item.uploadSpeed && (
                        <span className="font-mono">↑ {formatSpeed(item.uploadSpeed)}</span>
                      )}
                      {item.eta && <span>{item.eta} remaining</span>}
                      {item.bytesDownloaded && item.bytesTotal && (
                        <span>
                          {formatBytes(item.bytesDownloaded)} / {formatBytes(item.bytesTotal)}
                        </span>
                      )}
                    </div>
                  )}

                  {item.status === "completed" && (
                    <p className="text-xs text-green-400">{t("downloads.status.completed") || "Completed"}</p>
                  )}

                  {item.status === "paused" && (
                    <p className="text-xs text-yellow-400">{t("downloads.status.paused") || "Paused"}</p>
                  )}

                  {item.status === "error" && (
                    <p className="text-xs text-red-400">{t("downloads.status.error") || "Download failed"}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {item.status === "downloading" && (
                    <button
                      onClick={() => handlePause(item.id)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                      title={t("downloads.actions.pause") || "Pause"}
                    >
                      <Pause size={18} />
                    </button>
                  )}
                  {item.status === "paused" && (
                    <button
                      onClick={() => handleResume(item.id)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                      title={t("downloads.actions.resume") || "Resume"}
                    >
                      <Play size={18} />
                    </button>
                  )}
                  {item.status !== "completed" && (
                    <button
                      onClick={() => handleCancel(item.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition"
                      title={t("downloads.actions.cancel") || "Cancel"}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DownloadsView;
