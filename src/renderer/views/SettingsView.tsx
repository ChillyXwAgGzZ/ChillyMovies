// src/renderer/views/SettingsView.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, FolderOpen } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';

const SettingsView = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    downloadPath: '/Users/chilly/Downloads',
    downloadLimit: 0, // 0 for unlimited
    uploadLimit: 0, // 0 for unlimited
    telemetry: true,
  });
  const [isSelectingPath, setIsSelectingPath] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLimitChange = (name: 'downloadLimit' | 'uploadLimit', value: string) => {
    setSettings(prev => ({
      ...prev,
      [name]: parseInt(value, 10) || 0,
    }));
  };

  const handleBrowseDirectory = async () => {
    // Check if running in Electron
    if (!window.electronAPI) {
      showToast({
        type: 'warning',
        title: t('settings.electronRequired') || 'Feature Not Available',
        message: t('settings.electronRequiredMessage') || 'This feature requires the desktop app. In development mode, you can manually enter the path.',
        duration: 4000,
      });
      return;
    }

    try {
      setIsSelectingPath(true);
      const selectedPath = await window.electronAPI.dialog.selectDirectory();
      
      if (selectedPath) {
        setSettings(prev => ({
          ...prev,
          downloadPath: selectedPath,
        }));
        showToast({
          type: 'success',
          title: t('settings.pathUpdated') || 'Path Updated',
          message: `Download location set to: ${selectedPath}`,
          duration: 3000,
        });
      }
    } catch (err) {
      console.error('Failed to select directory:', err);
      showToast({
        type: 'error',
        title: t('settings.pathError') || 'Selection Failed',
        message: t('settings.pathErrorMessage') || 'Failed to select directory. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsSelectingPath(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white dark:text-white mb-6">{t('Settings')}</h2>
      <div className="space-y-8">
        {/* Appearance Settings */}
        <div className="bg-gray-800 dark:bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">{t('Appearance')}</h3>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {t('Theme')}
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                  theme === 'light'
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-700/30'
                }`}
              >
                <Sun className={`h-6 w-6 ${theme === 'light' ? 'text-indigo-400' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${theme === 'light' ? 'text-white' : 'text-gray-400'}`}>
                  {t('Light')}
                </span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-700/30'
                }`}
              >
                <Moon className={`h-6 w-6 ${theme === 'dark' ? 'text-indigo-400' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-400'}`}>
                  {t('Dark')}
                </span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                  theme === 'system'
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-700/30'
                }`}
              >
                <Monitor className={`h-6 w-6 ${theme === 'system' ? 'text-indigo-400' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${theme === 'system' ? 'text-white' : 'text-gray-400'}`}>
                  {t('System')}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Download Settings */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">{t('Downloads')}</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="downloadPath" className="block text-sm font-medium text-gray-300 mb-1">
                {t('Download Location')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="downloadPath"
                  name="downloadPath"
                  value={settings.downloadPath}
                  onChange={handleInputChange}
                  className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button 
                  onClick={handleBrowseDirectory}
                  disabled={isSelectingPath}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md flex items-center gap-2 transition"
                >
                  {isSelectingPath ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {t('settings.selecting') || 'Selecting...'}
                    </>
                  ) : (
                    <>
                      <FolderOpen className="h-4 w-4" />
                      {t('Browse')}
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="downloadLimit" className="block text-sm font-medium text-gray-300 mb-1">
                  {t('Download Speed Limit (KB/s)')}
                </label>
                <input
                  type="number"
                  id="downloadLimit"
                  name="downloadLimit"
                  value={settings.downloadLimit}
                  onChange={(e) => handleLimitChange('downloadLimit', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="0 for unlimited"
                />
              </div>
              <div>
                <label htmlFor="uploadLimit" className="block text-sm font-medium text-gray-300 mb-1">
                  {t('Upload Speed Limit (KB/s)')}
                </label>
                <input
                  type="number"
                  id="uploadLimit"
                  name="uploadLimit"
                  value={settings.uploadLimit}
                  onChange={(e) => handleLimitChange('uploadLimit', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="0 for unlimited"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">{t('Privacy')}</h3>
          <div className="flex items-center">
            <input
              id="telemetry"
              name="telemetry"
              type="checkbox"
              checked={settings.telemetry}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="telemetry" className="ml-3 block text-sm font-medium text-gray-300">
              {t('Enable anonymous usage statistics')}
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {t('Help us improve ChillyMovies by sending anonymous usage data. We will never collect personal information.')}
          </p>
        </div>

        <div className="flex justify-end">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">
            {t('Save Settings')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
