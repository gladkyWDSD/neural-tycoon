import type { GameState } from '../game/types'
import { formatDate } from '../game/date'
import { weeklyRevenue } from '../game/research'
import './Game.css'

interface Props {
  state: GameState
  musicOn: boolean
  onToggleMusic: () => void
  onTogglePause: () => void
}

export function TopBar({ state, musicOn, onToggleMusic, onTogglePause }: Props) {
  const totalCustomers = state.models.reduce((sum, m) => sum + m.customers, 0)
  const weeklyRev = state.models.reduce((sum, m) => sum + weeklyRevenue(m), 0)

  return (
    <div className="topbar">
      <div className="topbar-item company">{state.companyName}</div>
      <div className="topbar-item money">${Math.round(state.money).toLocaleString()}</div>
      <div className="topbar-item dim">
        {totalCustomers.toLocaleString()} customers · ${weeklyRev.toLocaleString()}/wk
      </div>
      <div className="topbar-item date">
        {formatDate(state.date)} · Wk {state.date.week}
      </div>
      <button className="pause-btn" onClick={onToggleMusic} title={musicOn ? 'Mute music' : 'Play music'}>
        {musicOn ? '🔊' : '🔇'}
      </button>
      <button className="pause-btn" onClick={onTogglePause}>
        {state.paused ? '▶ Play' : '⏸ Pause'}
      </button>
    </div>
  )
}
