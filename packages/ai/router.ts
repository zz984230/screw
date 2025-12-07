export type ProviderName = 'openai' | 'anthropic' | 'gemini' | 'ollama'
export type ProviderConfig = { name: ProviderName; apiKey?: string; baseUrl?: string; model?: string }
export type AskParams = { text: string; sessionId?: string; stream?: boolean; signal?: AbortSignal }
export type AsyncStream<T> = AsyncIterable<T>

export interface Provider {
  ask(params: AskParams): AsyncStream<string>
}

export class AiRouter {
  private providers: Provider[]
  constructor(configs: ProviderConfig[]) {
    this.providers = configs.map(c => createProvider(c)).filter(Boolean) as Provider[]
  }
  async *ask(params: AskParams): AsyncStream<string> {
    for (let i = 0; i < this.providers.length; i++) {
      const p = this.providers[i]
      try {
        for await (const chunk of p.ask(params)) {
          yield chunk
        }
        return
      } catch (e) {
        const isLast = i === this.providers.length - 1
        if (isLast) throw e
        continue
      }
    }
  }
}

function createProvider(c: ProviderConfig): Provider | undefined {
  if (c.name === 'ollama') return new OllamaProvider(c)
  if (c.name === 'openai') return new OpenAIProvider(c)
  return undefined
}

class OllamaProvider implements Provider {
  private baseUrl: string
  private model: string
  constructor(cfg: ProviderConfig) {
    this.baseUrl = cfg.baseUrl || 'http://localhost:11434'
    this.model = cfg.model || 'llama3.2'
  }
  async *ask(params: AskParams): AsyncStream<string> {
    const url = this.baseUrl + '/api/generate'
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, prompt: params.text, stream: true }),
      signal: params.signal
    })
    if (!res.ok || !res.body) throw new Error('ollama_error')
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      const text = decoder.decode(value)
      const lines = text.split('\n').filter(Boolean)
      for (const line of lines) {
        try {
          const j = JSON.parse(line)
          if (typeof j.response === 'string' && j.response.length) yield j.response
        } catch {}
      }
    }
  }
}

class OpenAIProvider implements Provider {
  private baseUrl: string
  private apiKey?: string
  private model: string
  constructor(cfg: ProviderConfig) {
    this.baseUrl = cfg.baseUrl || 'https://api.openai.com'
    this.apiKey = cfg.apiKey
    this.model = cfg.model || 'gpt-3.5-turbo'
  }
  async *ask(params: AskParams): AsyncStream<string> {
    if (!this.apiKey) throw new Error('openai_no_key')
    const url = this.baseUrl + '/v1/chat/completions'
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.apiKey
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: params.text }],
        stream: true
      }),
      signal: params.signal
    })
    if (!res.ok || !res.body) throw new Error('openai_error')
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value)
      const parts = buffer.split('\n')
      buffer = parts.pop() || ''
      for (const part of parts) {
        if (!part.startsWith('data:')) continue
        const payload = part.slice(5).trim()
        if (payload === '[DONE]') return
        try {
          const j = JSON.parse(payload)
          const token = j.choices?.[0]?.delta?.content
          if (typeof token === 'string' && token.length) yield token
        } catch {}
      }
    }
  }
}

