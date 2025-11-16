import Configurator from './components/Configurator'
import Dashboard from './components/Dashboard'
import ChatAssistant from './components/ChatAssistant'
import FullscreenButton from './components/FullscreenButton'

const App = () => (
  <div className="min-h-screen px-3 py-6 sm:px-6 lg:px-10">
    <FullscreenButton />
    <div className="mx-auto grid w-full max-w-[1840px] gap-6 xl:gap-8 lg:grid-cols-[0.36fr_1fr] xl:grid-cols-[0.30fr_1fr_0.36fr]">
      <div className="min-w-0 order-1">
        <Configurator />
      </div>
      <div className="min-w-0 order-2">
        <Dashboard />
      </div>
      <div className="min-w-0 order-3 hidden xl:block">
        <ChatAssistant />
      </div>
    </div>
    <div className="mt-6 xl:hidden">
      <ChatAssistant />
    </div>
  </div>
)

export default App
