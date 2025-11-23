import { useState, useRef, useEffect, useMemo } from 'react'
import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useChatStore } from '../state/chatStore'
import { buildModelSnapshot } from '../utils/calculations'
import { useSolarStore } from '../state/solarStore'
import { useCartStore } from '../state/cartStore'
import { useGoogleApiStore } from '../state/googleApiStore'
import { callOpenAI, callGeminiFlash, callClaude, callGrok, openaiTts, googleTts } from '../utils/aiProviders'
import type { FileUpload } from '../utils/aiProviders'

const OPENAI_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
const GOOGLE_VOICES = [
  'en-US-Neural2-A',  // Female
  'en-US-Neural2-C',  // Female
  'en-US-Neural2-D',  // Male
  'en-US-Neural2-F',  // Female
  'en-US-Neural2-G',  // Female
  'en-US-Neural2-H',  // Female
  'en-US-Neural2-I',  // Male
  'en-US-Neural2-J',  // Male
  'en-GB-Neural2-A',  // British Female
  'en-GB-Neural2-B',  // British Male
  'en-AU-Neural2-A',  // Australian Female
  'en-AU-Neural2-B',  // Australian Male
]

const ChatAssistant = () => {
  const { t, i18n } = useTranslation()
  const config = useSolarStore((s) => s.config)
  const setConfigValue = useSolarStore((s) => s.setConfigValue)
  const snapshot = buildModelSnapshot(config)
  const { items: cartItems, checkCompatibility, getMissingComponents, addItem } = useCartStore()
  const { apiKeys: googleApiKeys } = useGoogleApiStore()
  const {
    getProviderKey,
    hasProviderKey,
    clearProviderKey,
    loading,
    setLoading,
    provider,
    setProvider,
    model,
    preferredVoice,
    setPreferredVoice,
    setModel,
    conversations,
    activeConversationId,
    createConversation,
    deleteConversation,
    switchConversation,
    addMessage,
    providerKeys,
  } = useChatStore()

  const activeConv = conversations.find((c) => c.id === activeConversationId) || conversations[0]
  const messages = useMemo(() => activeConv?.messages ?? [], [activeConv])
  
  const availableProviders = useMemo(() => {
    const providers = (Object.keys(providerKeys) as any[]).filter(p => providerKeys[p]?.trim())
    if (googleApiKeys.unified && !providers.includes('google')) {
      providers.push('google')
    }
    return providers
  }, [providerKeys, googleApiKeys.unified])

  const currentProviderKey = getProviderKey(provider)

  const [input, setInput] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [listening, setListening] = useState(false)
  const [recognitionSupported, setRecognitionSupported] = useState(false)
  const [ttsSupported, setTtsSupported] = useState(false)
  const [useAiVoice, setUseAiVoice] = useState(true)
  const [liveMode, setLiveMode] = useState(false)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const lastAssistantRef = useRef<string>('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shouldSendOnStop = useRef(false)
  const lastPlayedMsgId = useRef<string | null>(null)
  const inputRef = useRef('')
  const isSpeakingRef = useRef(false)

  // Keep inputRef in sync with input state
  useEffect(() => {
    inputRef.current = input
  }, [input])

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = '3rem'
    const scrollHeight = textareaRef.current.scrollHeight
    const maxHeightPx = 9 * 16 // 9rem
    textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeightPx)}px`
  }, [input])

  // Auto-play response when new assistant message arrives
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role === 'assistant' && lastMsg.id !== lastPlayedMsgId.current) {
      lastPlayedMsgId.current = lastMsg.id
      // Only auto-play if user has enabled AI voice or we have TTS support
      if (useAiVoice || ttsSupported) {
        // Small delay to ensure state is settled
        setTimeout(() => speakLastAssistant(), 500)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, useAiVoice, ttsSupported])

  // Auto-select first available provider if current one has no key
  useEffect(() => {
    if (!hasProviderKey(provider) && availableProviders.length > 0) {
      setProvider(availableProviders[0])
    }
  }, [provider, hasProviderKey, availableProviders, setProvider])

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
      const confirmed = confirm(`You already have 5 chats. Delete the oldest conversation ("${oldestLabel}") to start a new one?`)
      if (!confirmed) {
        return
      }
      if (oldest) {
        deleteConversation(oldest.id)
      }
    }
    createConversation()
  }

  const executeTool = (toolCall: any) => {
    console.log('Executing tool:', toolCall)
    try {
      switch (toolCall.type) {
        case 'navigate':
          if (toolCall.tab) {
            window.dispatchEvent(new CustomEvent('open-dashboard-tab', { detail: { tab: toolCall.tab } }))
          }
          break
        case 'updateConfig':
          if (toolCall.key && toolCall.value !== undefined) {
            setConfigValue(toolCall.key, toolCall.value)
          }
          break
        case 'addToCart':
          if (toolCall.item) {
            console.log('Adding to cart:', toolCall.item)
          }
          break
        case 'analyzeGraph':
           window.dispatchEvent(new CustomEvent('open-dashboard-tab', { detail: { tab: 'aiOverview' } }))
           break
        default:
          console.warn('Unknown tool:', toolCall.type)
      }
    } catch (e) {
      console.error('Tool execution failed:', e)
    }
  }

  const handleSend = async () => {
    const currentInput = inputRef.current
    if (!currentInput.trim()) return
    const question = currentInput.trim()
    setInput('')
    addMessage('user', question)

    // Get the appropriate API key based on provider
    let apiKey = currentProviderKey
    // For Google/Gemini, also check unified/separate Google API keys
    if (provider === 'google' && !apiKey) {
      apiKey = googleApiKeys.unified || googleApiKeys.gemini || null
    }

    if (!apiKey) {
      addMessage(
        'assistant',
        `Please configure your ${
          provider === 'google'
            ? 'Google/Gemini'
            : provider === 'openai'
            ? 'OpenAI'
            : provider === 'anthropic'
            ? 'Anthropic'
            : 'xAI'
        } API key in the APIs tab.`,
      )
      return
    }

    setLoading(true)
    let attachments: FileUpload[] = []
    try {
      if (images.length > 0) {
        attachments = await readFileUploads(images)
      }

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

      const knowledge = 'Solar Concepts: PV efficiency, degradation (~0.5%/yr), inverter life, BOS costs, peak sun hours, ROI, break-even, battery autonomy. Provide practical, concise guidance. For shopping: validate specs, check NEC (690/705/706), suggest compatible components, warn about mismatches.'

      const toolInstructions = `
