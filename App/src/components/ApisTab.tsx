import { useState } from 'react'
import { useGoogleApiStore } from '../state/googleApiStore'
import { useChatStore } from '../state/chatStore'
import InfoTooltip from './InfoTooltip'

const ApisTab = () => {
  const {
    apiKeys,
    setUnifiedKey,
    setSolarKey,
    setMapsKey,
    setGeminiKey,
    clearUnifiedKey,
    clearSolarKey,
    clearMapsKey,
    clearGeminiKey,
  } = useGoogleApiStore()
  const { apiKey, setApiKey, clearApiKey } = useChatStore()
  const [showKeys, setShowKeys] = useState(false)
  const [mode, setMode] = useState<'unified' | 'separate'>(apiKeys.unified ? 'unified' : 'separate')

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold flex items-center gap-2">API Configuration <InfoTooltip content="Manage keys for Solar, Maps/Geocoding, Gemini AI or a Unified Google key. Also set the AI provider key used by the chat assistant." /></h3>
        <p className="text-sm text-slate-300 mt-1">Use a unified Google Cloud key (enable Solar API, Maps, Gemini) OR separate keys per service. Add any AI provider key for chat if not using Gemini.</p>
        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={() => setMode('unified')}
            className={mode === 'unified' ? 'tab-pill tab-pill--active text-xs' : 'tab-pill tab-pill--idle text-xs'}
          >Unified Key</button>
          <button
            type="button"
            onClick={() => setMode('separate')}
            className={mode === 'separate' ? 'tab-pill tab-pill--active text-xs' : 'tab-pill tab-pill--idle text-xs'}
          >Separate Keys</button>
          <button
            type="button"
            onClick={() => setShowKeys(v => !v)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:border-accent hover:text-accent"
          >{showKeys ? 'Hide Keys' : 'Show Keys'}</button>
        </div>
        <div className="mt-5 space-y-4">
          {mode === 'unified' ? (
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-300 flex items-center gap-2">Unified Google Cloud Key <InfoTooltip content="Single key with access to Solar API, Maps (Geocoding), and Gemini AI. Enable APIs in Google Cloud Console." /></label>
              <div className="mt-2 flex gap-2">
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={apiKeys.unified || ''}
                  onChange={(e) => setUnifiedKey(e.target.value)}
                  placeholder="Paste unified key"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent focus:ring-accent"
                />
                {apiKeys.unified && (
                  <button type="button" onClick={clearUnifiedKey} className="rounded-xl bg-red-500/80 px-4 py-3 text-xs font-semibold">Clear</button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-300 flex items-center gap-2">Solar API Key <InfoTooltip content="Key for Google Solar API roof & irradiance data." /></label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={apiKeys.solar || ''}
                  onChange={(e) => setSolarKey(e.target.value)}
                  placeholder="Solar API key"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent focus:ring-accent"
                />
                {apiKeys.solar && <button type="button" onClick={clearSolarKey} className="mt-2 rounded-xl bg-red-500/80 px-4 py-2 text-xs font-semibold">Clear</button>}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-300 flex items-center gap-2">Maps / Geocoding Key <InfoTooltip content="Key for address resolution & map data." /></label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={apiKeys.maps || ''}
                  onChange={(e) => setMapsKey(e.target.value)}
                  placeholder="Maps API key"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent focus:ring-accent"
                />
                {apiKeys.maps && <button type="button" onClick={clearMapsKey} className="mt-2 rounded-xl bg-red-500/80 px-4 py-2 text-xs font-semibold">Clear</button>}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-300 flex items-center gap-2">Gemini AI Key (Optional) <InfoTooltip content="Provide if using Gemini separately. Otherwise unified key or other AI provider key suffices." /></label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={apiKeys.gemini || ''}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Gemini key"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent focus:ring-accent"
                />
                {apiKeys.gemini && <button type="button" onClick={clearGeminiKey} className="mt-2 rounded-xl bg-red-500/80 px-4 py-2 text-xs font-semibold">Clear</button>}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-300 flex items-center gap-2">AI Provider Key <InfoTooltip content="Key for chosen chat AI (OpenAI, Anthropic, Grok, Gemini)." /></label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={apiKey || ''}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AI provider key"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent focus:ring-accent"
                />
                {apiKey && <button type="button" onClick={clearApiKey} className="mt-2 rounded-xl bg-red-500/80 px-4 py-2 text-xs font-semibold">Clear</button>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-300">Key Setup Instructions</h4>
        <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1">
          <li>Create a Google Cloud project or reuse existing.</li>
          <li>Enable: Solar API, Maps JavaScript API, Geocoding API, Gemini API (optional for unified usage).</li>
          <li>Generate a restricted API key (HTTP referrers / bundle id / package name as appropriate).</li>
          <li>For unified mode paste the same key in Unified field; for separate mode supply each key individually.</li>
          <li>Obtain AI provider key (OpenAI dashboard, Anthropic console, xAI portal, or Gemini) and paste under AI Provider Key.</li>
          <li>If using unified Google workflow, Gemini key may be the same as unified key; AI provider switch in Chat Assistant still works.</li>
        </ol>
        <p className="text-[10px] text-slate-400">Never commit keys. They persist locally via storage; clear before sharing screenshots.</p>
      </div>
    </div>
  )
}

export default ApisTab
