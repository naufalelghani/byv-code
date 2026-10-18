/**
 * useSearch — Fase D
 *
 * Hook untuk mengelola state pencarian web.
 * Mengelola: enabled toggle, query, results, toggle, search, clear.
 */
'use client'

import { useState, useCallback } from 'react'

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export interface UseSearchReturn {
  enabled: boolean
  query: string
  results: SearchResult[] | null
  isSearching: boolean
  error: string | null
  toggle: () => void
  search: (q: string) => Promise<void>
  clear: () => void
  setQuery: (q: string) => void
}

export function useSearch(): UseSearchReturn {
  const [enabled, setEnabled] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = useCallback(() => {
    setEnabled((prev) => !prev)
    if (!enabled) {
      setResults(null)
      setError(null)
    }
  }, [enabled])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return

    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, thinking: true }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setResults(data.results || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setResults(null)
    } finally {
      setIsSearching(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResults(null)
    setError(null)
    setQuery('')
  }, [])

  return {
    enabled,
    query,
    results,
    isSearching,
    error,
    toggle,
    search,
    clear,
    setQuery,
  }
}
