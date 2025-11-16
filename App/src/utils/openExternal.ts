import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

/**
 * Opens a URL in the appropriate way depending on the platform:
 * - Web: Opens in a new tab
 * - Mobile (iOS/Android): Opens in Capacitor Browser
 * - Desktop (Tauri): Opens in the system browser
 */
export const openExternalUrl = async (url: string): Promise<void> => {
  try {
    const platform = Capacitor.getPlatform()
    
    if (platform === 'web') {
      // Check if running in Tauri
      if (window.__TAURI__) {
        // Use Tauri shell to open URL
        const { shell } = window.__TAURI__
        await shell.open(url)
      } else {
        // Regular web browser
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } else {
      // iOS or Android - use Capacitor Browser
      await Browser.open({ url })
    }
  } catch (error) {
    console.error('Failed to open external URL:', error)
    // Fallback to window.open
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

// Type augmentation for Tauri
declare global {
  interface Window {
    __TAURI__?: {
      window: {
        getCurrent: () => {
          isFullscreen: () => Promise<boolean>
          setFullscreen: (fullscreen: boolean) => Promise<void>
        }
      }
      shell: {
        open: (url: string) => Promise<void>
      }
    }
  }
}
