import type { GameState } from '../game/types'
import { MODEL_TYPE_MAP } from '../game/research'
import { globalWeek } from '../game/state'
import './Game.css'

interface Props {
  state: GameState
  onPoach: (competitorId: string) => void
  onClose: () => void
}

export function CompetitorsPanel({ state, onPoach, onClose }: Props) {
  const week = globalWeek(state)
  const playerCustomers = state.models.reduce(
    (sum, m) => sum + (m.status === 'published' ? m.customers : 0),
    0,
  )

  const entries = [
    { id: 'you', name: state.companyName || 'You', icon: '⭐', customers: playerCustomers, isYou: true },
    ...state.competitors.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      customers: c.models.reduce(
        (sum, m) => sum + (m.releaseWeek <= week ? m.customers : 0),
        0,
      ),
      isYou: false,
    })),
  ].sort((a, b) => b.customers - a.customers)

  const totalCustomers = entries.reduce((sum, e) => sum + e.customers, 0)
  const share = totalCustomers > 0 ? Math.round((playerCustomers / totalCustomers) * 100) : 0

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Competitors</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="comp-overview">
        <div className="comp-overview-stat">
          <span className="comp-big">{playerCustomers.toLocaleString()}</span>
          <span className="comp-label">your customers</span>
        </div>
        <div className="comp-overview-stat">
          <span className="comp-big">{share}%</span>
          <span className="comp-label">market share</span>
        </div>
      </div>

      <div className="comp-leaderboard">
        {entries.map((e, i) => (
          <div key={e.id} className={`comp-row ${e.isYou ? 'you' : ''}`}>
            <span className="comp-rank">#{i + 1}</span>
            <span className="comp-icon">{e.icon}</span>
            <span className="comp-name">{e.name}</span>
            <span className="comp-customers">{e.customers.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="comp-detail-list">
        {state.competitors.map((c) => (
          <div className="comp-detail" key={c.id}>
            <div className="comp-detail-head">
              <span className="comp-name">
                {c.icon} {c.name}
              </span>
              <span className="comp-model-customers">👥 {c.followers.toLocaleString()}</span>
            </div>
            {c.models.map((m) => {
              const t = MODEL_TYPE_MAP[m.typeId]
              const active = m.releaseWeek <= week
              return (
                <div className="comp-model" key={m.id}>
                  <span className="comp-model-name">
                    {t?.icon} {m.name}
                  </span>
                  {active ? (
                    <span className="comp-model-customers">{m.customers.toLocaleString()}</span>
                  ) : (
                    <span className="comp-model-soon">Wk {m.releaseWeek}</span>
                  )}
                </div>
              )
            })}
            <button
              className="hire-btn"
              disabled={state.poached.includes(c.id) || state.money < 200000}
              onClick={() => onPoach(c.id)}
            >
              {state.poached.includes(c.id) ? 'Poached' : 'Poach talent ($200k)'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
