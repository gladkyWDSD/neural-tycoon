import type { GameState } from '../game/types'
import { formatDate } from '../game/date'
import { formatMoney } from '../game/format'
import { weeklyRevenue } from '../game/research'
import { companyValuation } from '../game/state'
import { IPO_VALUATION, WIN_VALUATION } from '../game/constants'
import './Game.css'

interface Props {
  state: GameState
  musicOn: boolean
  onToggleMusic: () => void
  onTogglePause: () => void
  /** in a race, the nickname of whoever holds the clock, when it is not you */
  pauseLockedBy?: string | null
}

export function TopBar({ state, musicOn, onToggleMusic, onTogglePause, pauseLockedBy }: Props) {
  // trial users count as users of your AI, even while they pay nothing
  const totalCustomers = state.models.reduce((sum, m) => sum + m.customers + m.freeCustomers, 0)
  const weeklyRev = state.models.reduce((sum, m) => sum + weeklyRevenue(m), 0)
  const valuation = companyValuation(state)
  // the headline goal: a billion floats the company, a hundred billion wins the game
  const goal = state.isPublic ? WIN_VALUATION : IPO_VALUATION
  const toGoal = Math.max(0, Math.min(1, valuation / goal))

  return (
    <div className="topbar">
      <div className="topbar-item company">{state.companyName}</div>
      <div className="topbar-item money">${Math.round(state.money).toLocaleString()}</div>
      <div className="topbar-item dim">
        {totalCustomers.toLocaleString()} customers · ${weeklyRev.toLocaleString()}/wk
      </div>
      <div className="topbar-item valuation" title={`Company valuation. ${state.isPublic ? 'Reach $100B to win.' : 'Reach $1B to go public.'}`}>
        <span className="valuation-label">Valuation</span>
        <span className="valuation-value">{formatMoney(valuation)}</span>
        <span className="valuation-track">
          <span className="valuation-fill" style={{ width: `${(toGoal * 100).toFixed(1)}%` }} />
        </span>
      </div>
      <div className="topbar-item date">
        {formatDate(state.date)} · Wk {state.date.week}
      </div>
      <button className="pause-btn" onClick={onToggleMusic} title={musicOn ? 'Mute music' : 'Play music'}>
        {musicOn ? '🔊' : '🔇'}
      </button>
      <button
        className="pause-btn"
        onClick={onTogglePause}
        disabled={Boolean(pauseLockedBy)}
        title={pauseLockedBy ? `${pauseLockedBy} holds the clock in this race` : undefined}
      >
        {pauseLockedBy && state.paused
          ? `⏸ ${pauseLockedBy} paused`
          : state.paused
            ? '▶ Play'
            : '⏸ Pause'}
      </button>
    </div>
  )
}
