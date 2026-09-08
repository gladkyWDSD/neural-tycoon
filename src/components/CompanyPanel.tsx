import type { GameState } from '../game/types'
import { DESKS_PER_LEVEL, INVESTMENT_COOLDOWN_WEEKS, MAX_OFFICE_LEVEL, OFFICE_UPGRADE_BASE_COST } from '../game/constants'
import { globalWeek, investmentRaiseAmount, maxStaff } from '../game/state'
import './Game.css'

interface Props {
  state: GameState
  onUpgradeOffice: () => void
  onIpo: () => void
  onRaiseInvestment: () => void
  onClose: () => void
}

export function CompanyPanel({ state, onUpgradeOffice, onIpo, onRaiseInvestment, onClose }: Props) {
  const staffCount = state.staff.length
  const max = maxStaff(state)
  const maxed = state.officeLevel >= MAX_OFFICE_LEVEL
  const upgradeCost = OFFICE_UPGRADE_BASE_COST * state.officeLevel
  const totalCustomers = state.models.reduce(
    (sum, m) => sum + (m.status === 'published' ? m.customers : 0),
    0,
  )
  const canIpo = !state.isPublic && totalCustomers >= 250000
  const ipoValue = totalCustomers * 15

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
            <p className="placeholder">📈 {state.companyName} is a public company.</p>
          ) : canIpo ? (
            <>
              <p className="placeholder">
                Go public! Raise ${ipoValue.toLocaleString()} (needs 250k customers).
              </p>
              <button className="big-button" onClick={onIpo}>
                📈 Go Public (IPO)
              </button>
            </>
          ) : (
            <p className="placeholder">
              IPO unlocks at 250,000 customers (now {totalCustomers.toLocaleString()}).
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
            💰 Raise Investment
          </button>
        </div>
      </div>
    </div>
  )
}
