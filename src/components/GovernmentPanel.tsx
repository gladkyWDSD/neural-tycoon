import type { GameState } from '../game/types'
import { globalWeek } from '../game/state'
import { LOBBY_COOLDOWN, LOBBY_COST, LOBBY_DURATION, REGULATION_START_WEEK } from '../game/constants'
import { REGULATION_MAP, regulationEffectSummary } from '../game/regulations'
import './Game.css'

interface Props {
  state: GameState
  onHireLobbyists: () => void
  onClose: () => void
}

export function GovernmentPanel({ state, onHireLobbyists, onClose }: Props) {
  const week = globalWeek(state)
  const lobbyWait = LOBBY_COOLDOWN - (week - state.lastLobbyWeek)
  const lobbyReady = lobbyWait <= 0
  const lobbyActive = state.lobbyWeeksLeft > 0
  const regulations = state.activeRegulations.map((id) => REGULATION_MAP[id]).filter(Boolean)

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">🏛️ Government</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="smear-section">
        <h4 className="model-list-title">Active US Regulations</h4>
        {week < REGULATION_START_WEEK && (
          <p className="placeholder">Regulators haven't noticed you yet — risk starts around week {REGULATION_START_WEEK}.</p>
        )}
        {week >= REGULATION_START_WEEK && regulations.length === 0 && (
          <p className="placeholder">No active regulations right now. Stay lucky — or keep lobbying.</p>
        )}
        {regulations.map((r) => (
          <div className="smear-row" key={r.id}>
            <span className="smear-name" title={r.description}>
              {r.icon} {r.name}
            </span>
            <span className="dc-label">{regulationEffectSummary(r).join(' · ')}</span>
          </div>
        ))}
      </div>

      <div className="smear-section">
        <h4 className="model-list-title">🤝 Lobbying</h4>
        <p className="placeholder">
          {lobbyActive
            ? `Lobbyists are actively working — ${state.lobbyWeeksLeft}wk of reduced regulatory risk left.`
            : 'Hire lobbyists to suppress new regulations & datacenter shutdown risk, with a chance to repeal an active regulation.'}
        </p>
        <div className="smear-row">
          <span className="smear-name">
            {lobbyReady ? `${LOBBY_DURATION}wk of reduced risk` : `Cooldown: ${lobbyWait}wk`}
          </span>
          <button
            className="hire-btn"
            disabled={!lobbyReady || state.money < LOBBY_COST}
            onClick={onHireLobbyists}
          >
            Hire (${(LOBBY_COST / 1000).toFixed(0)}k)
          </button>
        </div>
      </div>
    </div>
  )
}
