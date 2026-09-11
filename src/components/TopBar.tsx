import type { GameState } from '../game/types'
import { formatDate } from '../game/date'
import { formatMoney } from '../game/format'
import { weeklyRevenue } from '../game/research'
import { companyValuation, weeklyCosts, weeklyIncome } from '../game/state'
import { IPO_VALUATION, WIN_VALUATION } from '../game/constants'
import type { PanelId } from './SideNav'
import { setLayoutChoice, useTall } from '../game/device'
import './Game.css'

interface Props {
  state: GameState
  musicOn: boolean
  onToggleMusic: () => void
  onTogglePause: () => void
  /** in a race, the nickname of whoever holds the clock, when it is not you */
  pauseLockedBy?: string | null
  onOpenPanel: (id: PanelId) => void
  panel: PanelId
}

export function TopBar({
  state,
  musicOn,
  onToggleMusic,
  onTogglePause,
  pauseLockedBy,
  onOpenPanel,
  panel,
}: Props) {
  // trial users count as users of your AI, even while they pay nothing
  const totalCustomers = state.models.reduce((sum, m) => sum + m.customers + m.freeCustomers, 0)
  const weeklyRev = state.models.reduce((sum, m) => sum + weeklyRevenue(m), 0)
  const valuation = companyValuation(state)
  // the headline goal: a billion floats the company, a hundred billion wins the game
  const goal = state.isPublic ? WIN_VALUATION : IPO_VALUATION
  const toGoal = Math.max(0, Math.min(1, valuation / goal))

  // the readouts are the buttons: press what you want to know more about
  const toggle = (id: Exclude<PanelId, null>) => onOpenPanel(panel === id ? null : id)
  // a narrow screen has no room for a sentence on a key
  const tall = useTall()

  // how long the cash lasts at the current burn, because zero ends the run
  const costs = weeklyCosts(state)
  const net = weeklyIncome(state) - costs
  const weeksLeft = net >= 0 ? Infinity : state.money / -net
  const cashState = weeksLeft <= 2 ? 'critical' : weeksLeft <= 6 ? 'low' : ''

  return (
    <div className="topbar">
      <button
        className={`topbar-item topbar-btn company ${panel === 'company' ? 'active' : ''}`}
        onClick={() => toggle('company')}
        title="Open your company: office, funding, IPO"
      >
        {state.companyName}
        {state.isPublic && <span className="ticker-tag">PUBLIC</span>}
      </button>
      <button
        className={`topbar-item topbar-btn money ${cashState} ${panel === 'company' ? 'active' : ''}`}
        onClick={() => toggle('company')}
        title={
          net >= 0
            ? `Cash on hand. You make $${net.toLocaleString()} a week more than you spend.`
            : `Cash on hand. You are losing $${(-net).toLocaleString()} a week, about ${Math.floor(weeksLeft)} weeks left. At zero the run ends.`
        }
      >
        ${Math.round(state.money).toLocaleString()}
        {cashState === 'critical' && <span className="cash-warn">low</span>}
      </button>
      <button
        className={`topbar-item topbar-btn dim ${panel === 'competitors' ? 'active' : ''}`}
        onClick={() => toggle('competitors')}
        title="Your users and weekly revenue. Opens the rivals board."
      >
        {totalCustomers.toLocaleString()} users · ${weeklyRev.toLocaleString()}/wk
      </button>
      <button
        className={`topbar-item topbar-btn valuation ${panel === 'company' ? 'active' : ''}`}
        onClick={() => toggle('company')}
        title={`Company valuation. ${state.isPublic ? 'Reach $100B to win.' : 'Reach $1B to go public.'}`}
      >
        <span className="valuation-label">Valuation</span>
        <span className="valuation-value">{formatMoney(valuation)}</span>
        <span className="valuation-track">
          <span className="valuation-fill" style={{ width: `${(toGoal * 100).toFixed(1)}%` }} />
        </span>
      </button>
      <div className="topbar-item date">
        {formatDate(state.date)} · Wk {state.date.week}
      </div>
      {/* On a phone the bar folds into three short lines instead of one long
          one; these are where it folds. They are not there on a wide screen. */}
      <span className="topbar-break" aria-hidden="true" />
      <span className="topbar-break" aria-hidden="true" />
      <button
        className="pause-btn layout-btn"
        onClick={() => setLayoutChoice(tall ? 'wide' : 'tall')}
        title={
          tall
            ? 'Tall layout: the rail is along the bottom and panels fill the screen. Press for the wide one.'
            : 'Wide layout: the rail is a column and panels sit beside the room. Press for the tall one.'
        }
      >
        {tall ? 'Tall' : 'Wide'}
      </button>
      <button className="pause-btn" onClick={onToggleMusic} title={musicOn ? 'Mute music' : 'Play music'}>
        {tall ? (musicOn ? 'Music' : 'Muted') : musicOn ? 'Music on' : 'Music off'}
      </button>
      <button
        className="pause-btn"
        onClick={onTogglePause}
        disabled={Boolean(pauseLockedBy)}
        title={pauseLockedBy ? `${pauseLockedBy} holds the clock in this race` : undefined}
      >
        {pauseLockedBy && state.paused
          ? `${pauseLockedBy} paused`
          : state.paused
            ? 'Play'
            : 'Pause'}
      </button>
    </div>
  )
}
