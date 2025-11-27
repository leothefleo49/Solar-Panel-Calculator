import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'

// Initialize error logger (import to trigger singleton creation)
import './utils/errorLogger'
import { UIDebugger } from 'ui-debugger-pro';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center text-white">Loading...</div>}>
      <App />
      <UIDebugger />
    </Suspense>
  </StrictMode>,
)
