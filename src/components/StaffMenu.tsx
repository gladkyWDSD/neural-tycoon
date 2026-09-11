import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { GameState, Staff } from '../game/types'
import {
  BREAK_COOLDOWN_WEEKS,
  FIRE_SEVERANCE_WEEKS,
  MAX_STAFF_LEVEL,
  NATIONALITIES,
  ROLES,
} from '../game/constants'
import { canAssign, canTrain, marketSalaryFor, staffPower, trainingCostFor, trainingWeeksFor } from '../game/hiring'
import { globalWeek, onLeave } from '../game/state'
import { BREAK_WEEKS, traitsOf } from '../game/people'
import './StaffMenu.css'

interface Props {
  staff: Staff
  state: GameState
  /** where the right-click happened, in client coordinates */
  x: number
  y: number
  onTrain: (staffId: string) => void
  onAssign: (staffId: string, assignment: Staff['assignment']) => void
  onRaise: (staffId: string) => void
  onBreak: (staffId: string) => void
  onFire: (staffId: string) => void
  onClose: () => void
}

interface Item {
  label: string
  hint: string
  danger?: boolean
  disabled?: boolean
  run?: () => void
}

export function StaffMenu({ staff, state, x, y, onTrain, onAssign, onRaise, onBreak, onFire, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })

  // keep the menu on screen no matter which corner you clicked in
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    setPos({
      x: Math.max(8, Math.min(x, window.innerWidth - width - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - height - 8)),
    })
  }, [x, y])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const role = ROLES.find((r) => r.id === staff.role)
  const week = globalWeek(state)
  const training = state.staffTraining.find((t) => t.staffId === staff.id)
  const trainCost = trainingCostFor(staff.level)
  const trainWeeks = trainingWeeksFor(staff.level)
  const maxed = !canTrain(staff)
  const power = staffPower(staff)
  const market = marketSalaryFor(staff.role, power, week)
  const behind = market > staff.salary
  const severance = staff.salary * FIRE_SEVERANCE_WEEKS

  const money = (n: number) => `$${Math.round(n).toLocaleString()}`
  const act = (fn: () => void) => () => {
    fn()
    onClose()
  }

  const allJobs: { id: Staff['assignment']; label: string; hint: string }[] = [
    { id: 'research', label: 'Research', hint: 'Researchers here unlock techniques and raise the ceiling on quality.' },
    { id: 'training', label: 'Training runs', hint: 'Engineers here build models faster and better.' },
    { id: 'data', label: 'Data curation', hint: 'Anyone here fills the data pipeline faster.' },
    { id: 'ops', label: 'Reliability', hint: 'Anyone here stretches what a card can serve and softens incidents.' },
    { id: 'chips', label: 'Chip design', hint: 'Hardware engineers here design silicon of your own.' },
  ]
  // Only the hardware engineers get moved around the company; everybody else
  // does the job they were hired for, and can be lent to a training run.
  const jobs = allJobs.filter((j) => canAssign(staff.role, j.id))

  const onBreakNow = onLeave(state, staff.id)
  const sinceBreak = week - (staff.lastBreakWeek ?? -BREAK_COOLDOWN_WEEKS)
  const breakReady = !onBreakNow && sinceBreak >= BREAK_COOLDOWN_WEEKS

  const items: Item[] = [
    ...jobs.map((j) => ({
      label: staff.assignment === j.id ? `On ${j.label.toLowerCase()}` : `Put on ${j.label.toLowerCase()}`,
      hint: j.hint,
      disabled: staff.assignment === j.id,
      run: act(() => onAssign(staff.id, j.id)),
    })),
    {
      label: onBreakNow ? 'On a break' : `Send them home for ${BREAK_WEEKS} weeks`,
      hint: onBreakNow
        ? 'They are at home. You are still paying them.'
        : breakReady
          ? `${BREAK_WEEKS} weeks of no work at all from them, and they are still on the payroll.`
          : `Another break in ${BREAK_COOLDOWN_WEEKS - sinceBreak}wk. A break you hand out every week is not a break.`,
      disabled: !breakReady,
      run: act(() => onBreak(staff.id)),
    },
    training
      ? {
          label: `Training to level ${training.toLevel}`,
          hint: `${Math.ceil(training.weeksRemaining)}wk left, then worth ${(staff.examScore * training.toLevel).toLocaleString()} pts.`,
          disabled: true,
        }
      : {
          label: maxed ? `Max level ${MAX_STAFF_LEVEL}` : `Train to level ${staff.level + 1}`,
          hint: maxed
            ? `Nothing left to teach them. They are worth ${power.toLocaleString()} pts.`
            : state.money < trainCost
              ? `Costs ${money(trainCost)} and you have ${money(state.money)}.`
              : `${trainWeeks}wk and ${money(trainCost)}, for ${(power + staff.examScore).toLocaleString()} pts.`,
          disabled: maxed || state.money < trainCost,
          run: act(() => onTrain(staff.id)),
        },
    {
      label: behind ? `Give a raise to ${money(market)}/wk` : 'Give a raise',
      hint: behind
        ? `${money(market - staff.salary)}/wk behind market. Underpaid staff attract rivals.`
        : 'Already paid at or above the market rate.',
      disabled: !behind,
      run: act(() => onRaise(staff.id)),
    },
    {
      label: 'Fire',
      hint:
        state.money < severance
          ? `Severance is ${money(severance)} and you have ${money(state.money)}.`
          : `${FIRE_SEVERANCE_WEEKS} weeks of severance, ${money(severance)}.`,
      danger: true,
      disabled: state.money < severance,
      run: act(() => onFire(staff.id)),
    },
  ]

  return (
    <>
      <div
        className="staff-menu-backdrop"
        onMouseDown={onClose}
        onContextMenu={(e) => {
          e.preventDefault()
          onClose()
        }}
      />
      <div className="staff-menu" ref={ref} style={{ left: pos.x, top: pos.y }}>
        <div className="staff-menu-head">
          <div className="staff-menu-name">
            {NATIONALITIES[staff.nationality].flag} {staff.name}
          </div>
          <div className="staff-menu-sub">
            {role?.label} · Lv {staff.level}/{MAX_STAFF_LEVEL} · {power.toLocaleString()} pts
          </div>
          <div className="staff-menu-sub">
            {staff.examScore} base × {staff.level} · {money(staff.salary)}/wk
          </div>
          <div className="staff-menu-traits">
            {traitsOf(staff).map((t) => (
              <span className="staff-menu-trait" key={t.id} title={t.blurb}>
                {t.name}
              </span>
            ))}
          </div>
        </div>
        {items.map((item, i) => (
          <button
            key={i}
            className={`staff-menu-item${item.danger ? ' is-danger' : ''}`}
            disabled={item.disabled}
            onClick={item.run}
          >
            <span className="staff-menu-label">{item.label}</span>
            <span className="staff-menu-hint">{item.hint}</span>
          </button>
        ))}
      </div>
    </>
  )
}
