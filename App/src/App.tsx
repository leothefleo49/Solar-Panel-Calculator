import Configurator from './components/Configurator'
import Dashboard from './components/Dashboard'
import ChatAssistant from './components/ChatAssistant'
import FullscreenButton from './components/FullscreenButton'

import { useState, useEffect } from 'react'

const App = () => {
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)

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

  const dashboardFlexBasis = (() => {
    // Expand dashboard when panels are collapsed; add smooth transition via CSS class
    if (leftCollapsed && rightCollapsed) return '100%'
    if (leftCollapsed && !rightCollapsed) return 'calc(100% - 28rem)' // reserve space right panel
    if (!leftCollapsed && rightCollapsed) return 'calc(100% - 24rem)' // reserve space left panel
    return 'auto'
  })()

  return (
    <div className="min-h-screen px-3 py-6 sm:px-6 lg:px-10">
      <FullscreenButton />
      <div className="mx-auto flex w-full max-w-[1840px] gap-6 xl:gap-8 transition-all duration-500">
        <div className={leftCollapsed ? 'hidden' : 'min-w-0'}>
          <Configurator />
        </div>
        <div
          className="min-w-0 flex-1"
          style={{ flexBasis: dashboardFlexBasis, transition: 'flex-basis 500ms ease, width 500ms ease' }}
        >
          <Dashboard />
        </div>
        <div className={rightCollapsed ? 'hidden xl:block' : 'min-w-0 hidden xl:block'}>
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
