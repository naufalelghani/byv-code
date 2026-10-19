/**
 * ArticleList — Fase C
 *
 * Sidebar component yang menampilkan daftar artikel (artifacts).
 * Berlangganan ke useWebSocket untuk real-time updates.
 */
'use client'

import { useEffect, useState } from 'react'
import { useWebSocket } from './useWebSocket'

export interface Article {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  status: 'active' | 'draft' | 'published'
}

interface ArticleListProps {
  onArticleSelect: (article: Article) => void
  activeArticleId?: string
}

export function ArticleList({ onArticleSelect, activeArticleId }: ArticleListProps) {
  const [articles, setArticles] = useState<Article[]>([])

  // Determine WebSocket URL — falls back to current origin with backend port
  const wsOrigin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  const wsUrl = `${wsOrigin.replace(/^http/, 'ws')}/ws/articles`

  const { status: wsStatus } = useWebSocket(wsUrl)
  const connected = wsStatus === 'connected'

  return (
    <div className="w-64 border-r border-claude-border bg-claude-bg-secondary p-3 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-claude-text-secondary uppercase">
          Articles
        </h2>
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            connected ? 'bg-green-400' : 'bg-red-400'
          }`}
          title={connected ? 'Connected' : 'Disconnected'}
        />
      </div>

      <div className="space-y-1">
        {articles.map((article) => (
          <button
            key={article.id}
            onClick={() => onArticleSelect(article)}
            className={`w-full text-left p-2 rounded-md text-xs transition-colors ${
              article.id === activeArticleId
                ? 'bg-claude-accent/10 text-claude-text'
                : 'hover:bg-claude-bg-secondary text-claude-text-secondary'
            }`}
          >
            <div className="font-medium truncate">{article.title}</div>
            <div className="mt-1 opacity-60">
              {new Date(article.updatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </button>
        ))}
        {articles.length === 0 && (
          <p className="text-center py-8 text-claude-text-secondary">
            No articles yet
          </p>
        )}
      </div>
    </div>
  )
}
