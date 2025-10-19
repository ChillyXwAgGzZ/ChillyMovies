import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

interface VideoPlayerProps {
  mediaId: string;
  title: string;
  filePath?: string;
  onClose: () => void;
}

/**
 * Simple video player stub for ChillyMovies
 * Full implementation will be added after packaging when file access is properly configured
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({ mediaId, title, filePath, onClose }) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div>
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <p className="text-gray-400 text-sm">{t("library.playing") || "Now Playing"}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition"
          aria-label="Close player"
        >
          <X className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Video Container - Stub */}
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center max-w-md px-8">
          <div className="mb-6 flex justify-center">
            <div className="p-6 bg-indigo-600/20 rounded-full">
              <Play className="h-16 w-16 text-indigo-400" />
            </div>
          </div>
          <h3 className="text-white text-2xl font-bold mb-4">
            Video Player Coming Soon
          </h3>
          <p className="text-gray-400 mb-4">
            The video player will be fully functional after packaging the application.
            Currently in development mode, file access is limited.
          </p>
          {filePath && (
            <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
              <p className="text-gray-500 text-xs mb-1">File Location:</p>
              <p className="text-gray-300 text-sm font-mono break-all">{filePath}</p>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition"
            >
              {t("common.close") || "Close"}
            </button>
            <button
              onClick={() => {
                if (filePath) {
                  // In production, this would use Electron's shell.openPath
                  alert(`File path: ${filePath}\n\nUse this path to open the file externally.`);
                }
              }}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
              disabled={!filePath}
            >
              Open Externally
            </button>
          </div>
        </div>
      </div>

      {/* Controls - Stub */}
      <div className="p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="bg-gray-700 rounded-full h-1.5">
              <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '0%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0:00</span>
              <span>0:00</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-3 hover:bg-white/10 rounded-full transition"
                aria-label={isPlaying ? "Pause" : "Play"}
                disabled
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 text-white opacity-50" />
                ) : (
                  <Play className="h-6 w-6 text-white opacity-50" />
                )}
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-white/10 rounded-full transition"
                aria-label={isMuted ? "Unmute" : "Mute"}
                disabled
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5 text-white opacity-50" />
                ) : (
                  <Volume2 className="h-5 w-5 text-white opacity-50" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="p-2 hover:bg-white/10 rounded-full transition"
                aria-label="Settings"
                disabled
              >
                <Settings className="h-5 w-5 text-white opacity-50" />
              </button>
              <button
                className="p-2 hover:bg-white/10 rounded-full transition"
                aria-label="Fullscreen"
                disabled
              >
                <Maximize className="h-5 w-5 text-white opacity-50" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
