import { useState } from 'react'
import { useGoogleApiStore } from '../state/googleApiStore'
import { useChatStore } from '../state/chatStore'
import InfoTooltip from './InfoTooltip'
import { openExternalUrl } from '../utils/openExternal'

const ApisTab = () => {
  const {
    apiKeys,
    setUnifiedKey,
    setSolarKey,
    setMapsKey,
    setShoppingKey,
    setShoppingCx,
    clearUnifiedKey,
    clearSolarKey,
    clearMapsKey,
    clearShoppingKey,
    clearShoppingCx,
  } = useGoogleApiStore()
  const { setProviderKey, clearProviderKey, providerKeys } = useChatStore()
  const [showKeys, setShowKeys] = useState(false)
  const [mode, setMode] = useState<'unified' | 'separate'>(apiKeys.unified ? 'unified' : 'separate')

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold flex items-center gap-2">Google APIs Configuration <InfoTooltip content="Manage keys for Solar, Maps/Geocoding, Shopping. Use a unified key (enable all APIs on one key) OR separate keys per service." /></h3>
        <p className="text-sm text-slate-300 mt-1">Configure Google Cloud APIs for solar analysis, address lookup, and product search.</p>
        <div className="mt-3 text-[11px] text-slate-300 space-y-1">
          <p className="font-semibold text-white/90">Quick Start (fastest way to chat):</p>
          <p>1) Select <span className="text-accent font-semibold">Unified Key</span>. Paste your Google Cloud key (enable Solar, Geocoding, and Custom Search APIs).</p>
          <p>2) Click <span className="text-accent font-semibold">Use Unified Google Key</span> under Gemini.</p>
          <p>3) Open the Chat Assistant and ask for help. You can add other providers later.</p>
        </div>
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
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-300 flex items-center gap-2">Unified Google Cloud Key <InfoTooltip content="Single key with access to Solar API, Maps (Geocoding), and Shopping (Custom Search). Enable these APIs in Google Cloud Console." /></label>
              <div className="mt-2 flex gap-2">
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={apiKeys.unified || ''}
                  onChange={(e) => setUnifiedKey(e.target.value)}
                  placeholder="Paste unified Google Cloud key"
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
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-300 flex items-center gap-2">Shopping API Key (Optional) <InfoTooltip content="Google Custom Search API key for product search. Free tier: 100 queries/day." /></label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={apiKeys.shopping || ''}
                  onChange={(e) => setShoppingKey(e.target.value)}
                  placeholder="Custom Search API key"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent focus:ring-accent"
                />
                {apiKeys.shopping && <button type="button" onClick={clearShoppingKey} className="mt-2 rounded-xl bg-red-500/80 px-4 py-2 text-xs font-semibold">Clear</button>}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-300 flex items-center gap-2">Shopping Engine ID (CX) <InfoTooltip content="Custom Search Engine ID. Create at programmablesearchengine.google.com - enable 'Search the entire web'." /></label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={apiKeys.shoppingCx || ''}
                  onChange={(e) => setShoppingCx(e.target.value)}
                  placeholder="Custom Search CX"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent focus:ring-accent"
                />
                {apiKeys.shoppingCx && <button type="button" onClick={clearShoppingCx} className="mt-2 rounded-xl bg-red-500/80 px-4 py-2 text-xs font-semibold">Clear</button>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold flex items-center gap-2">AI Provider Keys <InfoTooltip content="Configure keys for different AI chat providers. You can add multiple providers and switch between them in the chat assistant." /></h3>
        <p className="text-sm text-slate-300 mt-1">Add API keys for AI providers you want to use in the chat assistant. Only configured providers will be available.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-300 flex items-center gap-2">Google Gemini <InfoTooltip content="Google's Gemini models. Can use unified key or separate Gemini API key." /></label>
            <input
              type={showKeys ? 'text' : 'password'}
              value={providerKeys.google || ''}
              onChange={(e) => setProviderKey('google', e.target.value)}
              placeholder="Gemini API key"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent focus:ring-accent"
            />
            {(!providerKeys.google && apiKeys.unified) && (
              <button
                type="button"
                onClick={() => setProviderKey('google', apiKeys.unified!)}
                className="mt-2 rounded-xl border border-accent/50 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent hover:bg-accent/20"
              >Use Unified Google Key</button>
            )}
            {providerKeys.google && <button type="button" onClick={() => clearProviderKey('google')} className="mt-2 rounded-xl bg-red-500/80 px-4 py-2 text-xs font-semibold">Clear</button>}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-300 flex items-center gap-2">OpenAI <InfoTooltip content="OpenAI GPT models (GPT-5, GPT-4o, etc)." /></label>
            <input
              type={showKeys ? 'text' : 'password'}
              value={providerKeys.openai || ''}
              onChange={(e) => setProviderKey('openai', e.target.value)}
              placeholder="OpenAI API key"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent focus:ring-accent"
            />
            {providerKeys.openai && <button type="button" onClick={() => clearProviderKey('openai')} className="mt-2 rounded-xl bg-red-500/80 px-4 py-2 text-xs font-semibold">Clear</button>}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-300 flex items-center gap-2">Anthropic Claude <InfoTooltip content="Anthropic's Claude models (Claude 3.5 Sonnet/Haiku, etc)." /></label>
            <input
              type={showKeys ? 'text' : 'password'}
              value={providerKeys.anthropic || ''}
              onChange={(e) => setProviderKey('anthropic', e.target.value)}
              placeholder="Anthropic API key"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent focus:ring-accent"
            />
            {providerKeys.anthropic && <button type="button" onClick={() => clearProviderKey('anthropic')} className="mt-2 rounded-xl bg-red-500/80 px-4 py-2 text-xs font-semibold">Clear</button>}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-300 flex items-center gap-2">xAI Grok <InfoTooltip content="xAI's Grok models." /></label>
            <input
              type={showKeys ? 'text' : 'password'}
              value={providerKeys.grok || ''}
              onChange={(e) => setProviderKey('grok', e.target.value)}
              placeholder="xAI API key"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent focus:ring-accent"
            />
            {providerKeys.grok && <button type="button" onClick={() => clearProviderKey('grok')} className="mt-2 rounded-xl bg-red-500/80 px-4 py-2 text-xs font-semibold">Clear</button>}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-300">Setup Instructions</h4>
        <div className="space-y-3 text-xs text-slate-300">
          <div>
            <p className="font-semibold text-accent mb-1">Google Cloud APIs:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create project at <button type="button" onClick={() => openExternalUrl('https://console.cloud.google.com/')} className="text-accent hover:underline">Google Cloud Console</button></li>
              <li>Enable: Solar API, Maps JavaScript API, Geocoding API, Custom Search API</li>
              <li>Generate restricted API key (HTTP referrers / bundle id / package name)</li>
              <li>For Shopping: visit <button type="button" onClick={() => openExternalUrl('https://programmablesearchengine.google.com')} className="text-accent hover:underline">programmablesearchengine.google.com</button>, create engine, enable "Search the entire web", copy CX</li>
              <li>Unified mode: same key for all. Separate mode: individual keys per API</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-accent mb-1">AI Provider Keys:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Gemini:</strong> Can use unified Google key OR separate Gemini key from AI Studio</li>
              <li><strong>OpenAI:</strong> Get from <button type="button" onClick={() => openExternalUrl('https://platform.openai.com/api-keys')} className="text-accent hover:underline">platform.openai.com</button></li>
              <li><strong>Claude:</strong> Get from <button type="button" onClick={() => openExternalUrl('https://console.anthropic.com/')} className="text-accent hover:underline">console.anthropic.com</button></li>
              <li><strong>Grok:</strong> Get from xAI portal</li>
              <li>Only providers with configured keys will appear in chat assistant</li>
            </ul>
          </div>
        </div>
        <p className="text-[10px] text-slate-400">Never commit keys. They persist locally via storage; clear before sharing screenshots.</p>
      </div>
    </div>
  )
}

export default ApisTab
