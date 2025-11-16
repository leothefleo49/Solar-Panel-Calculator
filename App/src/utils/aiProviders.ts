// Utility functions for calling different AI providers without exposing keys directly.
// Keys should be supplied at runtime via UI or environment variables.

import { useApiUsageStore } from '../state/apiUsageStore';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIProviderResult {
  ok: boolean
  content: string
  error?: string
}

// OpenAI chat completion wrapper (non-streaming)
export async function callOpenAI(apiKey: string, model: string, messages: AIMessage[]): Promise<AIProviderResult> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.3 }),
    })
    if (!res.ok) {
      return { ok: false, content: '', error: `${res.status} ${res.statusText}` }
    }
    const data = await res.json()
    const answer = data.choices?.[0]?.message?.content?.trim() || 'No response.'
    
    // Track usage with token count
    const tokens = data.usage?.total_tokens || 0
    useApiUsageStore.getState().trackUsage('openai', 1, tokens, model)
    
    return { ok: true, content: answer }
  } catch (e: any) {
    return { ok: false, content: '', error: e.message }
  }
}

// xAI Grok chat completion wrapper (OpenAI-compatible schema)
export async function callGrok(apiKey: string, model: string, messages: AIMessage[]): Promise<AIProviderResult> {
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.3 }),
    })
    if (!res.ok) {
      return { ok: false, content: '', error: `${res.status} ${res.statusText}` }
    }
    const data = await res.json()
    const answer = data.choices?.[0]?.message?.content?.trim() || 'No response.'
    
    // Track usage with token count
    const tokens = data.usage?.total_tokens || 0
    useApiUsageStore.getState().trackUsage('grok', 1, tokens, model)
    
    return { ok: true, content: answer }
  } catch (e: any) {
    return { ok: false, content: '', error: e.message }
  }
}

// Google Gemini 2.5 Flash wrapper (generateContent)
// Supports optional image inline_data (base64) attachments.
export async function callGeminiFlash(
  apiKey: string,
  model: string,
  messages: AIMessage[],
  images: Array<{ mimeType: string; data: string }> = [],
): Promise<AIProviderResult> {
  try {
    // Convert chat-style messages to Gemini parts.
    type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } }
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }] as GeminiPart[],
    }))
    // Attach images to last user message if present
    if (images.length > 0) {
      const last = contents[contents.length - 1]
      last.parts.push(...images.map((img) => ({ inline_data: { mime_type: img.mimeType, data: img.data } } as GeminiPart)))
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { temperature: 0.3 } }),
    })
    if (!res.ok) {
      return { ok: false, content: '', error: `${res.status} ${res.statusText}` }
    }
    const data = await res.json()
    const answer = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n')?.trim() || 'No response.'
    
    // Track usage with token count (Gemini may not always provide usage metadata)
    const tokens = data.usageMetadata?.totalTokenCount || 0
    useApiUsageStore.getState().trackUsage('google-gemini', 1, tokens, model)
    
    return { ok: true, content: answer }
  } catch (e: any) {
    return { ok: false, content: '', error: e.message }
  }
}

// Anthropic Claude wrapper (Messages API)
export async function callClaude(apiKey: string, model: string, messages: AIMessage[]): Promise<AIProviderResult> {
  try {
    // Separate system messages from user/assistant
    const systemMessages = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n')
    const conversationMessages = messages.filter((m) => m.role !== 'system').map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }))

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        temperature: 0.3,
        system: systemMessages || undefined,
        messages: conversationMessages,
      }),
    })
    if (!res.ok) {
      return { ok: false, content: '', error: `${res.status} ${res.statusText}` }
    }
    const data = await res.json()
    const answer = data.content?.[0]?.text?.trim() || 'No response.'
    
    // Track usage with token count
    const tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
    useApiUsageStore.getState().trackUsage('anthropic', 1, tokens, model)
    
    return { ok: true, content: answer }
  } catch (e: any) {
    return { ok: false, content: '', error: e.message }
  }
}
