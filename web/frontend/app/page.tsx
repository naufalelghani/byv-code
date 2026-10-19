'use client'

import { useEffect, useState } from 'react'
import { Chat } from './components/Chat'
import { ModelPicker } from './components/ModelPicker'
import { ThinkingToggle } from './components/ThinkingToggle'
import { ArticleList } from './articles/ArticleList'
import { useAuth } from './hooks/useAuth'

export type ModelOption = {
  value: string | null
  label: string
  description: string
  descriptionForModel?: string
  supportsThinking: boolean
  supportsEffort: boolean
}

export type Message = {
  role: 'user' | 'assistant'
  content: string
  id?: string
}

export default function ChatPage() {
  const { authenticated, loading, authError } = useAuth()
  const [selectedModel, setSelectedModel] = useState<ModelOption | null>(null)
  const [thinking, setThinking] = useState<'on' | 'off' | 'adaptive'>('adaptive')
  const [messages, setMessages] = useState<Message[]>([])

  // Auto-enable thinking if model supports it, default to adaptive
  useEffect(() => {
    if (selectedModel?.supportsThinking && thinking === 'off') {
      setThinking('adaptive')
    }
  }, [selectedModel, thinking])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-claude-bg">
        <div className="text-claude-text-secondary">Loading...</div>
      </div>
    )
  }

  if (!authenticated && !authError) {
    return (
      <div className="flex h-screen items-center justify-center bg-claude-bg">
        <div className="text-center">
          <p className="text-claude-text-secondary">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!authenticated && authError) {
    return (
      <div className="flex h-screen items-center justify-center bg-claude-bg">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">Authentication error</p>
          <p className="text-claude-text-secondary mb-4">{authError}</p>
          <p className="text-sm text-claude-text-secondary">
            The web version supports internal subscribers and 3P (Bedrock/Vertex/Foundry)
            providers only. Ensure you have a valid API token configured.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-claude-bg text-claude-text">
      {/* Sidebar — articles/artifacts (Phase C) */}
      {/* TODO(human): Consider adding article creation button + empty state styling */}
      <div className="hidden md:flex md:flex-col md:w-64 md:border-r md:border-claude-border">
        <ArticleList
          onArticleSelect={() => { }}
          activeArticleId={undefined}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with model picker and thinking toggle */}
        <header className="flex items-center justify-between p-3 border-b border-claude-border bg-claude-bg-secondary">
          <ModelPicker
            value={selectedModel?.value ?? null}
            onChange={setSelectedModel}
          />
          {selectedModel?.supportsThinking && (
            <ThinkingToggle value={thinking} onChange={setThinking} />
          )}
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto">
          <Chat
            messages={messages}
            setMessages={setMessages}
            model={selectedModel?.value ?? null}
            thinking={thinking}
            supportsEffort={selectedModel?.supportsEffort ?? false}
          />
        </main>
      </div>
    </div>
  )
}
