import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export type Conversation = {
  id: string
  title: string
  messages: ChatMessage[]
  lastUsed: number
}

type Provider = 'google' | 'openai' | 'anthropic' | 'grok'

type ProviderKeys = {
  google?: string
  openai?: string
  anthropic?: string
  grok?: string
}

const defaultModelByProvider: Record<Provider, string> = {
  google: 'gemini-2.5-pro',
  openai: 'gpt-5',
  anthropic: 'claude-3.5-sonnet-latest',
  grok: 'grok-2',
}

interface ChatState {
  // Legacy single key support (deprecated but kept for backward compat)
  apiKey: string | null
  // New multi-provider keys
  providerKeys: ProviderKeys
  provider: Provider
  model: string
  loading: boolean
  conversations: Conversation[]
  activeConversationId: string
  // Legacy methods
  setApiKey: (key: string) => void
  clearApiKey: () => void
  // New multi-provider methods
  setProviderKey: (provider: Provider, key: string) => void
  clearProviderKey: (provider: Provider) => void
  getProviderKey: (provider: Provider) => string | null
  hasProviderKey: (provider: Provider) => boolean
  getAvailableProviders: () => Provider[]
  // Common methods
  setProvider: (p: Provider) => void
  setModel: (m: string) => void
  addMessage: (role: ChatMessage['role'], content: string) => void
  sendMessage: (content: string) => Promise<void>
  setLoading: (value: boolean) => void
  replaceLastAssistant: (content: string) => void
  createConversation: () => void
  deleteConversation: (id: string) => void
  switchConversation: (id: string) => void
  setConversationTitle: (id: string, title: string) => void
}

const createNewConversation = (): Conversation => ({
  id: crypto.randomUUID(),
  title: 'New Chat',
  messages: [],
  lastUsed: Date.now(),
})

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      providerKeys: {},
      provider: 'google',
      model: defaultModelByProvider.google,
      loading: false,
      conversations: [createNewConversation()],
      activeConversationId: '',
      // Legacy single key (maps to current provider)
      setApiKey: (key) => {
        const provider = get().provider
        set((state) => ({
          apiKey: key.trim() || null,
          providerKeys: { ...state.providerKeys, [provider]: key.trim() || undefined }
        }))
      },
      clearApiKey: () => {
        const provider = get().provider
        set((state) => {
          const updated = { ...state.providerKeys }
          delete updated[provider]
          return { apiKey: null, providerKeys: updated }
        })
      },
      // New multi-provider methods
      setProviderKey: (provider, key) =>
        set((state) => ({
          providerKeys: { ...state.providerKeys, [provider]: key.trim() || undefined },
          // Update legacy apiKey if setting current provider
          apiKey: state.provider === provider ? (key.trim() || null) : state.apiKey
        })),
      clearProviderKey: (provider) =>
        set((state) => {
          const updated = { ...state.providerKeys }
          delete updated[provider]
          return {
            providerKeys: updated,
            // Clear legacy apiKey if clearing current provider
            apiKey: state.provider === provider ? null : state.apiKey
          }
        }),
      getProviderKey: (provider) => {
        const keys = get().providerKeys
        return keys[provider] || null
      },
      hasProviderKey: (provider) => {
        const keys = get().providerKeys
        return !!(keys[provider]?.trim())
      },
      getAvailableProviders: () => {
        const keys = get().providerKeys
        return (Object.keys(keys) as Provider[]).filter(p => keys[p]?.trim())
      },
      setProvider: (p) => {
        const keys = get().providerKeys
        set({
          provider: p,
          model: defaultModelByProvider[p],
          // Update legacy apiKey to match selected provider
          apiKey: keys[p] || null
        })
      },
      setModel: (m) => set({ model: m }),
      addMessage: (role, content) =>
        set((state) => {
          const activeId = state.activeConversationId || state.conversations[0]?.id
          if (!activeId) return state
          const updated = state.conversations.map((conv) =>
            conv.id === activeId
              ? {
                  ...conv,
                  messages: [
                    ...conv.messages,
                    { id: crypto.randomUUID(), role, content, timestamp: Date.now() },
                  ],
                  lastUsed: Date.now(),
                  title: conv.messages.length === 0 && role === 'user' ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : conv.title,
                }
              : conv,
          )
          return { conversations: updated, activeConversationId: activeId }
        }),
      sendMessage: async (content) => {
        set((state) => {
          const activeId = state.activeConversationId || state.conversations[0]?.id
          if (!activeId) return state
          const updated = state.conversations.map((conv) =>
            conv.id === activeId
              ? {
                  ...conv,
                  messages: [
                    ...conv.messages,
                    { id: crypto.randomUUID(), role: 'user' as const, content, timestamp: Date.now() },
                  ],
                  lastUsed: Date.now(),
                  title: conv.messages.length === 0 ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : conv.title,
                }
              : conv,
          )
          return { conversations: updated, activeConversationId: activeId }
        })
      },
      setLoading: (value) => set({ loading: value }),
      replaceLastAssistant: (content) =>
        set((state) => {
          const activeId = state.activeConversationId || state.conversations[0]?.id
          if (!activeId) return state
          const updated = state.conversations.map((conv) => {
            if (conv.id !== activeId) return conv
            const idx = [...conv.messages].reverse().findIndex((m) => m.role === 'assistant')
            if (idx === -1) return conv
            const revIndex = conv.messages.length - 1 - idx
            const updatedMessages = [...conv.messages]
            updatedMessages[revIndex] = { ...updatedMessages[revIndex], content }
            return { ...conv, messages: updatedMessages, lastUsed: Date.now() }
          })
          return { conversations: updated }
        }),
      createConversation: () =>
        set((state) => {
          if (state.conversations.length >= 5) {
            return state
          }
          const newConv = createNewConversation()
          return { conversations: [...state.conversations, newConv], activeConversationId: newConv.id }
        }),
      deleteConversation: (id) =>
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id)
          if (filtered.length === 0) {
            const newConv = createNewConversation()
            return { conversations: [newConv], activeConversationId: newConv.id }
          }
          const newActiveId = state.activeConversationId === id ? filtered[0].id : state.activeConversationId
          return { conversations: filtered, activeConversationId: newActiveId }
        }),
      switchConversation: (id) =>
        set((state) => {
          const updated = state.conversations.map((conv) =>
            conv.id === id ? { ...conv, lastUsed: Date.now() } : conv,
          )
          return { conversations: updated, activeConversationId: id }
        }),
      setConversationTitle: (id, title) =>
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, title } : conv,
          ),
        })),
    }),
    {
      name: 'solar-chat-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        providerKeys: state.providerKeys,
        provider: state.provider,
        model: state.model,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
)

// Initialize activeConversationId after store is created
useChatStore.setState((state) => ({
  activeConversationId: state.conversations[0]?.id || '',
}))
