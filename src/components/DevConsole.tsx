import { useEffect, useRef, useState } from 'react'
import './DevConsole.css'

interface Props {
  onCommand: (text: string) => string
}

export function DevConsole({ onCommand }: Props) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function run() {
    const text = value
    if (!text.trim()) return
    const res = onCommand(text)
    setHistory((h) => [...h, `> ${text}`, ...res.split('\n')])
    setValue('')
  }

  if (!open) {
    return (
      <button className="dev-toggle" onClick={() => setOpen(true)} title="Dev console (`)">
        ⌘
      </button>
    )
  }

  return (
    <div className="dev-console">
      <div className="dev-header">
        <span>Dev Console</span>
        <button className="dev-close" onClick={() => setOpen(false)}>
          ✕
        </button>
      </div>
      <div className="dev-history">
        {history.length === 0 && <p className="dev-hint">Type /help for commands</p>}
        {history.map((line, i) => (
          <pre key={i}>{line}</pre>
        ))}
      </div>
      <div className="dev-input-row">
        <span className="dev-prompt">&gt;</span>
        <input
          ref={inputRef}
          value={value}
          placeholder="type a command..."
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
        />
      </div>
    </div>
  )
}
