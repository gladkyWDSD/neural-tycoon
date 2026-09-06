import type { GameState } from '../game/types'
import './Game.css'

export function NewsFeed({ state }: { state: GameState }) {
  const events = state.events.slice(0, 6)
  if (events.length === 0) return null
  return (
    <div className="news-feed">
      {events.map((e) => (
        <div className="news-item" key={e.id}>
          <span className="news-week">Wk {e.week}</span>
          <span className="news-text">{e.text}</span>
        </div>
      ))}
    </div>
  )
}
