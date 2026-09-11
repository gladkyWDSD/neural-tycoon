import { useEffect, useRef } from 'react'
import type { GameState } from '../game/types'
import { SCALE, TILE } from './officeArt'
import { drawCharacter } from './sprites'
import { activeCards } from '../game/gpu'
import { cardsTraining, serviceLoad } from '../game/state'
import { chipPower } from '../game/state'
import {
  HALL_COLS,
  HALL_ROWS,
  drawCableTrays,
  drawCooler,
  drawHallFloor,
  drawHallScreen,
  drawRack,
} from './serverArt'

interface Props {
  state: GameState
  onLeave: () => void
}

const RACK_ROWS = [3, 9]
const RACKS_PER_ROW = 7
const SLOTS_PER_RACK = 8

/** Inside a hall: the cards you own, in the racks, doing the work. */
export function DatacenterView({ state, onLeave }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const W = HALL_COLS * TILE
  const H = HALL_ROWS * TILE
  const cards = activeCards(state)
  const load = serviceLoad(state)
  const idle = Math.max(0, state.gpuCards - cards)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    let raf = 0
    const draw = (now: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      drawHallFloor(ctx)
      drawCableTrays(ctx, now)

      // every card you own, filling the racks from the front
      let left = cards
      RACK_ROWS.forEach((row, r) => {
        for (let i = 0; i < RACKS_PER_ROW; i++) {
          const inThis = Math.max(0, Math.min(SLOTS_PER_RACK, left))
          drawRack(ctx, 2 + i * 4, row, inThis, now, r * 7 + i)
          left -= inThis
        }
      })

      drawCooler(ctx, HALL_COLS - 3, 3, now)
      drawCooler(ctx, HALL_COLS - 3, 9, now)
      drawHallScreen(ctx, 14, 1, Number.isFinite(load) ? load : 2, now)

      // a technician walking the cold aisle
      const period = 22_000
      const t = (now % period) / period
      const tri = t < 0.5 ? t * 2 : 2 - t * 2
      const tx = Math.round(2 * TILE + tri * (HALL_COLS - 8) * TILE)
      drawCharacter(ctx, TECH, tx, 8 * TILE - 4, now, false, true)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [cards, load])

  return (
    <div className="campus-wrap">
      <canvas ref={ref} className="campus-canvas" width={W * SCALE} height={H * SCALE} onClick={onLeave} />
      <div className="campus-legend">
        <span className="campus-name">Datacenter floor</span>
        <span>
          {cards} card{cards === 1 ? '' : 's'} racked, {cardsTraining(state)} of them training
        </span>
        <span>{idle > 0 ? `${idle} more cards with nowhere to go` : 'Every card you own is powered'}</span>
        <span>
          {state.chipLevel > 0
            ? `Generation ${state.chipLevel} silicon, ×${chipPower(state).toFixed(2)} each`
            : 'Bought off the shelf'}
        </span>
        <span>
          {state.datacenters} hall{state.datacenters === 1 ? '' : 's'} built, {state.rentedDatacenters} rented
        </span>
      </div>
      <button className="campus-back" onClick={onLeave}>
        Back outside
      </button>
    </div>
  )
}

/** Not on the payroll: the person who walks the aisle. */
const TECH = {
  id: 'tech',
  name: 'Technician',
  nationality: 'usa' as const,
  role: 'engineer' as const,
  examScore: 120,
  level: 1,
  salary: 0,
  assignment: 'ops' as const,
  traits: [],
  morale: 70,
  unhappyWeeks: 0,
  noticeWeeks: null,
  lastAskWeek: 0,
  joinedWeek: 0,
  lastBreakWeek: 0,
}
