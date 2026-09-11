import { useState } from 'react'
import type { GameState, Staff } from '../game/types'
import { BREAK_COOLDOWN_WEEKS, MAX_STAFF_LEVEL, NATIONALITIES, ROLES } from '../game/constants'
import { canAssign, marketSalaryFor, staffPower } from '../game/hiring'
import { globalWeek, onLeave } from '../game/state'
import { BREAK_WEEKS, payGap, traitsOf } from '../game/people'
import './Game.css'

interface Props {
  state: GameState
  onAssign: (staffId: string, assignment: Staff['assignment']) => void
  onRaise: (staffId: string) => void
  onBreak: (staffId: string) => void
  onClose: () => void
}

type Sort = 'pay' | 'power' | 'name'

const JOBS: { id: Staff['assignment']; label: string }[] = [
  { id: 'research', label: 'Research' },
  { id: 'training', label: 'Training' },
  { id: 'data', label: 'Data' },
  { id: 'ops', label: 'Reliability' },
  { id: 'chips', label: 'Chips' },
]

/**
 * Where somebody can be put.
 *
 * Only hardware engineers move around the company. Everybody else does the job
 * they were hired for, and can be lent to a training run.
 */
function jobsFor(s: Staff): typeof JOBS {
  return JOBS.filter((j) => canAssign(s.role, j.id))
}

/** Can you send them home this week? */
function breakReady(state: GameState, s: Staff, week: number): boolean {
  if (onLeave(state, s.id)) return false
  return week - (s.lastBreakWeek ?? -BREAK_COOLDOWN_WEEKS) >= BREAK_COOLDOWN_WEEKS
}

/** The roster: everybody, what they cost, and who is away. */
export function PeoplePanel({ state, onAssign, onRaise, onBreak, onClose }: Props) {
  const [sort, setSort] = useState<Sort>('pay')
  const week = globalWeek(state)
  const away = state.staff.filter((s) => onLeave(state, s.id)).length
  const behindCount = state.staff.filter((s) => payGap(s, week) > 0.05).length

  const list = [...state.staff]
  if (sort === 'pay') list.sort((a, b) => payGap(b, week) - payGap(a, week))
  else if (sort === 'power') list.sort((a, b) => staffPower(b) - staffPower(a))
  else list.sort((a, b) => a.name.localeCompare(b.name))

  const money = (n: number) => `$${Math.round(n).toLocaleString()}`

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Your people</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="people-summary">
        <div className="people-stat">
          <span className="people-stat-value">{state.staff.length}</span>
          <span className="people-stat-label">On the payroll</span>
        </div>
        <div className="people-stat">
          <span className="people-stat-value" style={{ color: behindCount > 0 ? '#ffd166' : '#3ddc84' }}>
            {behindCount}
          </span>
          <span className="people-stat-label">Behind market</span>
        </div>
        <div className="people-stat">
          <span className="people-stat-value" style={{ color: away > 0 ? '#4aa3ff' : 'inherit' }}>
            {away}
          </span>
          <span className="people-stat-label">On a break</span>
        </div>
        <div className="people-sorts">
          {(['pay', 'power', 'name'] as Sort[]).map((s) => (
            <button key={s} className={`people-sort ${sort === s ? 'active' : ''}`} onClick={() => setSort(s)}>
              {s === 'pay' ? 'By pay gap' : s === 'power' ? 'By value' : 'By name'}
            </button>
          ))}
        </div>
      </div>

      {state.staff.length === 0 && <p className="empty-note">Nobody works here yet.</p>}

      <div className="people-list">
        {list.map((s) => {
          const market = marketSalaryFor(s.role, staffPower(s), week)
          const behind = market > s.salary
          const role = ROLES.find((r) => r.id === s.role)
          const off = onLeave(state, s.id)
          const back = state.sabbaticals.find((sb) => sb.id === s.id)?.untilWeek ?? 0
          return (
            <div className={`person-row ${off ? 'is-away' : ''}`} key={s.id}>
              <div className="person-head">
                <span className="person-name">
                  {NATIONALITIES[s.nationality].flag} {s.name}
                </span>
                <span className="person-role">
                  {role?.label} · Lv {s.level}/{MAX_STAFF_LEVEL} · {staffPower(s).toLocaleString()} pts
                </span>
              </div>

              <div className="person-traits">
                {traitsOf(s).map((t) => (
                  <span className="person-trait" key={t.id} title={t.blurb}>
                    {t.name}
                  </span>
                ))}
              </div>

              <div className="person-gripe">
                {off
                  ? `On a break — back in ${Math.max(1, back - week)} week${back - week === 1 ? '' : 's'}`
                  : behind
                    ? `Paid ${Math.round(payGap(s, week) * 100)}% under the market`
                    : 'Paid at the going rate'}
              </div>

              <div className="person-actions">
                <span className="person-pay">
                  {money(s.salary)}/wk
                  {behind && <span className="person-behind"> · market {money(market)}</span>}
                </span>
                <button className="person-btn" disabled={!behind} onClick={() => onRaise(s.id)}>
                  {behind ? `Raise to ${money(market)}` : 'Paid at market'}
                </button>
                <button
                  className="person-btn"
                  disabled={!breakReady(state, s, week)}
                  title={`${BREAK_WEEKS} weeks at home. Once every ${BREAK_COOLDOWN_WEEKS} weeks.`}
                  onClick={() => onBreak(s.id)}
                >
                  {off ? 'On a break' : `${BREAK_WEEKS}wk break`}
                </button>
                <select
                  className="person-job"
                  value={s.assignment}
                  onChange={(e) => onAssign(s.id, e.target.value as Staff['assignment'])}
                >
                  {jobsFor(s).map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
