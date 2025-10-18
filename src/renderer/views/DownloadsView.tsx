// src/renderer/views/DownloadsView.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DownloadCloud, Pause, Play, X, CheckCircle, AlertTriangle } from 'lucide-react';

interface DownloadItem {
  id: string;
  title: string;
  status: 'downloading' | 'paused' | 'completed' | 'error';
  progress: number;
  speed?: string;
  eta?: string;
}

const mockDownloads: DownloadItem[] = [
  { id: '1', title: 'Inception.2010.1080p.BluRay.x264.YIFY.mp4', status: 'downloading', progress: 65, speed: '1.2 MB/s', eta: '3m 45s' },
  { id: '2', title: 'The.Matrix.1999.1080p.BluRay.x264.YIFY.mp4', status: 'paused', progress: 30 },
  { id: '3', title: 'Interstellar.2014.1080p.BluRay.x264.YIFY.mp4', status: 'completed', progress: 100 },
  { id: '4', title: 'Parasite.2019.1080p.BluRay.x264.YIFY.mp4', status: 'error', progress: 80 },
];

const DownloadsView = () => {
  const { t } = useTranslation();
  const [downloads, setDownloads] = React.useState(mockDownloads);

  const getStatusIcon = (status: DownloadItem['status']) => {
    switch (status) {
      case 'downloading':
        return <DownloadCloud className="text-blue-400" />;
      case 'paused':
        return <Pause className="text-yellow-400" />;
      case 'completed':
        return <CheckCircle className="text-green-400" />;
      case 'error':
        return <AlertTriangle className="text-red-400" />;
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">{t('Downloads')}</h2>
      <div className="bg-gray-800 rounded-lg shadow-lg">
        <ul className="divide-y divide-gray-700">
          {downloads.map((item) => (
            <li key={item.id} className="p-4 flex items-center">
              <div className="mr-4">{getStatusIcon(item.status)}</div>
              <div className="flex-1">
                <p className="text-white font-medium">{item.title}</p>
                <div className="flex items-center mt-1">
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        item.status === 'error' ? 'bg-red-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-400 ml-3">{item.progress}%</span>
                </div>
                {item.status === 'downloading' && (
                  <div className="text-xs text-gray-400 mt-1">
                    <span>{item.speed}</span> - <span>{item.eta} remaining</span>
                  </div>
                )}
              </div>
              <div className="ml-4 flex items-center space-x-2">
                {item.status === 'downloading' && (
                  <button className="p-2 text-gray-400 hover:text-white">
                    <Pause size={18} />
                  </button>
                )}
                {item.status === 'paused' && (
                  <button className="p-2 text-gray-400 hover:text-white">
                    <Play size={18} />
                  </button>
                )}
                <button className="p-2 text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DownloadsView;
