/**
 * ArticleView — Fase C
 * Renders article content in a secure iframe sandbox.
 */
'use client'

import type { Article } from './types'

interface ArticleViewProps {
  article: Article | null
}

export default function ArticleView({ article }: ArticleViewProps) {
  if (!article) {
    return (
      <div className="flex-1 flex items-center justify-center text-claude-text-secondary">
        <p className="text-sm">Select an article to view</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="border-b border-claude-border p-3 bg-claude-bg-secondary">
        <h2 className="text-sm font-medium text-claude-text">{article.title}</h2>
        <p className="text-xs text-claude-text-secondary mt-1">
          {article.meta.model || 'Default'} • {new Date(article.meta.timestamp || article.meta.createdAt).toLocaleString()}
        </p>
      </div>
      <div className="flex-1 overflow-auto">
        <iframe
          srcDoc={`<pre class="whitespace-pre-wrap p-4 font-mono text-sm">${article.content}</pre>`}
          title={article.title}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-none bg-claude-bg-secondary"
        />
      </div>
    </div>
  )
}
