import { useState } from 'react'
import clsx from 'clsx'
import { useGoogleApiStore } from '../state/googleApiStore'
import { useChatStore } from '../state/chatStore'
import InfoTooltip from './InfoTooltip'
import { openExternalUrl } from '../utils/openExternal'
import { validateGoogleApiKey, validateGeminiKey, validateOpenAIKey, validateAnthropicKey, validateGrokKey, type ValidationResult } from '../utils/apiValidator'

const ApisTab = () => {
  const {
    apiKeys,
    keyMode,
    setKeyMode,
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'validating'>('idle')
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult | null>>({})
  const [showValidationModal, setShowValidationModal] = useState(false)

  // Update mode in store when it changes
  const handleModeChange = (newMode: 'unified' | 'separate') => {
    setKeyMode(newMode)
  }

  const handleSaveChanges = async () => {
    setSaveStatus('validating')
    const results: Record<string, ValidationResult | null> = {}
    let hasErrors = false

    try {
      // Validate Google keys based on mode
      if (keyMode === 'unified' && apiKeys.unified) {
        const unifiedResult = await validateGoogleApiKey(apiKeys.unified, 'unified')
        results['google-unified'] = unifiedResult
        if (!unifiedResult.valid) hasErrors = true
      } else if (keyMode === 'separate') {
        if (apiKeys.solar) {
          const solarResult = await validateGoogleApiKey(apiKeys.solar, 'solar')
          results['google-solar'] = solarResult
          if (!solarResult.valid) hasErrors = true
        }
        if (apiKeys.maps) {
          const mapsResult = await validateGoogleApiKey(apiKeys.maps, 'maps')
          results['google-maps'] = mapsResult
          if (!mapsResult.valid) hasErrors = true
        }
        if (apiKeys.shopping) {
          const shoppingResult = await validateGoogleApiKey(apiKeys.shopping, 'shopping')
          results['google-shopping'] = shoppingResult
          if (!shoppingResult.valid) hasErrors = true
        }
      }

      // Validate AI provider keys
      if (providerKeys.gemini) {
        const geminiResult = await validateGeminiKey(providerKeys.gemini)
        results['gemini'] = geminiResult
        if (!geminiResult.valid) hasErrors = true
      }
      if (providerKeys.openai) {
        const openaiResult = await validateOpenAIKey(providerKeys.openai)
        results['openai'] = openaiResult
        if (!openaiResult.valid) hasErrors = true
      }
      if (providerKeys.anthropic) {
        const anthropicResult = await validateAnthropicKey(providerKeys.anthropic)
        results['anthropic'] = anthropicResult
        if (!anthropicResult.valid) hasErrors = true
      }
      if (providerKeys.grok) {
        const grokResult = await validateGrokKey(providerKeys.grok)
        results['grok'] = grokResult
        if (!grokResult.valid) hasErrors = true
      }

      setValidationResults(results)

      if (hasErrors) {
        setSaveStatus('idle')
        setShowValidationModal(true)
        return
      }

      // All valid - proceed with save
      setSaveStatus('saving')
      setTimeout(() => {
        setSaveStatus('saved')
        window.dispatchEvent(new Event('apiKeysUpdated'))
        setTimeout(() => setSaveStatus('idle'), 2000)
      }, 300)
    } catch (error) {
      console.error('Validation error:', error)
      setSaveStatus('idle')
      alert('Failed to validate API keys. Check your internet connection and try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Save Changes Button - Fixed Position */}
      <div className="sticky top-0 z-10 flex justify-end pb-3">
        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={saveStatus === 'saving' || saveStatus === 'validating'}
          className={clsx(
            'rounded-xl px-6 py-2.5 text-sm font-semibold transition-all',
            saveStatus === 'saved'
              ? 'bg-green-500/90 text-white'
              : saveStatus === 'saving' || saveStatus === 'validating'
              ? 'bg-accent/50 text-white cursor-wait'
              : 'bg-accent text-slate-900 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/30'
          )}
        >
          {saveStatus === 'saved' ? '✓ Changes Saved!' : saveStatus === 'validating' ? '🔍 Validating Keys...' : saveStatus === 'saving' ? 'Saving...' : '💾 Save Changes'}
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold flex items-center gap-2">Google APIs Configuration <InfoTooltip content="Manage keys for Solar, Maps/Geocoding, Shopping. Use a unified key (enable all APIs on one key) OR separate keys per service." /></h3>
        <p className="text-sm text-slate-300 mt-1">Configure Google Cloud APIs for solar analysis, address lookup, and product search.</p>
        
        {/* Enhanced Quick Start Guide */}
        <div className="mt-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 space-y-2">
          <p className="font-semibold text-white/90 text-sm">🚀 Quick Start Guide - Three Options:</p>
          
          <div className="space-y-3 text-xs text-slate-300">
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-3">
              <p className="font-semibold text-green-400 mb-1.5">✨ Option 1: Unified Key (Easiest - Recommended for Beginners)</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to <button type="button" onClick={() => openExternalUrl('https://console.cloud.google.com/')} className="text-accent hover:underline font-medium">Google Cloud Console</button></li>
                <li>Create a project, enable: Solar API, Geocoding API, Custom Search API</li>
                <li>Create ONE API key with restrictions (HTTP referrers for web, bundle ID for mobile)</li>
                <li>Paste key below in "Unified Key" mode</li>
                <li>Click "Use Unified Google Key" for Gemini chat (reuses same key)</li>
                <li>Click Save Changes above</li>
              </ol>
              <p className="text-green-300 mt-2 text-[10px]">💡 Best for: Maximum simplicity, single key management</p>
              <p className="text-green-300 text-[10px]">💰 Cost: Pay-as-you-go for all services ($200 free credits for new accounts)</p>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
              <p className="font-semibold text-blue-400 mb-1.5">⚡ Option 2: Separate Keys (More Control)</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Create separate API keys for Solar, Maps, Shopping in Cloud Console</li>
                <li>Get dedicated Gemini key from <button type="button" onClick={() => openExternalUrl('https://aistudio.google.com/apikey')} className="text-accent hover:underline font-medium">Google AI Studio</button> (separate from Cloud Console)</li>
                <li>Switch to "Separate Keys" mode and paste each key</li>
                <li>Click Save Changes above</li>
              </ol>
              <p className="text-blue-300 mt-2 text-[10px]">💡 Best for: Tracking usage per service, separate billing</p>
              <p className="text-blue-300 text-[10px]">💰 Cost: Cloud Console (pay-as-you-go + $300 free trial for 90 days if new), AI Studio (free tier: 15 RPM / 1M TPM / 1500 RPD for Gemini Flash)</p>
            </div>

            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3">
              <p className="font-semibold text-purple-400 mb-1.5">🎯 Option 3: Multi-Provider (Best Quality & Flexibility)</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Use Unified or Separate keys for Google services (Solar/Maps/Shopping)</li>
                <li>Add OpenAI key (<button type="button" onClick={() => openExternalUrl('https://platform.openai.com/api-keys')} className="text-accent hover:underline font-medium">platform.openai.com</button>) for GPT-5</li>
                <li>Add Anthropic key (<button type="button" onClick={() => openExternalUrl('https://console.anthropic.com/')} className="text-accent hover:underline font-medium">console.anthropic.com</button>) for Claude</li>
                <li>Add xAI key for Grok (if desired)</li>
                <li>Switch between providers in Chat Assistant</li>
                <li>Click Save Changes above</li>
              </ol>
              <p className="text-purple-300 mt-2 text-[10px]">💡 Best for: Access to best models, redundancy, comparing AI outputs</p>
              <p className="text-purple-300 text-[10px]">💰 Cost: OpenAI ($5 min, pay-per-token), Anthropic ($5 min, pay-per-token), Gemini (see Option 2), Grok (pay-per-token)</p>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <p className="font-semibold text-white/90 text-xs mb-1">🎓 Recommendation Matrix:</p>
            <ul className="space-y-1 text-[10px] text-slate-300">
              <li><span className="text-green-400 font-semibold">• Easiest Setup:</span> Option 1 (Unified Key from Cloud Console)</li>
              <li><span className="text-blue-400 font-semibold">• Most Free Usage:</span> Option 2 Gemini via AI Studio (15 RPM free forever) + Cloud Console ($300 trial for new accounts)</li>
              <li><span className="text-purple-400 font-semibold">• Best AI Quality:</span> Option 3 with Claude 3.5 Sonnet (best reasoning) or GPT-5 (multimodal)</li>
              <li><span className="text-amber-400 font-semibold">• Best Value Long-Term:</span> Option 1 Unified Key (consolidated billing, easier tracking)</li>
            </ul>
                      <p className="text-[9px] text-slate-400 mt-2 italic">Note: Free tiers and credits vary by region and account status. Check provider websites for current offers. RPM = Requests Per Minute, TPM = Tokens Per Minute, RPD = Requests Per Day.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={() => handleModeChange('unified')}
            className={keyMode === 'unified' ? 'tab-pill tab-pill--active text-xs' : 'tab-pill tab-pill--idle text-xs'}
          >Unified Key</button>
          <button
            type="button"
            onClick={() => handleModeChange('separate')}
            className={keyMode === 'separate' ? 'tab-pill tab-pill--active text-xs' : 'tab-pill tab-pill--idle text-xs'}
          >Separate Keys</button>
          <button
            type="button"
            onClick={() => setShowKeys(v => !v)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:border-accent hover:text-accent"
          >{showKeys ? 'Hide Keys' : 'Show Keys'}</button>
        </div>
        <div className="mt-5 space-y-4">
          {keyMode === 'unified' ? (
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-300 flex items-center gap-2">Unified Google Cloud Key <InfoTooltip content="Single key with access to Solar API, Maps (Geocoding), and Shopping (Custom Search). Enable these APIs in Google Cloud Console." /></label>
              <div className="mt-2 flex gap-2">
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={apiKeys.unified || ''}
                  onChange={(e) => setUnifiedKey(e.target.value)}
                  placeholder="Paste unified Google Cloud key"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none"
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
        <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-300">Detailed Setup Instructions</h4>
        <div className="space-y-3 text-xs text-slate-300">
          <div>
            <p className="font-semibold text-accent mb-1">Google Cloud Console Setup:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Visit <button type="button" onClick={() => openExternalUrl('https://console.cloud.google.com/')} className="text-accent hover:underline">console.cloud.google.com</button> and create/select a project</li>
              <li>Enable APIs: <span className="font-medium">Solar API, Maps JavaScript API, Geocoding API, Custom Search JSON API</span></li>
              <li>Create API Key with appropriate restrictions:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                  <li><span className="font-medium">Web:</span> HTTP referrers (e.g., localhost:*, yourdomain.com/*)</li>
                  <li><span className="font-medium">Android:</span> Bundle ID (com.solarpanel.calculator)</li>
                  <li><span className="font-medium">Desktop:</span> Use web restrictions or none for local testing</li>
                </ul>
              </li>
              <li>For Shopping: Create Custom Search Engine at <button type="button" onClick={() => openExternalUrl('https://programmablesearchengine.google.com')} className="text-accent hover:underline">programmablesearchengine.google.com</button>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Enable "Search the entire web"</li>
                  <li>Copy your Search Engine ID (cx parameter)</li>
                </ul>
              </li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-accent mb-1">Google AI Studio (Alternative for Gemini):</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Visit <button type="button" onClick={() => openExternalUrl('https://aistudio.google.com/apikey')} className="text-accent hover:underline">aistudio.google.com/apikey</button></li>
              <li>Create API key (separate from Cloud Console)</li>
              <li>Free tier: 15 requests/min, 1M tokens/min, 1500 requests/day for Gemini 2.0 Flash</li>
              <li>Paid tier (if you exceed free): $0.075 per 1M input tokens, $0.30 per 1M output tokens</li>
              <li>Cannot be used for Solar/Maps/Shopping APIs (Cloud Console only)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-accent mb-1">Other AI Provider Keys:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>OpenAI:</strong> <button type="button" onClick={() => openExternalUrl('https://platform.openai.com/api-keys')} className="text-accent hover:underline">platform.openai.com/api-keys</button> - $5 minimum credit, ~$0.15-$15 per 1M tokens depending on model (GPT-5, GPT-4o, o1)</li>
              <li><strong>Anthropic:</strong> <button type="button" onClick={() => openExternalUrl('https://console.anthropic.com/')} className="text-accent hover:underline">console.anthropic.com</button> - $5 minimum credit, $3 per 1M input tokens, $15 per 1M output (Claude 3.5 Sonnet)</li>
              <li><strong>xAI Grok:</strong> API access via xAI - pricing varies, check xAI console for current rates</li>
              <li>Only configured providers appear in Chat Assistant dropdown</li>
            </ul>
          </div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="text-[10px] text-amber-200">
            <strong>🔒 Security:</strong> Never commit API keys to git. Keys are stored locally in browser/app storage. 
            Clear keys before sharing screenshots. Use API restrictions to limit unauthorized usage.
          </p>
        </div>
      </div>

      {/* Validation Results Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-w-2xl w-full rounded-3xl border border-white/10 bg-slate-900 p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">⚠️ API Key Validation Results</h3>
            <div className="space-y-3 mb-6">
              {Object.entries(validationResults).map(([key, result]) => {
                if (!result) return null;
                const statusIcon = result.valid ? '✅' : '❌';
                const statusColor = result.valid ? 'text-green-400' : 'text-red-400';
                return (
                  <div key={key} className={clsx('rounded-lg border p-3', result.valid ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/10')}>
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{statusIcon}</span>
                      <div className="flex-1">
                        <p className={clsx('font-semibold', statusColor)}>{key.replace('google-', 'Google ').replace(/-/g, ' ').toUpperCase()}</p>
                        <p className="text-sm text-slate-300 mt-1">{result.message}</p>
                        {result.errorType && (
                          <p className="text-xs text-slate-400 mt-1">Error Type: {result.errorType}</p>
                        )}
                        {result.statusCode && (
                          <p className="text-xs text-slate-400">Status Code: {result.statusCode}</p>
                        )}
                        {result.suggestedFixes && result.suggestedFixes.length > 0 && (
                          <div className="mt-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-2">
                            <p className="text-xs text-blue-300 font-semibold">💡 Suggested Fixes:</p>
                            <ul className="text-xs text-blue-200 mt-1 list-disc list-inside space-y-1">
                              {result.suggestedFixes.map((fix, idx) => (
                                <li key={idx}>{fix}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowValidationModal(false)}
                className="flex-1 rounded-xl bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/20"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowValidationModal(false);
                  // Clear invalid keys
                  Object.entries(validationResults).forEach(([key, result]) => {
                    if (result && !result.valid) {
                      if (key.includes('google-unified')) clearUnifiedKey();
                      else if (key.includes('google-solar')) clearSolarKey();
                      else if (key.includes('google-maps')) clearMapsKey();
                      else if (key.includes('google-shopping')) clearShoppingKey();
                      else if (key === 'gemini') clearProviderKey('gemini');
                      else if (key === 'openai') clearProviderKey('openai');
                      else if (key === 'anthropic') clearProviderKey('anthropic');
                      else if (key === 'grok') clearProviderKey('grok');
                    }
                  });
                }}
                className="flex-1 rounded-xl bg-red-500/90 px-4 py-2 font-semibold text-white hover:bg-red-500"
              >
                Clear Invalid Keys
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApisTab
