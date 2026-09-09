import type { GameState } from '../game/types'
import { globalWeek } from '../game/state'
import {
  BOT_ATTACK_COOLDOWN,
  BOT_ATTACK_COST,
  HACKER_COOLDOWN,
  HACKER_COST,
  JOURNALIST_COOLDOWN,
  JOURNALIST_COST,
} from '../game/constants'
import './Game.css'

interface Props {
  state: GameState
  onBotAttack: (competitorId: string) => void
  onHireHackers: (competitorId: string) => void
  onHireJournalists: () => void
  onClose: () => void
}

export function AdsPanel({ state, onBotAttack, onHireHackers, onHireJournalists, onClose }: Props) {
  const week = globalWeek(state)

  const journalistWait = JOURNALIST_COOLDOWN - (week - state.lastJournalistWeek)
  const botWait = BOT_ATTACK_COOLDOWN - (week - state.lastBotAttackWeek)
  const hackerWait = HACKER_COOLDOWN - (week - state.lastHackerWeek)

  const journalistReady = journalistWait <= 0
  const botReady = botWait <= 0
  const hackerReady = hackerWait <= 0

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">📢 Ads</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="smear-section">
        <h4 className="model-list-title">📰 Paid Journalists</h4>
        <div className="smear-row">
          <span className="smear-name">
            {journalistReady ? 'Glowing coverage: more followers and customers' : `Cooldown: ${journalistWait}wk`}
          </span>
          <button
            className="hire-btn"
            disabled={!journalistReady || state.money < JOURNALIST_COST}
            onClick={onHireJournalists}
          >
            Buy (${(JOURNALIST_COST / 1000).toFixed(0)}k)
          </button>
        </div>
      </div>

      <div className="smear-section">
        <h4 className="model-list-title">🤖 Bot Army — swarm a competitor</h4>
        {!botReady && <p className="placeholder">Cooldown: {botWait}wk</p>}
        <div className="smear-list">
          {state.competitors.map((c) => (
            <div className="smear-row" key={c.id}>
              <span className="smear-name">
                {c.icon} {c.name}
              </span>
              <button
                className="hire-btn"
                disabled={!botReady || state.money < BOT_ATTACK_COST}
                onClick={() => onBotAttack(c.id)}
              >
                Swarm (${(BOT_ATTACK_COST / 1000).toFixed(0)}k)
              </button>
            </div>
          ))}
        </div>
        <p className="placeholder">Drains their followers and customers — but the bots can be traced back to you.</p>
      </div>

      <div className="smear-section">
        <h4 className="model-list-title">💀 Hackers — sabotage a competitor</h4>
        {!hackerReady && <p className="placeholder">Cooldown: {hackerWait}wk</p>}
        <div className="smear-list">
          {state.competitors.map((c) => (
            <div className="smear-row" key={c.id}>
              <span className="smear-name">
                {c.icon} {c.name}
              </span>
              <button
                className="hire-btn"
                disabled={!hackerReady || state.money < HACKER_COST}
                onClick={() => onHireHackers(c.id)}
              >
                Hack (${(HACKER_COST / 1000).toFixed(0)}k)
              </button>
            </div>
          ))}
        </div>
        <p className="placeholder">Wrecks their model quality and customers. Get caught and you pay a heavy fine.</p>
      </div>
    </div>
  )
}
