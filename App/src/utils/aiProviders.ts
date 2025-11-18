// Utility functions for calling different AI providers without exposing keys directly.
// Keys should be supplied at runtime via UI or environment variables.

import { useApiUsageStore } from '../state/apiUsageStore';
import { logError, logWarning } from './errorLogger';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIProviderResult {
  ok: boolean
  content: string
  error?: string
}

export async function openaiTts(apiKey: string, text: string, voice: string = 'alloy', format: 'mp3'|'wav' = 'mp3'): Promise<Blob> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: 'gpt-4o-mini-tts', input: text, voice, format }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const msg = data.error?.message || res.statusText
    await logError(`OpenAI TTS error (${res.status}): ${msg}`, undefined, 'api', 'OpenAI TTS')
    throw new Error(msg)
  }
  const arrayBuf = await res.arrayBuffer()
  return new Blob([arrayBuf], { type: format === 'wav' ? 'audio/wav' : 'audio/mpeg' })
}

export interface FileUpload {
  name: string
  type: string
  size: number
  data: string
}

const includeAttachmentMessages = (messages: AIMessage[], attachments?: FileUpload[]): AIMessage[] => {
  if (!attachments || attachments.length === 0) return messages
  const attachmentNotes = attachments.map((file) => {
    const mimeType = file.type || 'application/octet-stream'
    const sizeKb = Math.max(1, Math.round(file.size / 1024))
    return {
      role: 'system' as const,
      content: `Attached file: ${file.name} (${mimeType}, ${sizeKb} KB)\nBase64 data: data:${mimeType};base64,${file.data}`,
    }
  })
  return [...messages, ...attachmentNotes]
}

// OpenAI chat completion wrapper (non-streaming)
export async function callOpenAI(apiKey: string, model: string, messages: AIMessage[], attachments?: FileUpload[]): Promise<AIProviderResult> {
  try {
    const finalMessages = includeAttachmentMessages(messages, attachments)
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages: finalMessages, temperature: 0.3, max_tokens: 800 }),
    })
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const errorMsg = data.error?.message || res.statusText
      const detailedError = `OpenAI API Error (${res.status}): ${errorMsg}`
      
      await logError(
        detailedError,
        undefined,
        'api',
        `OpenAI API call to ${model}`
      )
      
      // Provide user-friendly error messages
      if (res.status === 401) {
        return { ok: false, content: '', error: 'Invalid API key. Please check your OpenAI key in Settings > APIs.' }
      } else if (res.status === 429) {
        return { ok: false, content: '', error: 'Rate limit exceeded. Please wait a moment and try again.' }
      } else if (res.status === 400 && errorMsg.includes('model')) {
        return { ok: false, content: '', error: `Model "${model}" not available. Check your OpenAI account.` }
      }
      
      return { ok: false, content: '', error: detailedError }
    }
    
    const data = await res.json()
    const answer = data.choices?.[0]?.message?.content?.trim()
    
    if (!answer) {
      await logWarning('OpenAI returned empty response', 'api')
      return { ok: false, content: '', error: 'OpenAI returned an empty response. The model may have refused to generate content or encountered an issue. Try rephrasing your request.' }
    }
    
    // Track usage with token count
    const tokens = data.usage?.total_tokens || 0
    useApiUsageStore.getState().trackUsage('openai', 1, tokens, model)
    
    return { ok: true, content: answer }
  } catch (e: any) {
    const errorMsg = e.message || 'Unknown network error'
    await logError(
      `OpenAI network error: ${errorMsg}`,
      e,
      'network',
      `OpenAI API call to ${model}`
    )
    
    if (errorMsg.includes('Failed to fetch')) {
      return { ok: false, content: '', error: 'Network error: Could not connect to OpenAI. Check your internet connection.' }
    }
    
    return { ok: false, content: '', error: `Request failed: ${errorMsg}` }
  }
}

// xAI Grok chat completion wrapper (OpenAI-compatible schema)
export async function callGrok(apiKey: string, model: string, messages: AIMessage[], attachments?: FileUpload[]): Promise<AIProviderResult> {
  try {
    const finalMessages = includeAttachmentMessages(messages, attachments)
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages: finalMessages, temperature: 0.3, max_tokens: 800 }),
    })
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const errorMsg = data.error?.message || res.statusText
      const detailedError = `Grok API Error (${res.status}): ${errorMsg}`
      
      await logError(
        detailedError,
        undefined,
        'api',
        `Grok API call to ${model}`
      )
      
      if (res.status === 401) {
        return { ok: false, content: '', error: 'Invalid API key. Please check your xAI key in Settings > APIs.' }
      } else if (res.status === 429) {
        return { ok: false, content: '', error: 'Rate limit exceeded. Please wait a moment and try again.' }
      }
      
      return { ok: false, content: '', error: detailedError }
    }
    
    const data = await res.json()
    const answer = data.choices?.[0]?.message?.content?.trim()
    
    if (!answer) {
      await logWarning('Grok returned empty response', 'api')
      return { ok: false, content: '', error: 'Grok returned an empty response. The model may have refused to generate content or encountered an issue. Try rephrasing your request.' }
    }
    
    // Track usage with token count
    const tokens = data.usage?.total_tokens || 0
    useApiUsageStore.getState().trackUsage('grok', 1, tokens, model)
    
    return { ok: true, content: answer }
  } catch (e: any) {
    const errorMsg = e.message || 'Unknown network error'
    await logError(
      `Grok network error: ${errorMsg}`,
      e,
      'network',
      `Grok API call to ${model}`
    )
    
    if (errorMsg.includes('Failed to fetch')) {
      return { ok: false, content: '', error: 'Network error: Could not connect to xAI. Check your internet connection.' }
    }
    
    return { ok: false, content: '', error: `Request failed: ${errorMsg}` }
  }
}

