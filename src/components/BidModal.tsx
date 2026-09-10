import type { GameState } from '../game/types'
import { ROLES } from '../game/constants'
import { staffPower } from '../game/hiring'
import './EventModal.css'

interface Props {
  state: GameState
  onResolve: (matched: boolean) => void
}

/** Another player wants one of your people. Match the money or lose them. */
export function BidModal({ state, onResolve }: Props) {
  const bid = state.pendingBid
  if (!bid) return null
  const person = state.staff.find((s) => s.id === bid.staff.id)
  const role = ROLES.find((r) => r.id === bid.staff.role)?.label
  const canAfford = state.money >= bid.amount
  const money = (n: number) => `$${Math.round(n).toLocaleString()}`

  return (
    <div className="event-overlay">
      <div className="event-modal">
        <div className="event-icon">💼</div>
        <h3 className="event-title">They want your {role?.toLowerCase()}</h3>
        <p className="event-text">
          {bid.fromName} offered {bid.staff.name} {money(bid.amount)} to walk out. Level {bid.staff.level},{' '}
          {staffPower(bid.staff).toLocaleString()} pts, on {money(person?.salary ?? bid.staff.salary)}/wk with you.
        </p>
        <div className="event-choices">
          <button
            className={canAfford ? 'event-choice' : 'event-choice is-disabled'}
            disabled={!canAfford}
            onClick={() => onResolve(true)}
          >
            <span className="event-choice-label">Match it, {money(bid.amount)}</span>
            <span className="event-choice-hint">
              {canAfford
                ? 'They stay, and their pay rises to what they are now worth.'
                : `You only have ${money(state.money)}.`}
            </span>
          </button>
          <button className="event-choice is-danger" onClick={() => onResolve(false)}>
            <span className="event-choice-label">Let them go</span>
            <span className="event-choice-hint">
              They join {bid.fromName} and take all {staffPower(bid.staff).toLocaleString()} pts with them.
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
