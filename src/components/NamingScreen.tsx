import { useState } from 'react'
import type { Difficulty } from '../game/types'
import { DEFAULT_COMPANY_NAMES, DIFFICULTIES } from '../game/constants'
import { validateCompanyName } from '../game/profanity'
import './Screens.css'

interface Props {
  onFound: (name: string) => void
  difficulty: Difficulty
  onPickDifficulty: (d: Difficulty) => void
}

export function NamingScreen({ onFound, difficulty, onPickDifficulty }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(value: string) {
    const err = validateCompanyName(value)
    if (err) {
      setError(err)
      return
    }
    onFound(value.trim())
  }

  return (
    <div className="naming-screen screen">
      <div className="title-box">
        <h2 className="heading">Name your company</h2>
        <input
          autoFocus
          value={name}
          maxLength={24}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit(name)}
          placeholder="Enter company name..."
        />
        {error && <p className="error">{error}</p>}
        <div className="default-names">
          {DEFAULT_COMPANY_NAMES.map((n) => (
            <button key={n} className="chip" onClick={() => submit(n)}>
              {n}
            </button>
          ))}
        </div>
        <div className="difficulty-picker">
          <h3 className="heading small">Game length</h3>
          <div className="difficulty-options">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                className={`difficulty-option ${difficulty === d.id ? 'active' : ''}`}
                onClick={() => onPickDifficulty(d.id)}
              >
                <span className="difficulty-label">{d.label}</span>
                <span className="difficulty-blurb">{d.blurb}</span>
              </button>
            ))}
          </div>
        </div>

        <button className="big-button" onClick={() => submit(name)}>
          Found Company
        </button>
      </div>
    </div>
  )
}
