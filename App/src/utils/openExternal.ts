import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

// Lazy dynamic import for Tauri shell (ESM-friendly)
let tauriShellOpen: ((url: string) => Promise<void>) | null = null
const loadTauriShell = async (): Promise<void> => {
  if (tauriShellOpen) return
  try {
    const api = await import('@tauri-apps/api')
    const maybeShell = (api as any).shell
    if (maybeShell?.open) tauriShellOpen = maybeShell.open
  } catch {
    // Tauri API not available (non-desktop build)
  }
}

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
      const isTauri = !!(window.__TAURI__ || navigator.userAgent.includes('Tauri'))
      if (isTauri) {
        await loadTauriShell()
        if (tauriShellOpen) {
          await tauriShellOpen(url)
          return
        }
        if (window.__TAURI__?.shell?.open) {
          await window.__TAURI__.shell.open(url)
          return
        }
      }
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      // iOS or Android - use Capacitor Browser (in-app overlay) with consistent options
      await Browser.open({ url, windowName: '_blank', toolbarColor: '#0ea5e9' })
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
