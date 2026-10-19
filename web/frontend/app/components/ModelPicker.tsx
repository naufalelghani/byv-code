'use client'

import { useEffect, useState } from 'react'
import type { ModelOption } from '../page'

type ModelPickerProps = {
  value: string | null
  onChange: (model: ModelOption | null) => void
}

export function ModelPicker({ value, onChange }: ModelPickerProps) {
  const [options, setOptions] = useState<ModelOption[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/models')
      .then((r) => r.json())
      .then((data: ModelOption[]) => {
        setOptions(data)
        // Auto-select default if value is null
        if (!value && data.length > 0) {
          onChange(data[0])
        }
      })
      .catch((e) => {
        console.error('Failed to fetch models:', e)
        setError(e.message)
      })
      .finally(() => setLoading(false))
  }, [])

  const selected = options.find((o) => o.value === value)

  if (loading) {
    return (
      <div className="px-3 py-1.5 text-sm text-claude-text-secondary">
        Loading models...
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-3 py-1.5 text-sm text-red-400">
        Error loading models
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-claude-bg-secondary hover:bg-claude-border transition-colors text-sm text-claude-text"
      >
        <span>{selected?.label ?? 'Select model'}</span>
        <svg
          className="w-4 h-4 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 max-h-80 overflow-y-auto bg-claude-bg-secondary border border-claude-border rounded-md shadow-lg z-10">
          {options.map((opt) => (
            <button
              key={opt.value ?? 'default'}
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
              className="w-full flex flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-claude-border transition-colors first:rounded-t-md last:rounded-b-md"
            >
              <span className="text-sm font-medium text-claude-text">
                {opt.label}
              </span>
              <span className="text-xs text-claude-text-secondary">
                {opt.description}
              </span>
              <div className="flex gap-2 mt-1">
                {opt.supportsThinking && (
                  <span className="text-xs px-1.5 py-0.25 bg-blue-500/20 text-blue-400 rounded">
                    thinking
                  </span>
                )}
                {opt.supportsEffort && (
                  <span className="text-xs px-1.5 py-0.25 bg-purple-500/20 text-purple-400 rounded">
                    effort
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
