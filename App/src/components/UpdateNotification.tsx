/**
 * Update Notification Component
 * Shows a notification when a new version is available
 */

import { useState, useEffect } from 'react';
import { checkForUpdates, installUpdate, openDownloadPage, type UpdateInfo } from '../utils/updater';

export default function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Listen for update-available events
    const handleUpdateAvailable = (event: Event) => {
      const customEvent = event as CustomEvent<UpdateInfo>;
      setUpdateInfo(customEvent.detail);
      setIsDismissed(false);
    };

    window.addEventListener('update-available', handleUpdateAvailable);

    // Check for updates on mount
    checkForUpdates().then((info) => {
      if (info.available) {
        setUpdateInfo(info);
      }
    });

    return () => {
      window.removeEventListener('update-available', handleUpdateAvailable);
    };
  }, []);

  const handleInstall = async () => {
    if (!updateInfo) return;

    try {
      setIsInstalling(true);

      if (updateInfo.platform === 'desktop') {
        // Desktop: Tauri will handle download and install
        await installUpdate();
        // App will restart automatically
      } else {
        // Android/Web: Open download page
        await openDownloadPage(updateInfo.downloadUrl);
        setIsDismissed(true);
      }
    } catch (error) {
      console.error('Failed to install update:', error);
      alert('Failed to install update. Please try downloading manually.');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleRemindLater = () => {
    setIsDismissed(true);
    // Will check again on next startup or periodic check
  };

  if (!updateInfo?.available || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 rounded-lg shadow-2xl shadow-blue-500/20 p-6 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            Update Available
          </h3>
          <p className="text-sm text-slate-300 mb-2">
            Version {updateInfo.latestVersion} is now available (current: {updateInfo.currentVersion})
          </p>

          {updateInfo.releaseNotes && (
            <details className="text-xs text-slate-400 mb-3 cursor-pointer">
              <summary className="hover:text-slate-300">Release Notes</summary>
              <div className="mt-2 pl-3 border-l-2 border-slate-700 max-h-32 overflow-y-auto">
                {updateInfo.releaseNotes.split('\n').slice(0, 5).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </details>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
            >
              {isInstalling ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Installing...
                </span>
              ) : updateInfo.platform === 'desktop' ? (
                'Install & Restart'
              ) : (
                'Download Update'
              )}
            </button>

            <button
              onClick={handleRemindLater}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded transition-colors"
            >
              Remind Later
            </button>

            <button
              onClick={handleDismiss}
              className="px-2 py-2 text-slate-400 hover:text-slate-300 transition-colors"
              title="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