You can control the app UI. To perform an action, append a JSON block at the END of your message like this:
<<<ACTIONS: [{"type": "navigate", "tab": "shopping"}, {"type": "updateConfig", "key": "monthlyUsage", "value": 500}]>>>

Available Tools:
- navigate(tab: "financial" | "production" | "battery" | "shopping" | "apis" | "api-usage" | "solarIntegration" | "datasheet" | "aiOverview")
- updateConfig(key: string, value: any) - keys: monthlyUsage, address, panelCount, etc.
- analyzeGraph() - Opens AI Overview tab
`

      const chatMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        {
          role: 'system',
          content:
            'You are a helpful solar PV assistant. Keep responses EXTREMELY BRIEF, CLEAR, and PRACTICAL. Use bullet points. Avoid long explanations. Focus on actionable advice. Celebrate good choices, flag concerns. Do not output long blocks of text.',
        },
        { role: 'system', content: knowledge },
        { role: 'system', content: toolInstructions },
        { role: 'system', content: contextBlob + cartContext },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: question },
      ]

      let result
      if (provider === 'google') {
        const imagePayload = attachments.map((file) => ({
          mimeType: file.type || 'image/png',
          data: file.data,
        }))
        result = await callGeminiFlash(apiKey, model, chatMessages, imagePayload, attachments)
      } else if (provider === 'anthropic') {
        result = await callClaude(apiKey, model, chatMessages, attachments)
      } else if (provider === 'grok') {
        result = await callGrok(apiKey, model, chatMessages, attachments)
      } else {
        result = await callOpenAI(apiKey, model, chatMessages, attachments)
      }

      if (!result.ok) {
        addMessage('assistant', `API error: ${result.error}`)
      } else {
        // Parse for tools
        const content = result.content
        const actionBlockRegex = /<<<ACTIONS: (.*?)>>>/s
        const match = content.match(actionBlockRegex)
        
        let finalContent = content
        if (match) {
          try {
            const actions = JSON.parse(match[1])
            if (Array.isArray(actions)) {
              actions.forEach(executeTool)
            }
            // Remove the action block from the displayed message
            finalContent = content.replace(match[0], '').trim()
          } catch (e) {
            console.error('Failed to parse actions:', e)
          }
        }
        
        addMessage('assistant', finalContent)
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
    // Insert preset guidance message once if no keys configured
    if (availableProviders.length === 0) {
      const already = messages.some(m => m.role === 'assistant' && m.content.includes('Configure your API key'))
      if (!already) {
        addMessage('assistant', 'Configure your AI provider keys in the APIs tab to start chatting. You can add Google Gemini, OpenAI, Anthropic Claude, or xAI Grok.')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('panel-collapsed', { detail: { side: 'right', collapsed } }))
  }, [collapsed])

  useEffect(() => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
    if (lastAssistant) lastAssistantRef.current = lastAssistant.content
  }, [messages])

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) setRecognitionSupported(true)
    if ('speechSynthesis' in window) setTtsSupported(true)
  }, [])

  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined
    const synth = window.speechSynthesis
    const refreshVoices = () => {
      const voices = synth.getVoices().filter(v => v.name && v.lang)
      setAvailableVoices(voices)
    }
    refreshVoices()
    synth.addEventListener('voiceschanged', refreshVoices)
    return () => synth.removeEventListener('voiceschanged', refreshVoices)
  }, [])

  const readFileUploads = (files: File[]): Promise<FileUpload[]> =>
    Promise.all(
      files.map((file) =>
        new Promise<FileUpload>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = (reader.result as string) || ''
            const payload = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
            resolve({
              name: file.name,
              type: file.type || 'application/octet-stream',
              size: file.size,
              data: payload,
            })
          }
          reader.onerror = () => {
            resolve({
              name: file.name,
              type: file.type || 'application/octet-stream',
              size: file.size,
              data: '',
            })
          }
          reader.readAsDataURL(file)
        }),
      ),
    )

  // Stop all voice activity (speaking and listening)
  const stopAllVoiceActivity = () => {
    // Stop speech synthesis
    window.speechSynthesis.cancel()
    isSpeakingRef.current = false
    
    // Stop recognition
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
    const rec = (window as any).__activeRecognition
    if (rec) {
      try {
        rec.stop()
      } catch (e) {
        // Already stopped
      }
    }
    setListening(false)
    if (textareaRef.current) textareaRef.current.placeholder = 'Ask a question about system sizing, ROI, production...'
  }

  const startListening = () => {
    // Don't start if already listening
    if (listening) return
    
    // Stop any current speech when starting to listen
    stopAllVoiceActivity()

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
      
      // Silence detection for auto-send
      if (silenceTimer.current) clearTimeout(silenceTimer.current)
      silenceTimer.current = setTimeout(() => {
        shouldSendOnStop.current = true
        stopListening()
      }, 2000) // 2 seconds of silence triggers send
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => {
      setListening(false)
      if (shouldSendOnStop.current) {
        shouldSendOnStop.current = false
        // Small delay to allow state update to settle
        setTimeout(() => handleSend(), 100)
      }
    }
    rec.start()
    ;(window as any).__activeRecognition = rec
    setListening(true)
    shouldSendOnStop.current = false
  }

  const stopListening = () => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
    const rec = (window as any).__activeRecognition
    if (rec) rec.stop()
    setListening(false)
    if (textareaRef.current) textareaRef.current.placeholder = 'Ask a question about system sizing, ROI, production...'
  }

  const speakLastAssistant = async () => {
    const text = lastAssistantRef.current
    if (!text) return
    
    // Stop listening if active
    if (listening) {
      stopListening()
    }
    
    // Stop any current speech
    window.speechSynthesis.cancel()
    isSpeakingRef.current = true

    const onSpeechEnd = () => {
      isSpeakingRef.current = false
      // If Live Mode is on, start listening again after speech ends
      if (liveMode) {
        setTimeout(() => startListening(), 300)
      }
    }

    // Prefer AI voice when available
    if (useAiVoice) {
      try {
        let blob: Blob | null = null
        
        // Google provider: use Google Cloud TTS
        if (provider === 'google') {
          const apiKey = googleApiKeys.unified || googleApiKeys.gemini
          if (apiKey) {
            const voice = GOOGLE_VOICES.includes(preferredVoice || '') ? preferredVoice : 'en-US-Neural2-A'
            blob = await googleTts(apiKey, text.slice(0, 5000), (voice as any), 'mp3')
          }
        }
        // OpenAI provider: use OpenAI TTS
        else if (provider === 'openai') {
          const apiKey = getProviderKey('openai')
          if (apiKey) {
            const voice = OPENAI_VOICES.includes(preferredVoice || '') ? preferredVoice : 'alloy'
            blob = await openaiTts(apiKey, text.slice(0, 2000), (voice as any), 'mp3')
          }
        }
        
        if (blob) {
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audio.onended = () => {
            URL.revokeObjectURL(url)
            onSpeechEnd()
          }
          audio.play().catch(e => {
            console.error('Audio play failed', e)
            onSpeechEnd()
          })
          return
        }
      } catch (e) {
        // Fall back to system/browser TTS on failure
        console.warn('AI TTS failed, falling back to browser TTS:', e)
      }
    }
    if (!ttsSupported) {
      onSpeechEnd()
      return
    }
    
    const utter = new SpeechSynthesisUtterance(text.slice(0, 1200))
    if (preferredVoice) {
      const matching = availableVoices.find((voice) => voice.voiceURI === preferredVoice || voice.name === preferredVoice)
      if (matching) utter.voice = matching
    }
    utter.rate = 1
    utter.pitch = 1
    utter.volume = 1
    utter.onend = onSpeechEnd
    utter.onerror = onSpeechEnd
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
          <h3 className="text-lg font-semibold mb-1">{t('chat.title')}</h3>
          <p className="text-xs text-slate-300">{t('chat.subtitle')}</p>
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => switchConversation(conv.id)}
            className={`group relative flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition ${
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
          title={t('chat.newChat')}
        >
          + New
        </button>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap gap-2 items-start">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Provider">
            {availableProviders.includes('google' as any) && (
              <button
                type="button"
                onClick={() => setProvider('google')}
                className={provider === 'google' ? 'tab-pill tab-pill--active text-xs' : 'tab-pill tab-pill--idle text-xs'}
              >
                Google
              </button>
            )}
            {availableProviders.includes('openai' as any) && (
              <button
                type="button"
                onClick={() => setProvider('openai')}
                className={provider === 'openai' ? 'tab-pill tab-pill--active text-xs' : 'tab-pill tab-pill--idle text-xs'}
              >
                OpenAI
              </button>
            )}
            {availableProviders.includes('anthropic' as any) && (
              <button
                type="button"
                onClick={() => setProvider('anthropic')}
                className={provider === 'anthropic' ? 'tab-pill tab-pill--active text-xs' : 'tab-pill tab-pill--idle text-xs'}
              >
                Claude
              </button>
            )}
            {availableProviders.includes('grok' as any) && (
              <button
                type="button"
                onClick={() => setProvider('grok')}
                className={provider === 'grok' ? 'tab-pill tab-pill--active text-xs' : 'tab-pill tab-pill--idle text-xs'}
              >
                Grok
              </button>
            )}
          </div>

          {availableProviders.length > 0 && (
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="premium-select rounded-xl border border-white/10 bg-slate-900 px-2 py-2 text-xs focus:outline-none focus:border-white/30 min-w-[140px] text-white"
            >
              {provider === 'google' && (
                <>
                  <option value="gemini-3.0-pro-exp" className="bg-slate-900">gemini-3.0-pro-exp</option>
                  <option value="gemini-2.5-pro" className="bg-slate-900">gemini-2.5-pro</option>
                  <option value="gemini-2.5-flash" className="bg-slate-900">gemini-2.5-flash</option>
                  <option value="gemini-2.0-ultra" className="bg-slate-900">gemini-2.0-ultra</option>
                  <option value="gemini-2.0-flash" className="bg-slate-900">gemini-2.0-flash</option>
                  <option value="gemini-1.5-pro" className="bg-slate-900">gemini-1.5-pro</option>
                  <option value="gemini-1.5-flash" className="bg-slate-900">gemini-1.5-flash</option>
                  <option value="gemini-exp-1206" className="bg-slate-900">gemini-exp-1206</option>
                </>
              )}
              {provider === 'openai' && (
                <>
                  <option value="gpt-5.1" className="bg-slate-900">gpt-5.1</option>
                  <option value="gpt-5" className="bg-slate-900">gpt-5</option>
                  <option value="gpt-4.1" className="bg-slate-900">gpt-4.1</option>
                  <option value="gpt-4o" className="bg-slate-900">gpt-4o</option>
                  <option value="gpt-4o-mini" className="bg-slate-900">gpt-4o-mini</option>
                  <option value="gpt-4-turbo" className="bg-slate-900">gpt-4-turbo</option>
                  <option value="gpt-3.5-turbo" className="bg-slate-900">gpt-3.5-turbo</option>
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
          )}

          {availableProviders.length === 0 ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-dashboard-tab', { detail: { tab: 'apis' } }))}
              className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-slate-950 transition hover:brightness-110"
            >
              {t('chat.configureApis')}
            </button>
          ) : hasProviderKey(provider) ? (
            <button
              type="button"
              onClick={() => clearProviderKey(provider)}
              className="rounded-xl bg-red-500/80 px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110"
              title={`Clear ${provider} key`}
            >
              {t('chat.clearKey')}
            </button>
          ) : (provider === 'google' && googleApiKeys.unified) ? (
             <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-dashboard-tab', { detail: { tab: 'apis' } }))}
              className="rounded-xl bg-blue-500/80 px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110"
              title="Managed via Unified Key"
            >
              Unified Key Active
            </button>
          ) : (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-dashboard-tab', { detail: { tab: 'apis' } }))}
              className="rounded-xl bg-yellow-500/80 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:brightness-110"
            >
              Configure {provider}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 modern-scroll min-h-0 w-full">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === 'user'
                ? 'rounded-2xl bg-accent/20 border border-accent/40 px-3 py-2 text-xs max-w-full break-words overflow-hidden'
                : 'rounded-2xl bg-white/10 border border-white/10 px-3 py-2 text-xs max-w-full break-words overflow-hidden'
            }
            style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
          >
            <p className="mb-1 font-semibold capitalize text-[10px] tracking-wide opacity-70">{m.role}</p>
            <p className="whitespace-pre-wrap leading-relaxed break-words">{m.content}</p>
          </div>
        ))}
        {loading && <div className="text-xs text-slate-300 typing-dots"><span></span><span></span><span></span></div>}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            placeholder={t('chat.placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="flex-1 resize-none overflow-hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
            style={{ minHeight: '3rem', maxHeight: '9rem' }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading}
            className="rounded-xl bg-accent px-4 h-12 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-40 flex items-center justify-center"
            style={{ minWidth: '70px' }}
          >
            {t('chat.send')}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
          {recognitionSupported ? (
            listening ? (
              <button
                type="button"
                onClick={stopListening}
                className="inline-flex h-9 items-center rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 font-semibold text-rose-200 hover:bg-rose-500/30"
              >
                {t('chat.stopVoice')}
              </button>
            ) : (
              <button
                type="button"
                onClick={startListening}
                className="inline-flex h-9 items-center rounded-lg border border-accent/50 bg-accent/20 px-3 font-semibold text-accent hover:bg-accent/30"
              >
                {t('chat.startVoice')}
              </button>
            )
          ) : (
            <span className="text-[10px] text-slate-500">Voice input unsupported in this browser.</span>
          )}
          {ttsSupported && (
            <button
              type="button"
              onClick={speakLastAssistant}
              disabled={!lastAssistantRef.current}
              className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-white/5 px-3 font-semibold text-white/80 hover:border-accent hover:text-white disabled:opacity-40"
            >Play Last Reply</button>
          )}
          <label className="glow-toggle">
            <input type="checkbox" checked={liveMode} onChange={(e) => setLiveMode(e.target.checked)} />
            <span className="glow-toggle-slider"></span>
            <span className="text-[10px] text-slate-300">{t('chat.liveChat')}</span>
          </label>
          {(provider === 'openai' || provider === 'google') && (
            <div className="tooltip-group relative">
              <label className="glow-toggle">
                <input 
                  type="checkbox" 
                  checked={useAiVoice} 
                  onChange={(e) => {
                    setUseAiVoice(e.target.checked)
                    if (e.target.checked) {
                      // Show brief notification about API usage
                      setTimeout(() => {
                        const tooltip = document.getElementById('ai-voice-tooltip')
                        if (tooltip) {
                          tooltip.style.opacity = '1'
                          setTimeout(() => {
                            tooltip.style.opacity = '0'
                          }, 3000)
                        }
                      }, 100)
                    }
                  }} 
                />
                <span className="glow-toggle-slider"></span>
                <span className="text-[10px] text-slate-300">{t('chat.useAiVoice')}</span>
              </label>
              <div 
                id="ai-voice-tooltip"
                className="tooltip-content absolute bottom-full left-0 mb-2 w-64 rounded-lg bg-slate-800 p-3 text-xs text-slate-200 shadow-xl border border-white/10 opacity-0 transition-opacity duration-300 pointer-events-none z-50"
                style={{ transition: 'opacity 0.3s ease' }}
              >
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-amber-400 mb-1">Higher API Usage</p>
                    <p>AI voices consume more API quota. Each response uses additional calls to {provider === 'google' ? 'Google Cloud Text-to-Speech' : 'OpenAI TTS'} API.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {ttsSupported && (availableVoices.length > 0 || provider === 'openai' || provider === 'google') && (
            <div className="flex items-center gap-1 text-[10px] text-slate-300">
              <label htmlFor="preferred-voice" className="whitespace-nowrap text-[10px] text-slate-400">Voice</label>
              <select
                id="preferred-voice"
                value={preferredVoice || ''}
                onChange={(e) => setPreferredVoice(e.target.value || null)}
                className="premium-select rounded-xl border border-white/10 bg-slate-900 px-2 py-1 text-[10px] text-white focus:outline-none focus:border-white/30 max-w-[150px] min-w-[100px]"
              >
                <option value="" className="bg-slate-900 text-white">System Default</option>
                {provider === 'google' && (
                  <optgroup label="Google Cloud Voices" className="bg-slate-900 text-white">
                    {GOOGLE_VOICES.map((v) => {
                      const label = v.replace('en-', '').replace('-Neural2-', ' ').replace('-', ' ')
                      return (
                        <option key={v} value={v} className="bg-slate-900 text-white">{label}</option>
                      )
                    })}
                  </optgroup>
                )}
                {provider === 'openai' && (
                  <optgroup label="OpenAI Voices" className="bg-slate-900 text-white">
                    {OPENAI_VOICES.map((v) => (
                      <option key={v} value={v} className="bg-slate-900 text-white capitalize">{v}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="System Voices" className="bg-slate-900 text-white">
                  {availableVoices
                    .filter(voice => !i18n.language || voice.lang.startsWith(i18n.language) || voice.lang.startsWith('en')) // Filter by language
                    .map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI} className="bg-slate-900 text-white">
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}
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
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-white/80 transition hover:border-accent hover:text-white"
          >
            <span className="text-base">+</span>
            {t('chat.uploadFiles')}
          </button>
          {images.length > 0 && (
            <span className="text-[10px] text-slate-200">
              {images.length} file(s) attached — Gemini uploads inline, while other providers receive base64 summaries for richer context.
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-slate-400">Keys stored locally. For production, route requests through a secure backend and add rate limiting. Voice features use browser SpeechRecognition & speechSynthesis APIs.</p>
    </div>
  )
}

export default ChatAssistant
