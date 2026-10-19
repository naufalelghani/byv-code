/**
 * Article & ArticleMeta types — Fase C
 *
 * Dipindahkan dari ArticleView.tsx untuk reuse lintas komponen.
 */

export interface ArticleMeta {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  status: 'active' | 'draft' | 'published'
  model?: string
  timestamp?: string
}

export interface Article {
  id: string
  title: string
  content: string
  meta: ArticleMeta
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}
