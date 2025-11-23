/**
 * Auto-update utility for Solar Panel Calculator
 * Handles version checking and opening download pages across platforms
 */

import { isTauri } from '@tauri-apps/api/core';

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseNotes?: string;
  downloadUrl?: string;
  platform: 'desktop' | 'android' | 'web';
}

interface UpdateReminderState {
  dismissedVersion?: string;
  dismissCount: number;
  lastDismissedAt?: number;
}

const REMINDER_KEY = 'update-reminder-state';
const LAUNCHES_UNTIL_REMIND = 3;

/**
 * Get reminder state from localStorage
 */
function getReminderState(): UpdateReminderState {
  try {
    const stored = localStorage.getItem(REMINDER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load reminder state:', e);
  }
  return { dismissCount: 0 };
}

/**
 * Save reminder state to localStorage
 */
function saveReminderState(state: UpdateReminderState): void {
  try {
    localStorage.setItem(REMINDER_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save reminder state:', e);
  }
}

/**
 * Check if we should show reminder for this version
 */
export function shouldShowUpdateReminder(version: string): boolean {
  const state = getReminderState();
  
  // New version? Always show
  if (state.dismissedVersion !== version) {
    return true;
  }
  
  // Same version dismissed: check launch count
  return state.dismissCount >= LAUNCHES_UNTIL_REMIND;
}

/**
 * Record that user dismissed the update notification
 */
export function dismissUpdateReminder(version: string): void {
  const state = getReminderState();
  
  if (state.dismissedVersion === version) {
    // Increment counter - will remind after 3 more launches
    saveReminderState({
      dismissedVersion: version,
      dismissCount: 0,
      lastDismissedAt: Date.now(),
    });
  } else {
    // First dismissal for this version
    saveReminderState({
      dismissedVersion: version,
      dismissCount: 0,
      lastDismissedAt: Date.now(),
    });
  }
}

/**
 * Increment launch counter for reminder system
 */
export function incrementLaunchCounter(): void {
  const state = getReminderState();
  if (state.dismissedVersion) {
    saveReminderState({
      ...state,
      dismissCount: state.dismissCount + 1,
    });
  }
}

/**
 * Clear reminder state when update is installed
 */
export function clearUpdateReminder(): void {
  try {
    localStorage.removeItem(REMINDER_KEY);
  } catch (e) {
    console.warn('Failed to clear reminder state:', e);
  }
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

  // Check GitHub releases API for all platforms
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

    // Use evergreen /releases/latest/download URLs
    let downloadUrl: string;
    if (platform === 'android') {
      // Evergreen URL - always points to latest APK
      downloadUrl = 'https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest/download/Solar-Panel-Calculator-Android.apk';
    } else if (platform === 'desktop') {
      // Desktop: point to releases page where users can pick their platform
      downloadUrl = 'https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest';
    } else {
      downloadUrl = 'https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest';
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
 * Download and install update (all platforms open download page)
 */
export async function installUpdate(): Promise<void> {
  // For simplicity, all platforms open the download page
  const updateInfo = await checkForUpdates();
  if (updateInfo.downloadUrl) {
    await openDownloadPage(updateInfo.downloadUrl);
  } else {
    await openDownloadPage();
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
  // Increment launch counter for reminder system
  incrementLaunchCounter();
  
  // Check on startup immediately
  const updateInfo = await checkForUpdates();
  
  if (updateInfo.available && updateInfo.latestVersion) {
    // Check if we should show reminder based on dismissal history
    if (shouldShowUpdateReminder(updateInfo.latestVersion)) {
      console.log('Update available:', updateInfo.latestVersion);
      // The update notification component will handle UI
      window.dispatchEvent(new CustomEvent('update-available', { detail: updateInfo }));
    } else {
      console.log('Update available but reminder suppressed (dismissed recently)');
    }
  }

  // Check periodically
  setInterval(async () => {
    const info = await checkForUpdates();
    if (info.available && info.latestVersion && shouldShowUpdateReminder(info.latestVersion)) {
      window.dispatchEvent(new CustomEvent('update-available', { detail: info }));
    }
  }, intervalMinutes * 60 * 1000);
}
