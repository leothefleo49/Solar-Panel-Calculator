import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

const FullscreenButton = () => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const platform = Capacitor.getPlatform()

  useEffect(() => {
    const checkFullscreen = () => {
      if (platform === 'web' && !window.__TAURI__) {
        setIsFullscreen(!!document.fullscreenElement)
      }
    }

    document.addEventListener('fullscreenchange', checkFullscreen)
    return () => document.removeEventListener('fullscreenchange', checkFullscreen)
  }, [platform])

  const toggleFullscreen = async () => {
    try {
      if (platform === 'web') {
        // Check if running in Tauri
        if (window.__TAURI__) {
          const { window: tauriWindow } = window.__TAURI__
          const currentWindow = tauriWindow.getCurrent()
          const isCurrentlyFullscreen = await currentWindow.isFullscreen()
          await currentWindow.setFullscreen(!isCurrentlyFullscreen)
          setIsFullscreen(!isCurrentlyFullscreen)
        } else {
          // Regular web browser
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen()
            setIsFullscreen(true)
          } else {
            await document.exitFullscreen()
            setIsFullscreen(false)
          }
        }
      }
      // Mobile platforms don't typically support programmatic fullscreen
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error)
    }
  }

  // Don't show on mobile platforms
  if (platform !== 'web') {
    return null
  }

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      className="fixed top-2 right-2 z-50 rounded-lg border border-white/10 bg-slate-900/80 p-1 text-white backdrop-blur-sm transition hover:border-accent hover:bg-slate-800/90"
      title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
    >
      {isFullscreen ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-3.5 w-3.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-3.5 w-3.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
          />
        </svg>
      )}
    </button>
  )
}

export default FullscreenButton
