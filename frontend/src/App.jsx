import { useState } from 'react'
import ConfigPanel from './components/ConfigPanel'
import PipelineRunner from './components/PipelineRunner'
import './App.css'

export default function App() {
  const [config, setConfig] = useState(null)

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">&gt;_</span>
            <span className="logo-text">OutreachPipeline</span>
          </div>
          <div className="header-badge">Zero humans in the loop</div>
        </div>
      </header>

      <main className="main">
        {!config ? (
          <ConfigPanel onStart={setConfig} />
        ) : (
          <PipelineRunner config={config} onReset={() => setConfig(null)} />
        )}
      </main>
    </div>
  )
}
