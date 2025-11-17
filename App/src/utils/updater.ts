/**
 * Auto-update utility for Solar Panel Calculator
 * Handles version checking and update installation across platforms
 */

import { isTauri } from '@tauri-apps/api/core';

// Tauri updater (Desktop: Windows, macOS, Linux)
let tauriCheck: any = null;
let tauriDownloadAndInstall: any = null;

// Try to import Tauri updater plugin only if running in Tauri
if (isTauri()) {
  import('@tauri-apps/plugin-updater')
    .then((module) => {
      tauriCheck = module.check;
      tauriDownloadAndInstall = module.downloadAndInstall;
    })
    .catch((err) => {
      console.warn('Tauri updater plugin not available:', err);
    });
}

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseNotes?: string;
  downloadUrl?: string;
  platform: 'desktop' | 'android' | 'web';
}

/**
 * Get the current app version
 */
export async function getCurrentVersion(): Promise<string> {
  if (isTauri()) {
    const { getVersion } = await import('@tauri-apps/api/app');
    return await getVersion();
  }
  // For web/Android, get from package.json version
  return import.meta.env.VITE_APP_VERSION || '1.4.10';
}

/**
 * Check for updates on GitHub releases
 */
export async function checkForUpdates(): Promise<UpdateInfo> {
  const currentVersion = await getCurrentVersion();
  const platform = getPlatform();

  // For Tauri desktop apps, use built-in updater
  if (isTauri() && tauriCheck) {
    try {
      const update = await tauriCheck();
      
      if (update?.available) {
        return {
          available: true,
          currentVersion,
          latestVersion: update.version,
          releaseNotes: update.body,
          platform: 'desktop',
        };
      }
      
      return {
        available: false,
        currentVersion,
        platform: 'desktop',
      };
    } catch (error) {
      console.error('Failed to check for Tauri updates:', error);
    }
  }

  // For web/Android, check GitHub releases API
  try {
    const response = await fetch(
      'https://api.github.com/repos/leothefleo49/Solar-Panel-Calculator/releases/latest',
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const release = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, '');
    const available = compareVersions(latestVersion, currentVersion) > 0;

    // Find appropriate download URL based on platform
    let downloadUrl: string | undefined;
    if (platform === 'android') {
      const apkAsset = release.assets?.find((asset: any) =>
        asset.name.endsWith('.apk') && !asset.name.includes('Debug')
      );
      downloadUrl = apkAsset?.browser_download_url;
    }

    return {
      available,
      currentVersion,
      latestVersion,
      releaseNotes: release.body,
      downloadUrl,
      platform,
    };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return {
      available: false,
      currentVersion,
      platform,
    };
  }
}

/**
 * Download and install update (Desktop only)
 */
export async function installUpdate(): Promise<void> {
  if (!isTauri() || !tauriDownloadAndInstall) {
    throw new Error('Update installation only available on desktop platforms');
  }

  try {
    // This will download and install the update
    // On Windows/macOS, it will prompt to restart the app
    await tauriDownloadAndInstall();
  } catch (error) {
    console.error('Failed to install update:', error);
    throw error;
  }
}

/**
 * Open the download page for manual update (Android/Web)
 */
export async function openDownloadPage(url?: string): Promise<void> {
  const downloadUrl = url || 'https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest';
  
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-shell');
    await open(downloadUrl);
  } else {
    // Use Capacitor Browser for Android
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: downloadUrl });
    } catch {
      // Fallback to regular window.open
      window.open(downloadUrl, '_blank');
    }
  }
}

/**
 * Get the current platform
 */
function getPlatform(): 'desktop' | 'android' | 'web' {
  if (isTauri()) {
    return 'desktop';
  }
  
  // Check if running in Capacitor (Android)
  const isCapacitor = !!(window as any).Capacitor;
  if (isCapacitor) {
    return 'android';
  }
  
  return 'web';
}

/**
 * Compare semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  
  return 0;
}

/**
 * Set up automatic update check on app startup
 */
export async function initializeAutoUpdater(intervalMinutes = 60): Promise<void> {
  // Check on startup
  const updateInfo = await checkForUpdates();
  
  if (updateInfo.available) {
    console.log('Update available:', updateInfo.latestVersion);
    // The update notification component will handle UI
    window.dispatchEvent(new CustomEvent('update-available', { detail: updateInfo }));
  }

  // Check periodically
  setInterval(async () => {
    const info = await checkForUpdates();
    if (info.available) {
      window.dispatchEvent(new CustomEvent('update-available', { detail: info }));
    }
  }, intervalMinutes * 60 * 1000);
}
