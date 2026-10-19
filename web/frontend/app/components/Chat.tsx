'use client'

import { useState, useRef, useEffect } from 'react'
import type { Message } from '../page'
import { ThinkingIndicator } from './ThinkingIndicator'
import { WebSearchToggle } from '../search/WebSearchToggle'

type ChatProps = {
  messages: Message[]
  setMessages: (messages: Message[]) => void
  model: string | null
  thinking: 'on' | 'off' | 'adaptive'
  supportsEffort: boolean
}

type EffortLevel = 'low' | 'medium' | 'high' | 'max'

// Simple effort selector (if model supports it)
const EFFORT_OPTIONS: { value: EffortLevel; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'max', label: 'Max' },
]

export function Chat({
  messages,
  setMessages,
  model,
  thinking,
  supportsEffort,
}: ChatProps) {
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [isThinkingIndicator, setIsThinkingIndicator] = useState(false) // Fase B: thinking progress indicator
  const [effort, setEffort] = useState<EffortLevel>('medium')
  const [webSearch, setWebSearch] = useState(false)
  const [mcpEnabled, setMcpEnabled] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  async function sendMessage() {
    if (!input.trim() || !model || streaming) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      id: Date.now().toString(),
    }
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      id: `assistant-${Date.now()}`,
    }

    setMessages([...messages, userMessage, assistantMessage])
    setInput('')
    setStreaming(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          thinking,
          webSearch,
          effort: supportsEffort ? effort : undefined,
          maxTokens: 4000,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      let assistantContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter((l) => l.trim())

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6)) as {
                type: string
                text?: string
              }

              // Fase B: thinking progress indicator (not raw reasoning)
              if (data.type === 'thinking_started') {
                setIsThinkingIndicator(true)
                continue
              }
              if (data.type === 'thinking_stopped') {
                setIsThinkingIndicator(false)
                continue
              }

              if (data.type === 'content_block_delta' && data.text) {
                assistantContent += data.text
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: assistantContent }
                      : m,
                  ),
                )
              }
            }
          }
        }
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Unknown error'
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content: m.content + `\n\n[Error: ${err}]\n`,
              }
            : m,
        ),
      )
    } finally {
      setStreaming(false)
    }
  }

  return (
    <>
      {isThinkingIndicator && <ThinkingIndicator thinking={isThinkingIndicator} />}
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-claude-text-secondary">
            <p className="text-sm">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id ?? `${msg.role}-${Date.now()}`}
              className={`max-w-3xl ${
                msg.role === 'user' ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div
                className={`px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-claude-accent/10 text-claude-text'
                    : 'bg-claude-bg-secondary text-claude-text'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {msg.content || (streaming && msg.role === 'assistant' ? '...' : '')}
                </div>
              </div>
              {msg.role === 'assistant' && streaming && (
                <div className="mt-1 text-xs text-claude-text-secondary">
                  ...
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-claude-border bg-claude-bg-secondary p-4">
        {supportsEffort && (
          <div className="flex gap-1 mb-3">
            {EFFORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setEffort(opt.value)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  effort === opt.value
                    ? 'bg-claude-accent text-white'
                    : 'hover:bg-border text-claude-text-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Phase D/E: toggles */}
        <div className="flex items-center gap-2 mb-2">
          <WebSearchToggle enabled={webSearch} onChange={setWebSearch} />
          <button
            type="button"
            onClick={() => setMcpEnabled((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
              mcpEnabled
                ? 'bg-claude-accent/10 text-claude-accent'
                : 'hover:bg-claude-bg-secondary text-claude-text-secondary'
            }`}
            title="Enable MCP servers"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-claude-accent"></span>
            <span>MCP</span>
          </button>
        </div>

        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Ask byv-code..."
            disabled={streaming || !model}
            className="flex-1 resize-none bg-claude-bg border border-claude-border rounded-md px-3 py-2 text-sm text-claude-text placeholder-claude-text-secondary focus:outline-none focus:border-claude-accent disabled:opacity-50"
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={streaming || !input.trim() || !model}
            className="px-4 py-2 bg-claude-accent text-white rounded-md hover:bg-claude-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {streaming ? '...' : 'Send'}
          </button>
        </div>
        <p className="mt-1 text-xs text-claude-text-secondary">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </>
  )
}
