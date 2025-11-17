import Configurator from './components/Configurator'
import Dashboard from './components/Dashboard'
import ChatAssistant from './components/ChatAssistant'
import FullscreenButton from './components/FullscreenButton'
import UpdateNotification from './components/UpdateNotification'

import { useState, useEffect, useRef } from 'react'
import { initializeAutoUpdater } from './utils/updater'

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

  // Initialize auto-updater
  useEffect(() => {
    initializeAutoUpdater(60) // Check every 60 minutes
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
        const next = Math.min(640, Math.max(240, resizing.current.startW + dx))
        setLeftWidth(next)
      } else {
        const next = Math.min(640, Math.max(320, resizing.current.startW - dx))
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
    // Expand dashboard when panels are collapsed; add smooth transition via CSS class
    if (leftCollapsed && rightCollapsed) return '100%'
    if (leftCollapsed && !rightCollapsed) return 'calc(100% - 28rem)' // reserve space right panel
    if (!leftCollapsed && rightCollapsed) return 'calc(100% - 24rem)' // reserve space left panel
    return 'auto'
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
        <FullscreenButton />
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
            className="hidden xl:block w-[6px] cursor-col-resize bg-white/5 hover:bg-white/10 rounded-full my-2"
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
            className="hidden xl:block w-[6px] cursor-col-resize bg-white/5 hover:bg-white/10 rounded-full my-2"
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
