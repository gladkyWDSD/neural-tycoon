import { useEffect, useRef } from 'react'
import type { GameState } from '../game/types'
import { SCALE, TILE } from './officeArt'
import { DATA_SOURCE_MAP } from '../game/data'
import {
  CAMPUS_COLS,
  CAMPUS_ROWS,
  drawBackSign,
  drawCar,
  drawDatacenter,
  drawDish,
  drawFab,
  drawGround,
  drawOffice,
  drawPath,
  drawRoad,
  drawTree,
} from './campusArt'

interface Props {
  state: GameState
  onEnter: () => void
}

const OFFICE_TILE = { x: 4, y: 9 }
const CAR_COLOURS = ['#b5544a', '#3d6fa5', '#c9a43a', '#4a8a5c', '#8a5fa8']

/**
 * Outside the office: everything the company owns, standing in a field.
 *
 * Nothing here is a control except the sign by the door, which takes you back
 * in. It is a view of the balance sheet you can look at.
 */
export function CampusView({ state, onEnter }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const W = CAMPUS_COLS * TILE
  const H = CAMPUS_ROWS * TILE

  // where the sign stands, in art pixels, so a click can find it
  const signTile = { x: OFFICE_TILE.x - 2, y: OFFICE_TILE.y + 5 + state.officeLevel }

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    const season = Math.floor((((state.date.week % 52) + 52) % 52) / 13)
    const built = Math.min(8, state.datacenters)
    const leased = Math.min(4, state.rentedDatacenters)
    const fabs = Math.min(3, state.fabs)
    const dishes = state.dataSources.length

    let raf = 0
    const draw = (now: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      drawGround(ctx, season)
      drawRoad(ctx)
      drawPath(ctx, OFFICE_TILE.x + 3, CAMPUS_ROWS - 3, OFFICE_TILE.y + 4 + state.officeLevel)

      // the dishes stand in a line down the left edge, clear of the buildings
      for (let i = 0; i < dishes; i++) {
        drawDish(ctx, 1, 4 + i * 3, now, i * 3)
      }

      // datacenters in rows on the right, leased ones at the end
      const halls = [
        ...Array.from({ length: built }, () => false),
        ...Array.from({ length: leased }, () => true),
      ]
      halls.forEach((isLeased, i) => {
        const col = 30 + (i % 2) * 7
        const row = 1 + Math.floor(i / 2) * 4
        drawDatacenter(ctx, col, row, now, isLeased, i)
      })

      // fabs along the top, clear of the readout in the corner
      for (let i = 0; i < fabs; i++) drawFab(ctx, 14 + i * 6, 2, now)

      for (const [tx, ty, seed] of [
        [17, 13, 1],
        [16, 17, 2],
        [26, 15, 3],
        [40, 17, 4],
        [1, 17, 5],
        [22, 18, 6],
        [35, 13, 7],
      ] as const) {
        drawTree(ctx, tx * TILE * SCALE, ty * TILE * SCALE, seed)
      }

      const office = drawOffice(ctx, OFFICE_TILE.x, OFFICE_TILE.y, state.officeLevel, now)
      // the name over the door, which is what makes it your building
      ctx.font = '10px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const signX = (OFFICE_TILE.x + office.cols / 2) * TILE * SCALE
      const signY = OFFICE_TILE.y * TILE * SCALE - 26
      const label = state.companyName.toUpperCase().slice(0, 18)
      const width = label.length * 11 + 16
      ctx.fillStyle = '#20242f'
      ctx.fillRect(signX - width / 2, signY - 12, width, 24)
      ctx.fillStyle = '#3a4257'
      ctx.fillRect(signX - width / 2 + 2, signY - 10, width - 4, 20)
      ctx.fillStyle = '#ffd166'
      ctx.fillText(label, signX, signY)
      drawBackSign(ctx, signTile.x, signTile.y)

      // traffic
      const roadY = (CAMPUS_ROWS - 3) * TILE * SCALE + 26
      for (let lane = 0; lane < 2; lane++) {
        const speed = lane === 0 ? 0.055 : -0.042
        for (let i = 0; i < 2; i++) {
          const span = W * SCALE + 120
          const t = ((now * speed + i * 900 + lane * 400) % span + span) % span
          const x = lane === 0 ? t - 60 : span - t - 60
          drawCar(ctx, x, roadY + lane * 34, CAR_COLOURS[(lane * 2 + i) % CAR_COLOURS.length], lane === 1)
        }
      }

      // a label under the sign, so nobody has to guess what it is
      ctx.font = '8px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = 'rgba(0,0,0,0.75)'
      ctx.fillText('GO INSIDE', signTile.x * TILE * SCALE + 29, signTile.y * TILE * SCALE + 49)
      ctx.fillStyle = '#f0f3fa'
      ctx.fillText('GO INSIDE', signTile.x * TILE * SCALE + 28, signTile.y * TILE * SCALE + 48)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [state.officeLevel, state.datacenters, state.rentedDatacenters, state.fabs, state.dataSources, state.date.week, state.companyName, signTile.x, signTile.y, W])

  const sources = state.dataSources.map((id) => DATA_SOURCE_MAP[id]?.name).filter(Boolean)

  return (
    <div className="campus-wrap">
      <canvas
        ref={ref}
        className="campus-canvas"
        width={W * SCALE}
        height={H * SCALE}
        onClick={onEnter}
        title="Back inside"
      />
      <div className="campus-legend">
        <span className="campus-name">{state.companyName}</span>
        <span>
          Office level {state.officeLevel} · {state.staff.length} people
        </span>
        <span>
          {state.datacenters} datacenter{state.datacenters === 1 ? '' : 's'} built,{' '}
          {state.rentedDatacenters} rented
        </span>
        <span>
          {state.fabs} fab line{state.fabs === 1 ? '' : 's'}
          {state.chipLevel > 0 ? ` · generation ${state.chipLevel} silicon` : ' · no silicon of your own'}
        </span>
        <span>{sources.length > 0 ? `Feeds: ${sources.join(', ')}` : 'No data sources'}</span>
      </div>
      <button className="campus-back" onClick={onEnter}>
        Go inside
      </button>
    </div>
  )
}
