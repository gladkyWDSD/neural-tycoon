import type { GameState } from '../game/types'
import { RESEARCH_ITEMS } from '../game/research'
import { isResearchAvailable } from '../game/state'
import './Game.css'

interface Props {
  state: GameState
  onStartResearch: (id: string) => void
  onClose: () => void
}

export function ResearchPanel({ state, onStartResearch, onClose }: Props) {
  const researcherCount = state.staff.filter((s) => s.role === 'researcher').length

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Research</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <p className="research-note">
        {researcherCount > 0
          ? `${researcherCount} researcher${researcherCount > 1 ? 's' : ''} working — more researchers = faster research.`
          : 'Hire a researcher to start research.'}
      </p>

      <div className="research-list">
        {RESEARCH_ITEMS.map((item) => {
          const done = state.researched.includes(item.id)
          const inProgress = state.researching.find((r) => r.id === item.id)
          const available = isResearchAvailable(item.id, state.researched, state.researching.map((r) => r.id))
          const locked = !done && !inProgress && !available
          const duration = Math.max(1, Math.ceil(item.weeks / Math.max(1, researcherCount)))

          return (
            <div
              key={item.id}
              className={`research-item ${done ? 'done' : ''} ${locked ? 'locked' : ''}`}
            >
              <div className="research-head">
                <span className="research-name">{item.name}</span>
                {item.qualityBonus > 0 && (
                  <span className="research-bonus">+{item.qualityBonus} quality</span>
                )}
              </div>
              <p className="research-desc">{item.description}</p>
              <div className="research-meta">
                {done ? (
                  <span className="research-status done-text">✓ Researched</span>
                ) : inProgress ? (
                  <span className="research-status progress-text">
                    Researching... {inProgress.weeksRemaining}wk left
                  </span>
                ) : locked ? (
                  <span className="research-status locked-text">
                    Requires: {item.requires.map((r) => RESEARCH_ITEMS.find((x) => x.id === r)?.name).join(', ') || '—'}
                  </span>
                ) : (
                  <button
                    className="research-btn"
                    disabled={researcherCount < 1 || state.money < item.cost}
                    onClick={() => onStartResearch(item.id)}
                  >
                    Research (${item.cost.toLocaleString()} · {duration}wk)
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
