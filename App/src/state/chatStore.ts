import { create } from 'zustand'

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

const defaultModelByProvider: Record<Provider, string> = {
  google: 'gemini-2.5-pro',
  openai: 'gpt-5',
  anthropic: 'claude-3.5-sonnet-latest',
  grok: 'grok-2',
}

interface ChatState {
  apiKey: string | null
  provider: Provider
  model: string
  loading: boolean
  conversations: Conversation[]
  activeConversationId: string
  setApiKey: (key: string) => void
  setProvider: (p: Provider) => void
  setModel: (m: string) => void
  addMessage: (role: ChatMessage['role'], content: string) => void
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

export const useChatStore = create<ChatState>((set) => ({
  apiKey: null,
  provider: 'google',
  model: defaultModelByProvider.google,
  loading: false,
  conversations: [createNewConversation()],
  activeConversationId: '',
  setApiKey: (key) => set({ apiKey: key.trim() || null }),
  setProvider: (p) => set({ provider: p, model: defaultModelByProvider[p] }),
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
      // Always keep at least one conversation
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
}))

// Initialize activeConversationId after store is created
useChatStore.setState((state) => ({
  activeConversationId: state.conversations[0]?.id || '',
}))
