import type { GameState } from '../game/types'
import { formatMoney } from '../game/format'
import { companyValuation, globalWeek, marketMood } from '../game/state'
import { formatDate } from '../game/date'
import { AMENITY_MAP } from '../game/amenities'
import { DESKS_PER_LEVEL, DIFFICULTIES } from '../game/constants'
import { activeCards } from '../game/gpu'
import './EventModal.css'
import './Game.css'

interface Props {
  state: GameState
  /** how the run ended, when it has */
  outcome?: { won: boolean; winner?: string | null; isMe?: boolean; lost?: boolean }
  onClose: () => void
  closeLabel?: string
  closeHint?: string
}

function money(n: number): string {
  const sign = n < 0 ? '-' : ''
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString()}`
}

/**
 * The run, in numbers. Shown when the company wins, when a race is decided, and
 * any time from the Company panel, because most of this cannot be read off the
 * screen while you are playing.
 */
export function RunReport({ state, outcome, onClose, closeLabel, closeHint }: Props) {
  const s = state.stats
  const week = globalWeek(state)
  const valuation = companyValuation(state)
  const live = state.models.filter((m) => m.status === 'published')
  const best = live.length > 0 ? live.reduce((a, b) => (b.quality > a.quality ? b : a)) : null
  const users = state.models.reduce((sum, m) => sum + m.customers + m.freeCustomers, 0)
  const length = DIFFICULTIES.find((d) => d.id === state.difficulty)?.label ?? state.difficulty

  const title = outcome?.lost
    ? 'You ran out of money'
    : outcome
      ? outcome.winner
        ? outcome.isMe
          ? 'You won the race'
          : `${outcome.winner} won the race`
        : 'You won the AI race'
      : `${state.companyName} so far`

  const rows: [string, string][] = [
    ['Weeks run', `${week} (${formatDate(state.date)})`],
    ['Valuation now', formatMoney(valuation)],
    ['Best it ever was', formatMoney(s.peakValuation)],
    ['Cash', money(state.money)],
    ['Users now', users.toLocaleString()],
    ['Most users at once', s.peakCustomers.toLocaleString()],
    ['Followers at their peak', s.peakFollowers.toLocaleString()],
    ['Best week', money(s.bestWeek)],
    ['Worst week', money(s.worstWeek)],
    ['Models shipped', `${s.modelsShipped} (${live.length} still live)`],
    ['Best model', best ? `${best.name}, quality ${Math.round(best.quality)}` : 'none shipped'],
    ['Research finished', `${state.researched.length}`],
    ['People now', `${state.staff.length} of ${state.officeLevel * DESKS_PER_LEVEL} desks`],
    ['Hired over the run', `${s.hires}`],
    ['Left or were let go', `${s.departures}`],
    ['Poached from rivals', `${s.poachedIn}`],
    ['Poached off you', `${s.poachedOut}`],
    ['Compute', `${activeCards(state)} active cards, ${state.datacenters + state.rentedDatacenters} datacenters`],
    ['Laws you live under', `${state.activeRegulations.length}`],
    ['Safety debt left', `${Math.round(state.risk)} of 100`],
    ['Market mood at the end', `${marketMood(state.hype)} (${state.hype.toFixed(2)}x)`],
    ['Enterprise contracts', `${s.contractsSigned} signed, ${s.contractsBroken} lost`],
    ['Rivals bought outright', `${s.acquisitions}`],
    ['Calls from the White House', `${s.presidentCalls}`],
  ]

  if (state.inRace || s.pactsSigned > 0 || s.pactsBroken > 0) {
    rows.push(['Pacts signed', `${s.pactsSigned}`])
    rows.push(['Pacts torn up', `${s.pactsBroken}`])
  }

  const amenities = state.amenities.map((id) => AMENITY_MAP[id]?.name).filter(Boolean)
  rows.push(['Office extras', amenities.length > 0 ? amenities.join(', ') : 'none bought'])
  rows.push(['Game length', length])

  return (
    <div className="event-overlay">
      <div className="event-modal report-modal">
        <h3 className="event-title">{title}</h3>
        <p className="event-text">
          {outcome?.lost
            ? `${state.companyName} could not make payroll in week ${week}. Here is how far it got.`
            : outcome?.winner && !outcome.isMe
            ? `${outcome.winner} reached $100B first. Here is where ${state.companyName} got to.`
            : outcome
              ? `${state.companyName} made it to ${formatMoney(valuation)}.`
              : `Week ${week}, and this is how it is going.`}
        </p>

        <div className="report-rows">
          {rows.map(([label, value]) => (
            <div className="report-row" key={label}>
              <span className="report-label">{label}</span>
              <span className="report-value">{value}</span>
            </div>
          ))}
        </div>

        <div className="event-choices">
          <button className="event-choice" onClick={onClose}>
            <span className="event-choice-label">{closeLabel ?? 'Close'}</span>
            <span className="event-choice-hint">
              {closeHint ?? 'Back to the office. Nothing here changes anything.'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
