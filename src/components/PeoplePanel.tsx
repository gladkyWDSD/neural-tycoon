import { useState } from 'react'
import type { GameState, Staff } from '../game/types'
import { BREAK_COOLDOWN_WEEKS, BREAK_MORALE, MAX_STAFF_LEVEL, NATIONALITIES, ROLES } from '../game/constants'
import { canAssign, marketSalaryFor, staffPower } from '../game/hiring'
import { globalWeek, onLeave } from '../game/state'
import {
  UNHAPPY,
  averageMorale,
  moodColour,
  moodLabel,
  payGap,
  traitsOf,
  unhappyCount,
} from '../game/people'
import './Game.css'

interface Props {
  state: GameState
  onAssign: (staffId: string, assignment: Staff['assignment']) => void
  onRaise: (staffId: string) => void
  onBreak: (staffId: string) => void
  onClose: () => void
}

type Sort = 'mood' | 'pay' | 'power'

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

/** Why somebody is in the mood they are in, in one line. */
function gripe(state: GameState, s: Staff, week: number): string {
  if (s.noticeWeeks != null) return `Working their notice — ${s.noticeWeeks} week${s.noticeWeeks === 1 ? '' : 's'} left`
  if (onLeave(state, s.id)) return 'On a week off'
  const gap = payGap(s, week)
  if (gap > 0.12) return `Paid ${Math.round(gap * 100)}% under the market`
  if ((s.morale ?? 70) < UNHAPPY) return `Unhappy ${s.unhappyWeeks} week${s.unhappyWeeks === 1 ? '' : 's'} running`
  if (gap > 0.05) return 'Slipping behind the market'
  if ((s.morale ?? 70) >= 85) return 'Would not work anywhere else'
  return 'No complaints'
}

/** The roster: everybody, how they are, and what it would take to fix them. */
export function PeoplePanel({ state, onAssign, onRaise, onBreak, onClose }: Props) {
  const [sort, setSort] = useState<Sort>('mood')
  const week = globalWeek(state)
  const avg = averageMorale(state)
  const unhappy = unhappyCount(state)
  const leaving = state.staff.filter((s) => s.noticeWeeks != null).length

  const list = [...state.staff]
  if (sort === 'mood') list.sort((a, b) => (a.morale ?? 70) - (b.morale ?? 70))
  else if (sort === 'pay') list.sort((a, b) => payGap(b, week) - payGap(a, week))
  else list.sort((a, b) => staffPower(b) - staffPower(a))

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
          <span className="people-stat-value" style={{ color: moodColour(avg) }}>
            {state.staff.length === 0 ? '—' : `${Math.round(avg)}%`}
          </span>
          <span className="people-stat-label">Average mood</span>
        </div>
        <div className="people-stat">
          <span className="people-stat-value" style={{ color: unhappy > 0 ? '#ff5c5c' : '#3ddc84' }}>
            {unhappy}
          </span>
          <span className="people-stat-label">Unhappy</span>
        </div>
        <div className="people-stat">
          <span className="people-stat-value" style={{ color: leaving > 0 ? '#ff5c5c' : 'inherit' }}>
            {leaving}
          </span>
          <span className="people-stat-label">Working notice</span>
        </div>
        <div className="people-sorts">
          {(['mood', 'pay', 'power'] as Sort[]).map((s) => (
            <button key={s} className={`people-sort ${sort === s ? 'active' : ''}`} onClick={() => setSort(s)}>
              {s === 'mood' ? 'By mood' : s === 'pay' ? 'By pay gap' : 'By value'}
            </button>
          ))}
        </div>
      </div>

      {state.staff.length === 0 && <p className="empty-note">Nobody works here yet.</p>}

      <div className="people-list">
        {list.map((s) => {
          const morale = s.morale ?? 70
          const market = marketSalaryFor(s.role, staffPower(s), week)
          const behind = market > s.salary
          const role = ROLES.find((r) => r.id === s.role)
          return (
            <div className={`person-row ${s.noticeWeeks != null ? 'is-leaving' : ''}`} key={s.id}>
              <div className="person-head">
                <span className="person-name">
                  {NATIONALITIES[s.nationality].flag} {s.name}
                </span>
                <span className="person-role">
                  {role?.label} · Lv {s.level}/{MAX_STAFF_LEVEL} · {staffPower(s).toLocaleString()} pts
                </span>
              </div>

              <div className="person-mood">
                <div className="person-mood-track">
                  <div
                    className="person-mood-fill"
                    style={{ width: `${Math.round(morale)}%`, background: moodColour(morale) }}
                  />
                </div>
                <span className="person-mood-label" style={{ color: moodColour(morale) }}>
                  {moodLabel(morale)}
                </span>
              </div>

              <div className="person-traits">
                {traitsOf(s).map((t) => (
                  <span className="person-trait" key={t.id} title={t.blurb}>
                    {t.name}
                  </span>
                ))}
              </div>

              <div className="person-gripe">{gripe(state, s, week)}</div>

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
                  title={`A week at home, then back ${BREAK_MORALE} points happier. Once every ${BREAK_COOLDOWN_WEEKS} weeks.`}
                  onClick={() => onBreak(s.id)}
                >
                  {onLeave(state, s.id) ? 'On a break' : 'Week off'}
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
