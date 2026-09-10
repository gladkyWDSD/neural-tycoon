import type { GameState } from '../game/types'
import { formatMoney } from '../game/format'
import { companyValuation } from '../game/state'
import { formatDate } from '../game/date'
import './EventModal.css'

interface Props {
  state: GameState
  onKeepPlaying: () => void
}

/** Shown once, when the company crosses the hundred-billion mark. */
export function VictoryModal({ state, onKeepPlaying }: Props) {
  const totalUsers = state.models.reduce((sum, m) => sum + m.customers + m.freeCustomers, 0)
  return (
    <div className="event-overlay">
      <div className="event-modal">
        <div className="event-icon">🏆</div>
        <h3 className="event-title">You won the AI race</h3>
        <p className="event-text">
          {state.companyName} is worth {formatMoney(companyValuation(state))}, with{' '}
          {totalUsers.toLocaleString()} people using your AI. You got there in{' '}
          {formatDate(state.date)}.
        </p>
        <div className="event-choices">
          <button className="event-choice" onClick={onKeepPlaying}>
            <span className="event-choice-label">Keep playing</span>
            <span className="event-choice-hint">
              {state.paused
                ? 'The game is paused. Press play when you want to carry on.'
                : 'Carry on building for as long as you like.'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
