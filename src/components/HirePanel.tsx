import { useMemo, useState } from 'react'
import type { GameState, Nationality, Role, Staff } from '../game/types'
import { NATIONALITIES, MAX_SCORE, MIN_HIRE_SCORE, MIN_SCORE } from '../game/constants'
import { generateCandidate } from '../game/hiring'
import { maxStaff } from '../game/state'
import './Game.css'

const ROLES: { id: Role; label: string; icon: string }[] = [
  { id: 'researcher', label: 'Researcher', icon: '∑' },
  { id: 'engineer', label: 'Engineer', icon: '</>' },
  { id: 'marketer', label: 'Marketer', icon: '★' },
  { id: 'lawyer', label: 'Lawyer', icon: '§' },
]

type Sort = 'score' | 'salary-asc' | 'salary-desc'

interface Props {
  state: GameState
  onHire: (staff: Staff) => void
  onClose: () => void
}

export function HirePanel({ state, onHire, onClose }: Props) {
  const [role, setRole] = useState<Role>('researcher')
  const [nationality, setNationality] = useState<Nationality | 'all'>('all')
  const [minScore, setMinScore] = useState(180)
  const [maxScore, setMaxScore] = useState(MAX_SCORE)
  const [sort, setSort] = useState<Sort>('score')

  const full = state.staff.length >= maxStaff(state)

  const candidates = useMemo(() => {
    const nat = nationality === 'all' ? null : nationality
    const list: Staff[] = []
    for (let i = 0; i < 6; i++) {
      const n = nat ?? (['china', 'europe', 'usa'] as Nationality[])[i % 3]
      list.push(generateCandidate(n, role, minScore, maxScore))
    }
    const sorted = [...list]
    if (sort === 'score') {
      sorted.sort((a, b) => b.examScore - a.examScore)
    } else if (sort === 'salary-asc') {
      sorted.sort((a, b) => a.salary - b.salary)
    } else {
      sorted.sort((a, b) => b.salary - a.salary)
    }
    return sorted
  }, [role, nationality, minScore, maxScore, sort])

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Hire Staff</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="role-tabs">
        {ROLES.map((r) => (
          <button
            key={r.id}
            className={`role-tab ${role === r.id ? 'active' : ''}`}
            onClick={() => setRole(r.id)}
          >
            <span className="role-icon">{r.icon}</span>
            {r.label}
          </button>
        ))}
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Nationality</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${nationality === 'all' ? 'active' : ''}`}
              onClick={() => setNationality('all')}
            >
              All
            </button>
            {(Object.keys(NATIONALITIES) as Nationality[]).map((n) => (
              <button
                key={n}
                className={`filter-btn ${nationality === n ? 'active' : ''}`}
                onClick={() => setNationality(n)}
              >
                {NATIONALITIES[n].flag} {NATIONALITIES[n].label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Exam score ({MIN_SCORE}-{MAX_SCORE})</label>
          <div className="score-filter">
            <input
              type="number"
              min={MIN_HIRE_SCORE}
              max={maxScore}
              value={minScore}
              onChange={(e) => setMinScore(Math.max(MIN_HIRE_SCORE, Number(e.target.value)))}
            />
            <span>–</span>
            <input
              type="number"
              min={minScore}
              max={MAX_SCORE}
              value={maxScore}
              onChange={(e) => setMaxScore(Math.min(MAX_SCORE, Number(e.target.value)))}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Sort by</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${sort === 'score' ? 'active' : ''}`}
              onClick={() => setSort('score')}
            >
              Score
            </button>
            <button
              className={`filter-btn ${sort === 'salary-asc' ? 'active' : ''}`}
              onClick={() => setSort('salary-asc')}
            >
              Salary ↑
            </button>
            <button
              className={`filter-btn ${sort === 'salary-desc' ? 'active' : ''}`}
              onClick={() => setSort('salary-desc')}
            >
              Salary ↓
            </button>
          </div>
        </div>
      </div>

      <div className="candidate-list">
        {candidates.map((c) => (
          <div className="candidate" key={c.id}>
            <div className="candidate-name">
              {NATIONALITIES[c.nationality].flag} {c.name}
            </div>
            <div className="candidate-spec">
              {ROLES.find((r) => r.id === c.role)?.label}
            </div>
            <div className={`candidate-score ${c.examScore >= 190 ? 'elite' : ''}`}>
              {c.examScore} pts
            </div>
            <div className="candidate-salary">${c.salary.toLocaleString()}/wk</div>
            <button
              className="hire-btn"
              disabled={full || state.money < c.salary}
              onClick={() => onHire(c)}
            >
              {full ? 'Full' : 'Hire'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
