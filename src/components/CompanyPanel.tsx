import type { GameState } from '../game/types'
import {
  DESKS_PER_LEVEL,
  INVESTMENT_COOLDOWN_WEEKS,
  IPO_RAISE_SHARE,
  IPO_VALUATION,
  MAX_OFFICE_LEVEL,
  OFFICE_UPGRADE_BASE_COST,
  WIN_VALUATION,
} from '../game/constants'
import { formatMoney } from '../game/format'
import { AMENITIES } from '../game/amenities'
import { bestPublishedQuality } from '../game/state'
import { companyValuation, globalWeek, investmentRaiseAmount, marketMood, maxStaff } from '../game/state'
import './Game.css'

interface Props {
  state: GameState
  onUpgradeOffice: () => void
  onIpo: () => void
  onRaiseInvestment: () => void
  onBuyAmenity: (id: string) => void
  onSignContract: (id: string) => void
  onDeclineContract: (id: string) => void
  onShowReport: () => void
  onClose: () => void
}

export function CompanyPanel({
  state,
  onUpgradeOffice,
  onIpo,
  onRaiseInvestment,
  onBuyAmenity,
  onSignContract,
  onDeclineContract,
  onShowReport,
  onClose,
}: Props) {
  const staffCount = state.staff.length
  const max = maxStaff(state)
  const maxed = state.officeLevel >= MAX_OFFICE_LEVEL
  const upgradeCost = OFFICE_UPGRADE_BASE_COST * state.officeLevel
  const totalCustomers = state.models.reduce(
    (sum, m) => sum + (m.status === 'published' ? m.customers : 0),
    0,
  )
  const valuation = companyValuation(state)
  const canIpo = !state.isPublic && valuation >= IPO_VALUATION
  const ipoRaise = Math.round(valuation * IPO_RAISE_SHARE)
  const towardsIpo = Math.min(100, (valuation / IPO_VALUATION) * 100)
  const towardsWin = Math.min(100, (valuation / WIN_VALUATION) * 100)

  const currentWeek = globalWeek(state)
  const weeksSinceInvestment = currentWeek - state.lastInvestmentWeek
  const investmentReady = weeksSinceInvestment >= INVESTMENT_COOLDOWN_WEEKS
  const investmentValue = investmentRaiseAmount(state)

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Company</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="company-body">
        <div className="company-name-row">
          <span className="company-label">Name</span>
          <span className="company-value">{state.companyName}</span>
        </div>

        <div className="company-stat">
          <span className="company-label">Valuation</span>
          <span className="company-value">{formatMoney(valuation)}</span>
        </div>
        <div className="company-stat">
          <span className="company-label">Market mood</span>
          <span className="company-value" title="What the world thinks of AI this week. It multiplies everything except your cash.">
            {marketMood(state.hype)} ({state.hype.toFixed(2)}x)
          </span>
        </div>
        <div className="company-stat">
          <span className="company-label">Office level</span>
          <span className="company-value">Lvl {state.officeLevel}</span>
        </div>
        <div className="company-stat">
          <span className="company-label">Workers</span>
          <span className="company-value">
            {staffCount} / {max}
          </span>
        </div>

        <div className="office-upgrade">
          {maxed ? (
            <p className="placeholder">Office fully upgraded.</p>
          ) : (
            <>
              <p className="placeholder">
                Upgrade office to fit {max + DESKS_PER_LEVEL} workers ({max + DESKS_PER_LEVEL} desks).
              </p>
              <button
                className="big-button"
                disabled={state.money < upgradeCost}
                onClick={onUpgradeOffice}
              >
                Upgrade Office (${upgradeCost.toLocaleString()})
              </button>
            </>
          )}
        </div>

        <div className="office-upgrade">
          {state.isPublic ? (
            <>
              <p className="placeholder">
                📈 {state.companyName} is public. Reach {formatMoney(WIN_VALUATION)} to win the AI race —
                you are {towardsWin.toFixed(towardsWin < 1 ? 2 : 1)}% of the way there.
              </p>
              {state.won && <p className="placeholder">🏆 You already won. Everything from here is a victory lap.</p>}
            </>
          ) : canIpo ? (
            <>
              <p className="placeholder">
                Worth {formatMoney(valuation)}. Float the company and raise {formatMoney(ipoRaise)}.
              </p>
              <button className="big-button" onClick={onIpo}>
                Go Public (IPO)
              </button>
            </>
          ) : (
            <p className="placeholder">
              The IPO opens at {formatMoney(IPO_VALUATION)}. You are worth {formatMoney(valuation)},{' '}
              {towardsIpo.toFixed(towardsIpo < 1 ? 2 : 1)}% of the way, on {totalCustomers.toLocaleString()} paying
              customers.
            </p>
          )}
        </div>

        <div className="office-upgrade">
          <p className="placeholder">
            {investmentReady
              ? `Raise a funding round: +$${investmentValue.toLocaleString()}.`
              : `Investors need time — ready in ${INVESTMENT_COOLDOWN_WEEKS - weeksSinceInvestment}wk.`}
          </p>
          <button className="big-button" disabled={!investmentReady} onClick={onRaiseInvestment}>
            Raise Investment
          </button>
        </div>

        <div className="amenity-section">
          <h4 className="model-list-title">Enterprise contracts</h4>
          <p className="placeholder">
            Companies pay several times what the public product does, for seats. They hold you to a
            quality floor and to keeping the service up, and they leave the week you slip. Your best
            model is quality {Math.round(bestPublishedQuality(state))}.
          </p>
          {state.contracts.length === 0 && state.contractOffers.length === 0 && (
            <p className="placeholder">Nothing on the table. Ship something good and they will come.</p>
          )}
          {state.contracts.map((c) => (
            <div className="amenity-row owned" key={c.id}>
              <span className="amenity-what">
                {c.client}
                <span className="comp-sub">
                  {c.seats.toLocaleString()} seats · ${c.weeklyFee.toLocaleString()}/wk · quality{' '}
                  {c.minQuality} · {c.weeksLeft}wk left
                </span>
              </span>
              <span className="dc-label">Running</span>
            </div>
          ))}
          {state.contractOffers.map((o) => (
            <div className="amenity-row" key={o.id}>
              <span className="amenity-what">
                {o.client}
                <span className="comp-sub">
                  {o.seats.toLocaleString()} seats · ${o.weeklyFee.toLocaleString()}/wk · needs quality{' '}
                  {o.minQuality} · {o.weeksLeft}wk · breaking it costs ${o.penalty.toLocaleString()}
                </span>
              </span>
              <button
                className="hire-btn"
                disabled={bestPublishedQuality(state) < o.minQuality}
                title={
                  bestPublishedQuality(state) < o.minQuality
                    ? `Your best model is quality ${Math.round(bestPublishedQuality(state))}, short of ${o.minQuality}`
                    : 'Sign it'
                }
                onClick={() => onSignContract(o.id)}
              >
                Sign
              </button>
              <button className="hire-btn danger" onClick={() => onDeclineContract(o.id)}>
                Pass
              </button>
            </div>
          ))}
        </div>

        <div className="amenity-section">
          <h4 className="model-list-title">Office amenities</h4>
          <p className="placeholder">
            Bought once, and every one of them shows up in the room along the back wall.
          </p>
          {AMENITIES.map((a) => {
            const owned = state.amenities.includes(a.id)
            return (
              <div className={`amenity-row ${owned ? 'owned' : ''}`} key={a.id}>
                <span className="amenity-what">
                  {a.name}
                  <span className="comp-sub">{owned ? a.effect : a.blurb}</span>
                </span>
                <button
                  className="hire-btn"
                  disabled={owned || state.money < a.cost}
                  title={owned ? 'Already installed' : a.effect}
                  onClick={() => onBuyAmenity(a.id)}
                >
                  {owned ? 'Installed' : `$${a.cost.toLocaleString()}`}
                </button>
              </div>
            )
          })}
        </div>

        <div className="office-upgrade">
          <p className="placeholder">See how the run has gone so far.</p>
          <button className="big-button" onClick={onShowReport}>
            Run Report
          </button>
        </div>
      </div>
    </div>
  )
}
