'use client'

type ThinkingToggleProps = {
  value: 'on' | 'off' | 'adaptive'
  onChange: (value: 'on' | 'off' | 'adaptive') => void
}

const OPTIONS: { value: 'on' | 'off' | 'adaptive'; label: string }[] = [
  { value: 'adaptive', label: 'Adaptive' },
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
]

export function ThinkingToggle({ value, onChange }: ThinkingToggleProps) {
  return (
    <div className="flex items-center gap-1 text-xs text-claude-text-secondary">
      <span>Thinking:</span>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2 py-1 rounded transition-colors ${
            value === opt.value
              ? 'bg-claude-accent text-white'
              : 'hover:bg-claude-border text-claude-text-secondary'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
