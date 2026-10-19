/**
 * WebSearchToggle — Fase D
 * Toggle web search on/off for a chat session.
 *
 * Supports both controlled (enabled + onChange) and uncontrolled
 * (defaultEnabled only) usage patterns.
 */
'use client'

import { useState } from 'react'

interface WebSearchToggleProps {
  enabled?: boolean
  defaultEnabled?: boolean
  onChange?: (enabled: boolean) => void
}

export function WebSearchToggle({
  enabled,
  defaultEnabled = false,
  onChange,
}: WebSearchToggleProps) {
  const [internalEnabled, setInternalEnabled] = useState(defaultEnabled)
  const isControlled = enabled !== undefined
  const isActive = isControlled ? enabled : internalEnabled

  function toggle() {
    const next = !isActive
    if (!isControlled) setInternalEnabled(next)
    onChange?.(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors ${
        isActive
          ? 'bg-claude-accent/10 text-claude-accent'
          : 'hover:bg-claude-bg-secondary text-claude-text-secondary'
      }`}
      title="Toggle web search"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-3.5 h-3.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={
            isActive
              ? 'M9 12.75L11.25 15l3-3m-6.75 0L9 9l3 3'
              : 'M9.11 18c.234 0 .459-.049.672-.143.49-.242 1.155-.036 1.49.272.31.281.38.757.164 1.147-.218.391-.727.522-1.125.397C9.095 19.413 8 18.292 8 16.908c0-.43.117-.837.329-1.192.22-.364.56-.605.932-.645.344-.036.682.03 1.001.21'
          }
        />
      </svg>
      <span>Web Search</span>
    </button>
  )
}
