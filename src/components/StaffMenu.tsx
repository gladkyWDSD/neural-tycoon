import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { GameState, Staff } from '../game/types'
import {
  FIRE_SEVERANCE_WEEKS,
  MAX_STAFF_LEVEL,
  NATIONALITIES,
  ROLES,
} from '../game/constants'
import { canTrain, marketSalaryFor, staffPower, trainingCostFor, trainingWeeksFor } from '../game/hiring'
import { globalWeek } from '../game/state'
import './StaffMenu.css'

interface Props {
  staff: Staff
  state: GameState
  /** where the right-click happened, in client coordinates */
  x: number
  y: number
  onTrain: (staffId: string) => void
  onRaise: (staffId: string) => void
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

export function StaffMenu({ staff, state, x, y, onTrain, onRaise, onFire, onClose }: Props) {
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
  const training = state.staffTraining.find((t) => t.staffId === staff.id)
  const trainCost = trainingCostFor(staff.level)
  const trainWeeks = trainingWeeksFor(staff.level)
  const maxed = !canTrain(staff)
  const power = staffPower(staff)
  const market = marketSalaryFor(staff.role, power, globalWeek(state))
  const behind = market > staff.salary
  const severance = staff.salary * FIRE_SEVERANCE_WEEKS

  const money = (n: number) => `$${Math.round(n).toLocaleString()}`
  const act = (fn: () => void) => () => {
    fn()
    onClose()
  }

  const items: Item[] = [
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
