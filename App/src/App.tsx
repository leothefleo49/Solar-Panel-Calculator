import Configurator from './components/Configurator'
import Dashboard from './components/Dashboard'

const App = () => (
  <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-12">
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 lg:flex-row xl:gap-8">
      <div className="min-w-0 lg:w-[35%] xl:w-[32%]">
        <Configurator />
      </div>
      <div className="min-w-0 lg:flex-1">
        <Dashboard />
      </div>
    </div>
  </div>
)

export default App
