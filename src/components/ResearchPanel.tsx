import type { GameState } from '../game/types'
import { RESEARCH_ITEMS } from '../game/research'
import { isResearchAvailable } from '../game/state'
import './Game.css'

interface Props {
  state: GameState
  onStartResearch: (id: string) => void
  onClose: () => void
}

const WORKSHEETS = [
  {
    label: 'Gradient descent',
    formula: '∇θ L(θ) = (1/n) Σᵢ ∇θ ℓ(fθ(xᵢ), yᵢ)',
    scratch: ['θₜ₊₁ = θₜ − η∇θL', 'η = 0.0003 · loss ↓'],
  },
  {
    label: 'Attention pass',
    formula: 'Attention(Q,K,V) = softmax(QKᵀ / √dₖ)V',
    scratch: ['QKᵀ → score matrix', 'mask = causal · heads = 32'],
  },
  {
    label: 'Information theory',
    formula: 'H(p) = −Σᵢ pᵢ log₂(pᵢ)',
    scratch: ['KL(p || q) = Σ p log(p/q)', 'entropy stable · batch 42'],
  },
  {
    label: 'Bayesian update',
    formula: 'P(θ | D) ∝ P(D | θ) P(θ)',
    scratch: ['posterior → calibrated', 'evidence integral converging'],
  },
]

export function ResearchPanel({ state, onStartResearch, onClose }: Props) {
  const researcherCount = state.staff.filter((s) => s.role === 'researcher').length
  const running = state.researching[0]
  const worksheet = WORKSHEETS[(state.date.week + state.researched.length) % WORKSHEETS.length]

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

      <section className="research-console" aria-label="Live researcher worksheet">
        <div className="research-console-head">
          <span className="research-console-title">◉ LIVE LAB NOTEBOOK</span>
          <span className={researcherCount > 0 ? 'research-console-status online' : 'research-console-status'}>
            {researcherCount > 0 ? 'COMPUTING' : 'STANDBY'}
          </span>
        </div>
        <div className="research-console-body">
          <div className="research-equations">
            <span className="research-equation-label">{worksheet.label}</span>
            <code className="research-equation">{worksheet.formula}</code>
            <code>{worksheet.scratch[0]}</code>
            <code>{worksheet.scratch[1]}</code>
          </div>
          <div className="research-matrix" aria-hidden="true">
            {Array.from({ length: 16 }, (_, i) => (
              <i key={i} className={`matrix-cell level-${(i * 5 + state.date.week) % 5}`} />
            ))}
          </div>
        </div>
        <div className="research-console-foot">
          <span>{running ? `RUNNING: ${RESEARCH_ITEMS.find((item) => item.id === running.id)?.name ?? 'Research'}` : 'QUEUE: SELECT A RESEARCH PROJECT'}</span>
          <span>WEEK {state.date.week.toString().padStart(2, '0')}</span>
        </div>
      </section>

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
                    Researching... {Math.ceil(inProgress.weeksRemaining)}wk left
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
