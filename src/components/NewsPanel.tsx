import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../game/types'
import { companyValuation, marketMood } from '../game/state'
import { formatMoney } from '../game/format'
import { useNarrow } from '../game/device'
import './Game.css'

/**
 * The wire, along the bottom of the screen. Everything that happens goes
 * through here: your own news, the rivals, and the world outside carrying on
 * without you.
 */
export function NewsPanel({ state }: { state: GameState }) {
  // On a phone the wire is a single line you open when you want it, because
  // three lines of headlines is a third of the screen. Null means you have not
  // said either way, so it follows the screen.
  const narrow = useNarrow()
  const [choice, setChoice] = useState<boolean | null>(null)
  const open = choice ?? !narrow
  const list = useRef<HTMLDivElement>(null)
  const items = state.events
  const newest = items[0]?.id

  // a new headline scrolls the wire back to the front
  useEffect(() => {
    if (list.current) list.current.scrollLeft = 0
  }, [newest])

  const mood = marketMood(state.hype)

  return (
    <div className={`news-bar ${open ? '' : 'closed'}`}>
      <div className="news-bar-head">
        <span className="news-bar-title">The Wire</span>
        <span className="news-bar-mood" title="How the world feels about AI this week">
          {open || !items[0]
            ? `Market: ${mood} (${state.hype.toFixed(2)}x) · ${state.companyName} ${formatMoney(companyValuation(state))}`
            : items[0].text}
        </span>
        <button
          className="news-bar-toggle"
          onClick={() => setChoice(!open)}
        >
          {open ? 'Hide' : 'Show'}
        </button>
      </div>
      {open && (
        <div className="news-bar-list" ref={list}>
          {items.length === 0 ? (
            <p className="news-bar-empty">Quiet week. Nothing on the wire.</p>
          ) : (
            items.map((e) => (
              <div className="news-bar-item" key={e.id}>
                <span className="news-bar-week">Wk {e.week}</span>
                <span className="news-bar-text">{e.text}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
