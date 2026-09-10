import { useMemo, useState } from 'react'
import type { GameState, Nationality, Role, Staff } from '../game/types'
import {
  NATIONALITIES,
  ROLES,
  MAX_SCORE,
  MAX_STAFF_LEVEL,
  MIN_HIRE_SCORE,
  MIN_SCORE,
} from '../game/constants'
import { canTrain, generateCandidate, staffPower, trainingCostFor, trainingWeeksFor } from '../game/hiring'
import { maxStaff } from '../game/state'
import './Game.css'

type Sort = 'score' | 'salary-asc' | 'salary-desc'

interface Props {
  state: GameState
  onHire: (staff: Staff) => void
  onStartTraining: (staffId: string) => void
  onClose: () => void
}

export function HirePanel({ state, onHire, onStartTraining, onClose }: Props) {
  const [role, setRole] = useState<Role>('researcher')
  const [nationality, setNationality] = useState<Nationality | 'all'>('all')
  const [minScore, setMinScore] = useState(180)
  const [maxScore, setMaxScore] = useState(MAX_SCORE)
  const [sort, setSort] = useState<Sort>('score')

  const full = state.staff.length >= maxStaff(state)

  // The shortlist is real: someone you hire is off the market straight away. The
  // pool is keyed on the filters, so changing them (or asking for new candidates)
  // draws a fresh shortlist and forgets who was taken off the old one.
  const [reroll, setReroll] = useState(0)
  const poolKey = `${role}|${nationality}|${minScore}|${maxScore}|${reroll}`
  const pool = useMemo(() => {
    const nat = nationality === 'all' ? null : nationality
    const list: Staff[] = []
    for (let i = 0; i < 6; i++) {
      const n = nat ?? (['china', 'europe', 'usa'] as Nationality[])[i % 3]
      list.push(generateCandidate(n, role, minScore, maxScore))
    }
    return list
    // the key covers every input; listing them again would regenerate on each keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolKey])

  const [taken, setTaken] = useState<{ key: string; ids: string[] }>({ key: poolKey, ids: [] })
  const takenIds = taken.key === poolKey ? taken.ids : []

  // six rows, so sorting them on every render costs nothing
  const candidates = pool.filter((c) => !takenIds.includes(c.id))
  if (sort === 'score') candidates.sort((a, b) => b.examScore - a.examScore)
  else if (sort === 'salary-asc') candidates.sort((a, b) => a.salary - b.salary)
  else candidates.sort((a, b) => b.salary - a.salary)

  function hire(candidate: Staff) {
    onHire(candidate)
    setTaken((t) => ({ key: poolKey, ids: [...(t.key === poolKey ? t.ids : []), candidate.id] }))
  }

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
        {candidates.length === 0 && (
          <p className="placeholder">You have hired everyone on this shortlist.</p>
        )}
        <button className="hire-btn reroll-btn" onClick={() => setReroll((n) => n + 1)}>
          New candidates
        </button>
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
              onClick={() => hire(c)}
            >
              {full ? 'Full' : 'Hire'}
            </button>
          </div>
        ))}
      </div>

      {state.staff.length > 0 && (
        <div className="model-list">
          <h4 className="model-list-title">Your Staff — Train Up Levels</h4>
          {state.staff.map((s) => {
            const training = state.staffTraining.find((t) => t.staffId === s.id)
            const maxed = !canTrain(s)
            const trainCost = trainingCostFor(s.level)
            const trainWeeks = trainingWeeksFor(s.level)
            return (
              <div className="candidate" key={s.id}>
                <div className="candidate-name">
                  {NATIONALITIES[s.nationality].flag} {s.name}
                </div>
                <div className="candidate-spec">
                  {ROLES.find((r) => r.id === s.role)?.label} · {staffPower(s).toLocaleString()} pts
                </div>
                <div className={`candidate-score ${s.examScore >= 190 ? 'elite' : ''}`}>Lv {s.level}</div>
                {training ? (
                  <span className="candidate-salary">Lv {training.toLevel} in {Math.ceil(training.weeksRemaining)}wk</span>
                ) : (
                  <button
                    className="hire-btn"
                    disabled={maxed || state.money < trainCost}
                    onClick={() => onStartTraining(s.id)}
                  >
                    {maxed
                      ? `Max Lv ${MAX_STAFF_LEVEL}`
                      : `Lv ${s.level + 1} · ${trainWeeks}wk · $${(trainCost / 1000).toFixed(0)}k`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
