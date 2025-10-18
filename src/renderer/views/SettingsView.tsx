// src/renderer/views/SettingsView.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const SettingsView = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    downloadPath: '/Users/chilly/Downloads',
    downloadLimit: 0, // 0 for unlimited
    uploadLimit: 0, // 0 for unlimited
    telemetry: true,
  });

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

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">{t('Settings')}</h2>
      <div className="space-y-8">
        {/* Download Settings */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">{t('Downloads')}</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="downloadPath" className="block text-sm font-medium text-gray-300 mb-1">
                {t('Download Location')}
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="downloadPath"
                  name="downloadPath"
                  value={settings.downloadPath}
                  onChange={handleInputChange}
                  className="flex-grow bg-gray-700 border border-gray-600 rounded-l-md px-3 py-2 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-r-md">
                  {t('Browse')}
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
        <div className="bg-gray-800 p-6 rounded-lg">
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
