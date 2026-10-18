/**
 * McpPanel — Fase E
 * UI for managing MCP server connections (add/remove/toggle/authenticate).
 */
'use client'

import { useState } from 'react'
import { useMcp } from './useMcp'

export default function McpPanel() {
  const { servers, loading, error, addServer, removeServer, toggleServer, refresh } = useMcp()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')

  async function handleAdd() {
    if (!newName.trim() || !newUrl.trim()) return
    try {
      await addServer(newName, newUrl)
      setNewName('')
      setNewUrl('')
      setShowAdd(false)
    } catch (e) {
      console.error('[mcp] add failed:', e)
    }
  }

  if (loading) {
    return <div className="p-4 text-sm text-claude-text-secondary">Loading MCP servers...</div>
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-claude-text">MCP Servers</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs text-claude-accent hover:text-claude-accent-hover"
        >
          + Add Server
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {showAdd && (
        <div className="space-y-2 p-3 border border-claude-border rounded-md bg-claude-bg">
          <input
            type="text"
            placeholder="Server name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full text-xs px-2 py-1 bg-claude-bg-secondary border border-claude-border rounded text-claude-text"
          />
          <input
            type="text"
            placeholder="http://localhost:8080"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="w-full text-xs px-2 py-1 bg-claude-bg-secondary border border-claude-border rounded text-claude-text"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="text-xs px-2 py-1 bg-claude-accent text-white rounded"
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="text-xs px-2 py-1 hover:bg-claude-bg-secondary rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {servers.map((server) => (
          <div
            key={server.id}
            className="flex items-center justify-between p-2 border border-claude-border rounded-md"
          >
            <div>
              <div className="text-sm font-medium text-claude-text">{server.name}</div>
              <div className="text-xs text-claude-text-secondary">{server.url}</div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs ${server.connected ? 'text-green-400' : 'text-gray-500'}`}
              >
                {server.connected ? '● Connected' : '○ Disconnected'}
              </span>
              <button
                onClick={() => void toggleServer(server.id)}
                className="text-xs px-2 py-1 hover:bg-claude-bg-secondary rounded"
              >
                {server.connected ? 'Disconnect' : 'Connect'}
              </button>
              <button
                onClick={() => void removeServer(server.id)}
                className="text-xs px-2 py-1 hover:bg-claude-bg-secondary text-red-300 rounded"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => void refresh()}
        className="text-xs px-2 py-1 hover:bg-claude-bg-secondary rounded"
      >
        Refresh
      </button>
    </div>
  )
}
