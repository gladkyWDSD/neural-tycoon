import { useState } from 'react'
import { DEFAULT_COMPANY_NAMES } from '../game/constants'
import { validateCompanyName } from '../game/profanity'
import './Screens.css'

export function NamingScreen({ onFound }: { onFound: (name: string) => void }) {
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
        <button className="big-button" onClick={() => submit(name)}>
          Found Company
        </button>
      </div>
    </div>
  )
}
