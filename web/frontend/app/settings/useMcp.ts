/**
 * useMcp — Fase E
 * Manages MCP server connections (add/remove/authenticate).
 */
'use client'

import { useEffect, useState } from 'react'

export interface McpServer {
  id: string
  name: string
  url: string
  connected: boolean
  authRequired: boolean
  authenticated: boolean
}

export interface UseMcpReturn {
  servers: McpServer[]
  loading: boolean
  error: string | null
  addServer: (name: string, url: string, authRequired?: boolean) => Promise<void>
  removeServer: (id: string) => Promise<void>
  toggleServer: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useMcp(): UseMcpReturn {
  const [servers, setServers] = useState<McpServer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/mcp/servers')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json() as { servers: McpServer[] }
      setServers(body.servers ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load servers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const addServer = async (name: string, url: string, authRequired = false) => {
    const res = await fetch('/api/mcp/servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url, authRequired }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    void refresh()
  }

  const removeServer = async (id: string) => {
    const res = await fetch(`/api/mcp/servers/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    void refresh()
  }

  const toggleServer = async (id: string) => {
    const res = await fetch(`/api/mcp/servers/${id}/toggle`, { method: 'POST' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    void refresh()
  }

  return { servers, loading, error, addServer, removeServer, toggleServer, refresh }
}
