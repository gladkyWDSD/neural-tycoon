import { useState } from 'react'
import type { GameState } from '../game/types'
import './Game.css'

export function NewsFeed({ state }: { state: GameState }) {
  const [hidden, setHidden] = useState(false)
  const events = state.events.slice(0, 6)

  if (hidden) {
    return (
      <button className="news-toggle" onClick={() => setHidden(false)} title="Show messages">
        📰
      </button>
    )
  }

  if (events.length === 0) return null

  return (
    <div className="news-feed">
      <button className="news-close" onClick={() => setHidden(true)} title="Hide messages">
        ✕
      </button>
      {events.map((e) => (
        <div className="news-item" key={e.id}>
          <span className="news-week">Wk {e.week}</span>
          <span className="news-text">{e.text}</span>
        </div>
      ))}
    </div>
  )
}