// Google Gemini 2.5 Flash wrapper (generateContent)
// Supports optional image inline_data (base64) attachments.
export async function callGeminiFlash(
  apiKey: string,
  model: string,
  messages: AIMessage[],
  images: Array<{ mimeType: string; data: string }> = [],
  attachments?: FileUpload[],
): Promise<AIProviderResult> {
  try {
    const finalMessages = includeAttachmentMessages(messages, attachments)
    // Convert chat-style messages to Gemini parts.
    type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } }
    const contents = finalMessages.map((m) => ({
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
      body: JSON.stringify({ 
        contents, 
        generationConfig: { 
          temperature: 0.3,
          maxOutputTokens: 800
        } 
      }),
    })
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const errorMsg = data.error?.message || res.statusText
      const detailedError = `Gemini API Error (${res.status}): ${errorMsg}`
      
      await logError(
        detailedError,
        undefined,
        'api',
        `Gemini API call to ${model}`
      )
      
      if (res.status === 400 && errorMsg.includes('API_KEY')) {
        return { ok: false, content: '', error: 'Invalid API key. Please check your Gemini key in Settings > APIs.' }
      } else if (res.status === 429) {
        return { ok: false, content: '', error: 'Rate limit exceeded. Free tier: 15 requests/min. Please wait and try again.' }
      } else if (res.status === 400 && errorMsg.includes('model')) {
        return { ok: false, content: '', error: `Model "${model}" not available. Try gemini-2.0-flash-exp instead.` }
      }
      
      return { ok: false, content: '', error: detailedError }
    }
    
    const data = await res.json()
    
    // Check for safety blocks
    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      await logWarning('Gemini response blocked by safety filters', 'api')
      return { ok: false, content: '', error: 'Response blocked by safety filters. Try rephrasing your question.' }
    }
    
    const answer = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n')?.trim()
    
    if (!answer) {
      await logWarning('Gemini returned empty response', 'api')
      return { ok: false, content: '', error: 'Gemini returned an empty response. The model may have refused to generate content or encountered an issue. Try rephrasing your request.' }
    }
    
    // Track usage with token count (Gemini may not always provide usage metadata)
    const tokens = data.usageMetadata?.totalTokenCount || 0
    useApiUsageStore.getState().trackUsage('google-gemini', 1, tokens, model)
    
    return { ok: true, content: answer }
  } catch (e: any) {
    const errorMsg = e.message || 'Unknown network error'
    await logError(
      `Gemini network error: ${errorMsg}`,
      e,
      'network',
      `Gemini API call to ${model}`
    )
    
    if (errorMsg.includes('Failed to fetch')) {
      return { ok: false, content: '', error: 'Network error: Could not connect to Gemini. Check your internet connection.' }
    }
    
    return { ok: false, content: '', error: `Request failed: ${errorMsg}` }
  }
}

// Anthropic Claude wrapper (Messages API)
export async function callClaude(apiKey: string, model: string, messages: AIMessage[], attachments?: FileUpload[]): Promise<AIProviderResult> {
  try {
    // Separate system messages from user/assistant
    const finalMessages = includeAttachmentMessages(messages, attachments)
    const systemMessages = finalMessages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n')
    const conversationMessages = finalMessages.filter((m) => m.role !== 'system').map((m) => ({
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
        max_tokens: 800,
        temperature: 0.3,
        system: systemMessages || undefined,
        messages: conversationMessages,
      }),
    })
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const errorMsg = data.error?.message || res.statusText
      const detailedError = `Claude API Error (${res.status}): ${errorMsg}`
      
      await logError(
        detailedError,
        undefined,
        'api',
        `Claude API call to ${model}`
      )
      
      if (res.status === 401) {
        return { ok: false, content: '', error: 'Invalid API key. Please check your Anthropic key in Settings > APIs.' }
      } else if (res.status === 429) {
        return { ok: false, content: '', error: 'Rate limit exceeded. Please wait a moment and try again.' }
      } else if (res.status === 400 && errorMsg.includes('credit')) {
        return { ok: false, content: '', error: 'Insufficient credits. Please add credits to your Anthropic account.' }
      }
      
      return { ok: false, content: '', error: detailedError }
    }
    
    const data = await res.json()
    const answer = data.content?.[0]?.text?.trim()
    
    if (!answer) {
      await logWarning('Claude returned empty response', 'api')
      return { ok: false, content: '', error: 'Claude returned an empty response. The model may have refused to generate content or encountered an issue. Try rephrasing your request.' }
    }
    
    // Track usage with token count
    const tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
    useApiUsageStore.getState().trackUsage('anthropic', 1, tokens, model)
    
    return { ok: true, content: answer }
  } catch (e: any) {
    const errorMsg = e.message || 'Unknown network error'
    await logError(
      `Claude network error: ${errorMsg}`,
      e,
      'network',
      `Claude API call to ${model}`
    )
    
    if (errorMsg.includes('Failed to fetch')) {
      return { ok: false, content: '', error: 'Network error: Could not connect to Anthropic. Check your internet connection.' }
    }
    
    return { ok: false, content: '', error: `Request failed: ${errorMsg}` }
  }
}
