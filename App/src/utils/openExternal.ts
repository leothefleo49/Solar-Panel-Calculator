import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { open } from '@tauri-apps/plugin-shell'

/**
 * Opens a URL in the appropriate way depending on the platform:
 * - Web: Opens in a new tab
 * - Mobile (iOS/Android): Opens in Capacitor Browser
 * - Desktop (Tauri): Opens in the system browser via shell plugin
 */
export const openExternalUrl = async (url: string): Promise<void> => {
  try {
    const platform = Capacitor.getPlatform()
    
    if (platform === 'web') {
      const isTauri = !!(window.__TAURI__)
      if (isTauri) {
        // Use Tauri v2 shell plugin - opens in system default browser
        try {
          await open(url)
          console.log('Opened URL in system browser:', url)
          return
        } catch (err) {
          console.error('Tauri shell plugin failed:', err)
          // Fallback to window.open
        }
      }
      // Fallback for regular web
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      // iOS or Android - use Capacitor Browser (in-app overlay)
      await Browser.open({ url, windowName: '_blank', toolbarColor: '#0ea5e9' })
    }
  } catch (error) {
    console.error('Failed to open external URL:', error)
    // Final fallback
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
