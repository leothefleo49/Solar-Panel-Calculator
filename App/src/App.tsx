import Configurator from './components/Configurator'
import Dashboard from './components/Dashboard'
import ChatAssistant from './components/ChatAssistant'
import FullscreenButton from './components/FullscreenButton'
import UpdateNotification from './components/UpdateNotification'
import LanguageSwitcher from './components/LanguageSwitcher'

import { useState, useEffect, useRef } from 'react'
import { initializeAutoUpdater } from './utils/updater'

// Auto-inject UI Debugger in dev mode
if (import.meta.env.DEV) {
  import('ui-debugger-pro').then(module => {
    if (module && 'UIDebugger' in module) {
      // UI Debugger will auto-mount itself
      console.log('UI Debugger Pro loaded')
    }
  }).catch(() => {
    console.log('UI Debugger Pro not available')
  })
}

const App = () => {
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [leftWidth, setLeftWidth] = useState<number>(() => Number(localStorage.getItem('layout.leftWidth')) || 384) // 24rem
  const [rightWidth, setRightWidth] = useState<number>(() => Number(localStorage.getItem('layout.rightWidth')) || 448) // 28rem
  const resizing = useRef<null | { side: 'left' | 'right'; startX: number; startW: number }>(null)

  // Listen for collapse events from side panels
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ side: 'left' | 'right'; collapsed: boolean }>
      if (ce.detail.side === 'left') setLeftCollapsed(ce.detail.collapsed)
      if (ce.detail.side === 'right') setRightCollapsed(ce.detail.collapsed)
    }
    window.addEventListener('panel-collapsed', handler)
    return () => window.removeEventListener('panel-collapsed', handler)
  }, [])

  // Initialize auto-updater - check immediately on startup, then periodically
  useEffect(() => {
    // Check for updates immediately on launch (no delay)
    initializeAutoUpdater(60) // Check immediately, then every 60 minutes
      .catch(err => console.error('Failed to initialize auto-updater:', err))
  }, [])

  // Persist widths
  useEffect(() => { localStorage.setItem('layout.leftWidth', String(leftWidth)) }, [leftWidth])
  useEffect(() => { localStorage.setItem('layout.rightWidth', String(rightWidth)) }, [rightWidth])

  // Mouse handlers for resizers
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizing.current) return
      const dx = e.clientX - resizing.current.startX
      if (resizing.current.side === 'left') {
        const next = Math.min(800, Math.max(240, resizing.current.startW + dx))
        setLeftWidth(next)
      } else {
        const next = Math.min(1000, Math.max(320, resizing.current.startW - dx))
        setRightWidth(next)
      }
    }
    const onUp = () => { resizing.current = null; document.body.style.cursor = '' }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const dashboardFlexBasis = (() => {
    // Expand dashboard to fill remaining space between panels
    if (leftCollapsed && rightCollapsed) return '100%'
    if (leftCollapsed && !rightCollapsed) return `calc(100% - ${rightWidth}px - 3rem)` // reserve space for right panel + gaps
    if (!leftCollapsed && rightCollapsed) return `calc(100% - ${leftWidth}px - 3rem)` // reserve space for left panel + gaps
    return `calc(100% - ${leftWidth}px - ${rightWidth}px - 6rem)` // both panels visible
  })()

  const startResize = (side: 'left' | 'right', e: React.MouseEvent) => {
    e.preventDefault()
    resizing.current = { side, startX: e.clientX, startW: side === 'left' ? leftWidth : rightWidth }
    document.body.style.cursor = 'col-resize'
  }

  const resetLayout = () => {
    setLeftCollapsed(false)
    setRightCollapsed(false)
    setLeftWidth(384)
    setRightWidth(448)
  }

  return (
    <div className="min-h-screen px-3 py-6 sm:px-6 lg:px-10">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <FullscreenButton />
          <LanguageSwitcher />
        </div>
        <button
          onClick={resetLayout}
          title="Reset Layout"
          className="rounded-lg px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10"
        >↺ Reset Panels</button>
      </div>
      <UpdateNotification />
      <div className="mx-auto flex w-full max-w-[1840px] gap-6 xl:gap-8 transition-all duration-500">
        <div className={leftCollapsed ? 'flex-none w-0' : 'flex-none transition-all duration-500'} style={{ width: leftCollapsed ? 0 : leftWidth }}>
          <Configurator />
        </div>
        {!leftCollapsed && (
          <div
            role="separator"
            onMouseDown={(e) => startResize('left', e)}
            className="hidden xl:block w-[6px] cursor-col-resize bg-white/20 hover:bg-accent/60 rounded-full my-2 transition-colors"
            title="Drag to resize Configurator"
          />
        )}
        <div
          className="min-w-0 flex-1"
          style={{ flexBasis: dashboardFlexBasis, transition: 'flex-basis 500ms ease, width 500ms ease' }}
        >
          <Dashboard />
        </div>
        {!rightCollapsed && (
          <div
            role="separator"
            onMouseDown={(e) => startResize('right', e)}
            className="hidden xl:block w-[6px] cursor-col-resize bg-white/20 hover:bg-accent/60 rounded-full my-2 transition-colors"
            title="Drag to resize Chat"
          />
        )}
        <div className={rightCollapsed ? 'hidden xl:block' : 'min-w-0 hidden xl:block'} style={{ width: rightCollapsed ? undefined : rightWidth }}>
          <ChatAssistant />
        </div>
      </div>
      <div className="mt-6 xl:hidden">
        <ChatAssistant />
      </div>
    </div>
  )
}

export default App
