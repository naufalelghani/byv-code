/**
 * useWebSocket — Fase C
 * Manages WebSocket connection for real-time article updates.
 */
'use client'

import { useEffect, useRef, useState } from 'react'

type WSStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface ArticleEvent {
  type: 'article' | 'update' | 'delete'
  data: unknown
}

export function useWebSocket(url: string) {
  const [status, setStatus] = useState<WSStatus>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setStatus('connected')
    ws.onclose = () => {
      setStatus('disconnected')
      reconnectRef.current = setTimeout(() => setStatus('connecting'), 100)
    }
    ws.onerror = () => setStatus('error')

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as ArticleEvent
        void data // placeholder — in full impl, emit to callback
      } catch (e) {
        console.error('[ws] parse error:', e)
      }
    }
    ws.addEventListener('message', handleMessage)

    return () => {
      ws.close()
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
    }
  }, [url])

  function send(data: unknown) {
    if (status === 'connected' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }

  return { status, send }
}
