import type { GameState } from '../game/types'
import { DESKS_PER_LEVEL, MAX_OFFICE_LEVEL, OFFICE_UPGRADE_BASE_COST } from '../game/constants'
import { maxStaff } from '../game/state'
import './Game.css'

interface Props {
  state: GameState
  onUpgradeOffice: () => void
  onClose: () => void
}

export function CompanyPanel({ state, onUpgradeOffice, onClose }: Props) {
  const staffCount = state.staff.length
  const max = maxStaff(state)
  const maxed = state.officeLevel >= MAX_OFFICE_LEVEL
  const upgradeCost = OFFICE_UPGRADE_BASE_COST * state.officeLevel

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
      </div>
    </div>
  )
}
