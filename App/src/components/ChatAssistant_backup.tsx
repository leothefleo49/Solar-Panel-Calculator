import { useState, useRef, useEffect, useMemo } from 'react'
import type { MouseEvent } from 'react'
import { useChatStore } from '../state/chatStore'
import { buildModelSnapshot } from '../utils/calculations'
import { useSolarStore } from '../state/solarStore'
import { useCartStore } from '../state/cartStore'
import { callOpenAI, callGeminiFlash, callClaude, callGrok } from '../utils/aiProviders'

const ChatAssistant = () => {
  const config = useSolarStore((s) => s.config)
  const snapshot = buildModelSnapshot(config)
  const { items: cartItems, checkCompatibility, getMissingComponents } = useCartStore()
  const {
    apiKey,
    clearApiKey,
    loading,
    setLoading,
    provider,
    setProvider,
    model,
    setModel,
    conversations,
    activeConversationId,
    createConversation,
    deleteConversation,
    switchConversation,
    addMessage,
  } = useChatStore()

  const activeConv = conversations.find((c) => c.id === activeConversationId) || conversations[0]
  const messages = useMemo(() => activeConv?.messages ?? [], [activeConv])

  const [input, setInput] = useState('')
  // Removed local key input; keys now managed in APIs tab
  const [images, setImages] = useState<File[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [listening, setListening] = useState(false)
  const [recognitionSupported, setRecognitionSupported] = useState(false)
  const [ttsSupported, setTtsSupported] = useState(false)
  const lastAssistantRef = useRef<string>('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = '3rem'
    const scrollHeight = textareaRef.current.scrollHeight
    const maxHeightPx = 9 * 16 // 9rem
    textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeightPx)}px`
  }, [input])

  // Environment keys (if any) are now surfaced in the APIs tab; not referenced directly here.

  // Provider env key management moved to APIs tab

  const handleDeleteConversation = (id: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (conversations.length === 1) {
      if (!confirm('Delete this conversation? A new one will be created.')) return
    }
    deleteConversation(id)
  }

  const handleCreateConversation = () => {
    if (conversations.length >= 5) {
      const oldest = conversations.reduce((prev, curr) => (curr.lastUsed < prev.lastUsed ? curr : prev))
      const oldestLabel = oldest?.title?.trim() || 'Untitled chat'
      const confirmed = confirm(`You already have 5 chats. Delete the oldest conversation (“${oldestLabel}”) to start a new one?`)
      if (!confirmed) {
        return
      }
      if (oldest) {
        deleteConversation(oldest.id)
      }
    }
    createConversation()
  }

  const handleSend = async () => {
    if (!input.trim()) return
    const question = input.trim()
    setInput('')
    addMessage('user', question)

    if (!apiKey) {
      addMessage('assistant', 'Please enter your API key first in the field above.')
      return
    }

    setLoading(true)
    try {
      const contextBlob = `System Summary:\nArray Size: ${snapshot.systemSizeKw.toFixed(2)} kWdc\nAnnual Production: ${snapshot.annualProduction.toFixed(0)} kWh\nBreak-Even Year: ${snapshot.summary.breakEvenYear ?? 'Not reached'}\n25-Year Savings: $${snapshot.summary.totalSavings.toFixed(0)}\nNet Upfront Cost: $${snapshot.summary.netUpfrontCost.toFixed(0)}\nAverage Monthly Production: ${snapshot.averageMonthlyProduction.toFixed(0)} kWh\nNet Metering: ${config.netMetering ? 'Enabled' : 'Disabled'}\n`
      
      // Shopping cart context
      const compatibility = checkCompatibility()
      const missingComponents = getMissingComponents()
      let cartContext = ''
      if (cartItems.length > 0) {
        cartContext = `\nShopping Cart (${cartItems.length} items):\n`
        cartItems.forEach(item => {
          cartContext += `- ${item.name} (${item.category}, qty: ${item.quantity})`
          if (item.specs.power) cartContext += ` ${item.specs.power}W`
          if (item.specs.voltage) cartContext += ` ${item.specs.voltage}V`
          if (item.price) cartContext += ` $${item.price * item.quantity}`
          cartContext += '\n'
        })
        cartContext += `Compatibility: ${compatibility.passed ? 'OK' : 'ISSUES'}\n`
        if (compatibility.errors.length) cartContext += `Errors: ${compatibility.errors.join('; ')}\n`
        if (compatibility.warnings.length) cartContext += `Warnings: ${compatibility.warnings.join('; ')}\n`
        if (missingComponents.length) cartContext += `Missing: ${missingComponents.join(', ')}\n`
      } else {
        cartContext = '\nShopping Cart: Empty. User can search products in Shopping Cart tab or manually add items.\n'
      }

      const knowledge = 'Core Concepts: PV module efficiency, degradation (~0.5%/yr typical), inverter lifetime, BOS cost drivers, capacity factor, peak sun hours, utility escalation, ROI, break-even, battery autonomy hours. Provide practical guidance and warn when assumptions look out of band. For shopping assistance: help validate product specs match system requirements, check NEC compliance (690/705/706), suggest compatible components, warn about voltage/ampacity mismatches. You can guide users to the Shopping Cart tab to add products or adjust configurator values based on cart items.'

      const chatMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        {
          role: 'system',
          content:
            'You are a friendly, expert solar PV financial & technical analysis assistant. Be warm, encouraging, and approachable while staying precise and professional. Use clear language, celebrate smart design choices, and gently flag concerns. Keep responses concise yet thorough.',
        },
        { role: 'system', content: knowledge },
        { role: 'system', content: contextBlob + cartContext },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: question },
      ]

      let result
      if (provider === 'google') {
        const imagePayload = await Promise.all(
          images.map(
            (file) =>
              new Promise<{ mimeType: string; data: string }>((resolve) => {
                const reader = new FileReader()
                reader.onload = () => {
                  const base64 = (reader.result as string).split(',')[1]
                  resolve({ mimeType: file.type || 'image/png', data: base64 })
                }
                reader.readAsDataURL(file)
              }),
          ),
        )
        result = await callGeminiFlash(apiKey, model, chatMessages, imagePayload)
      } else if (provider === 'anthropic') {
        result = await callClaude(apiKey, model, chatMessages)
      } else if (provider === 'grok') {
        result = await callGrok(apiKey, model, chatMessages)
      } else {
        result = await callOpenAI(apiKey, model, chatMessages)
      }

      if (!result.ok) {
        addMessage('assistant', `API error: ${result.error}`)
      } else {
        addMessage('assistant', result.content)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      addMessage('assistant', `Request failed: ${message}`)
    } finally {
      setLoading(false)
      setImages([])
    }
  }

  useEffect(() => {
    // Insert preset guidance message once if no API key present
    if (!apiKey) {
      const already = messages.some(m => m.role === 'assistant' && m.content.includes('Configure your API key'))
      if (!already) {
        addMessage('assistant', 'Configure your API key(s) in the APIs tab for chat & analysis. Use Unified Google key or any AI provider key. Click "Configure APIs" button if needed.')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Panel collapse broadcast
    window.dispatchEvent(new CustomEvent('panel-collapsed', { detail: { side: 'right', collapsed } }))
  }, [collapsed])

  useEffect(() => {
    // Track last assistant message for TTS
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
    if (lastAssistant) lastAssistantRef.current = lastAssistant.content
  }, [messages])

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) setRecognitionSupported(true)
    if ('speechSynthesis' in window) setTtsSupported(true)
  }, [])

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const transcript = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          setInput(prev => (prev ? prev + ' ' : '') + transcript.trim())
        } else {
          interim += transcript
        }
      }
      if (textareaRef.current) textareaRef.current.placeholder = interim ? `Speaking: ${interim}` : 'Ask a question...'
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start()
    ;(window as any).__activeRecognition = rec
    setListening(true)
  }

  const stopListening = () => {
    const rec = (window as any).__activeRecognition
    if (rec) rec.stop()
    setListening(false)
    if (textareaRef.current) textareaRef.current.placeholder = 'Ask a question about system sizing, ROI, production...'
  }

  const speakLastAssistant = () => {
    if (!ttsSupported || !lastAssistantRef.current) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(lastAssistantRef.current.slice(0, 1200))
    utter.rate = 1
    utter.pitch = 1
    utter.volume = 1
    window.speechSynthesis.speak(utter)
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="glass-panel fixed right-0 top-1/2 z-20 -translate-y-1/2 rounded-l-[28px] p-2 text-white hover:bg-white/10 transition"
        title="Expand Chat Assistant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    )
  }

  return (
    <div className="glass-panel xl:sticky xl:top-6 relative flex h-full max-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-[28px] p-6 text-white">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">Solar Chat Assistant</h3>
          <p className="text-xs text-slate-300">Enter your API key (stored only in memory) to ask planning & calculation questions.</p>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded-lg p-1.5 hover:bg-white/10 transition ml-2"
          title="Minimize Chat Assistant"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => switchConversation(conv.id)}
            className={`group relative flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs transition ${
              conv.id === activeConversationId
                ? 'border-accent bg-accent/20 text-accent font-semibold'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
            }`}
          >
            <span className="max-w-[120px] truncate">{conv.title}</span>
            <button
              onClick={(e) => handleDeleteConversation(conv.id, e)}
              className="ml-1 text-white/50 hover:text-red-400 transition"
              title="Delete conversation"
            >
              ×
            </button>
          </button>
        ))}
        <button
          onClick={handleCreateConversation}
          className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-accent hover:text-accent"
          title="Start another conversation"
        >
          + New
        </button>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap gap-2 items-start">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Provider">
            <button
              type="button"
              onClick={() => setProvider('google')}
              className={provider === 'google' ? 'tab-pill tab-pill--active text-xs' : 'tab-pill tab-pill--idle text-xs'}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => setProvider('openai')}
              className={provider === 'openai' ? 'tab-pill tab-pill--active text-xs' : 'tab-pill tab-pill--idle text-xs'}
            >
              OpenAI
            </button>
            <button
              type="button"
              onClick={() => setProvider('anthropic')}
              className={provider === 'anthropic' ? 'tab-pill tab-pill--active text-xs' : 'tab-pill tab-pill--idle text-xs'}
            >
              Claude
            </button>
            <button
              type="button"
              onClick={() => setProvider('grok')}
              className={provider === 'grok' ? 'tab-pill tab-pill--active text-xs' : 'tab-pill tab-pill--idle text-xs'}
            >
              Grok
            </button>
          </div>

          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="premium-select rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs focus:border-accent focus:ring-accent min-w-[140px]"
          >
            {provider === 'google' && (
              <>
                <option value="gemini-2.5-pro" className="bg-slate">gemini-2.5-pro</option>
                <option value="gemini-2.5-flash" className="bg-slate">gemini-2.5-flash</option>
                <option value="gemini-2.0-ultra" className="bg-slate">gemini-2.0-ultra</option>
                <option value="gemini-2.0-flash" className="bg-slate">gemini-2.0-flash</option>
                <option value="gemini-1.5-pro" className="bg-slate">gemini-1.5-pro</option>
                <option value="gemini-1.5-flash" className="bg-slate">gemini-1.5-flash</option>
                <option value="gemini-exp-1206" className="bg-slate">gemini-exp-1206</option>
              </>
            )}
            {provider === 'openai' && (
              <>
                <option value="gpt-5" className="bg-slate">gpt-5</option>
                <option value="gpt-4.1" className="bg-slate">gpt-4.1</option>
                <option value="gpt-4o" className="bg-slate">gpt-4o</option>
                <option value="gpt-4o-mini" className="bg-slate">gpt-4o-mini</option>
                <option value="gpt-4-turbo" className="bg-slate">gpt-4-turbo</option>
                <option value="gpt-3.5-turbo" className="bg-slate">gpt-3.5-turbo</option>
              </>
            )}
            {provider === 'anthropic' && (
              <>
                <option value="claude-3.5-sonnet-latest" className="bg-slate">claude-3.5-sonnet</option>
                <option value="claude-3.5-haiku-latest" className="bg-slate">claude-3.5-haiku</option>
                <option value="claude-3-opus-20240229" className="bg-slate">claude-3-opus</option>
              </>
            )}
            {provider === 'grok' && (
              <>
                <option value="grok-2" className="bg-slate">grok-2</option>
                <option value="grok-2-mini" className="bg-slate">grok-2-mini</option>
              </>
            )}
          </select>

          {!apiKey ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-dashboard-tab', { detail: { tab: 'apis' } }))}
              className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-slate-950 transition hover:brightness-110"
            >
              Configure APIs
            </button>
          ) : (
            <button
              type="button"
              onClick={() => clearApiKey()}
              className="rounded-xl bg-red-500/80 px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110"
              title="Clear saved API key"
            >
              Clear Key
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 modern-scroll">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === 'user'
                ? 'rounded-2xl bg-accent/20 border border-accent/40 px-3 py-2 text-xs'
                : 'rounded-2xl bg-white/10 border border-white/10 px-3 py-2 text-xs'
            }
          >
            <p className="mb-1 font-semibold capitalize text-[10px] tracking-wide opacity-70">{m.role}</p>
            <p className="whitespace-pre-line leading-relaxed">{m.content}</p>
          </div>
        ))}
        {loading && <div className="text-xs text-slate-300 typing-dots"><span></span><span></span><span></span></div>}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            placeholder="Ask a question about system sizing, ROI, production..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="flex-1 resize-none overflow-hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-accent focus:ring-accent"
            style={{ minHeight: '3rem', maxHeight: '9rem' }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading}
            className="rounded-xl bg-accent px-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-40 flex items-center justify-center"
            style={{ minWidth: '70px', height: textareaRef.current?.offsetHeight || 48 }}
          >
            Send
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
          {recognitionSupported ? (
            listening ? (
              <button
                type="button"
                onClick={stopListening}
                className="rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 font-semibold text-rose-200 hover:bg-rose-500/30"
              >Stop Voice</button>
            ) : (
              <button
                type="button"
                onClick={startListening}
                className="rounded-lg border border-accent/50 bg-accent/20 px-3 py-1.5 font-semibold text-accent hover:bg-accent/30"
              >Start Voice</button>
            )
          ) : (
            <span className="text-[10px] text-slate-500">Voice input unsupported in this browser.</span>
          )}
          {ttsSupported && (
            <button
              type="button"
              onClick={speakLastAssistant}
              disabled={!lastAssistantRef.current}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-white/80 hover:border-accent hover:text-white disabled:opacity-40"
            >Play Last Reply</button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              const next = Array.from(e.target.files || [])
              if (next.length === 0) return
              setImages((prev) => [...prev, ...next])
            }}
            className="hidden"
            id="chat-image-input"
          />
          <button
            type="button"
            onClick={() => document.getElementById('chat-image-input')?.click()}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/80 transition hover:border-accent hover:text-white"
          >
            <span className="text-base">+</span>
            Upload Files
          </button>
          {images.length > 0 && <span className="text-accent/80">{images.length} image(s) attached</span>}
          {provider !== 'google' && (
            <span className="text-[10px] text-slate-400">Image analysis currently available only with Gemini models.</span>
          )}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-slate-400">Keys live only in memory. For production, route requests through a secure backend and add rate limiting. Voice features use browser SpeechRecognition & speechSynthesis APIs.</p>
    </div>
  )
}

export default ChatAssistant
