import { useEffect, useMemo, useRef } from 'react'
import type { GameState } from '../game/types'
import { SCALE, TILE } from './officeArt'
import { DATA_SOURCE_MAP } from '../game/data'
import {
  CAMPUS_COLS,
  CAMPUS_ROWS,
  MAX_HALLS_SHOWN,
  ROAD_ROW,
  buildingAt,
  campusLayout,
  officeLevelShown,
  type Footprint,
} from './campusLayout'
import {
  drawBackSign,
  drawCar,
  drawDatacenter,
  drawDish,
  drawFab,
  drawGround,
  drawLab,
  drawOffice,
  drawPath,
  drawRoad,
  drawTree,
} from './campusArt'

interface Props {
  state: GameState
  onEnter: () => void
  onEnterLab: () => void
  onEnterHall: () => void
}

const CAR_COLOURS = ['#b5544a', '#3d6fa5', '#c9a43a', '#4a8a5c', '#8a5fa8']

/**
 * Outside the office: everything the company owns, standing in a field.
 *
 * The office, the lab and every datacenter open — click one and you walk in.
 * Everything else is the balance sheet, as a place.
 */
export function CampusView({ state, onEnter, onEnterLab, onEnterHall }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const hover = useRef<Footprint | null>(null)
  const W = CAMPUS_COLS * TILE
  const H = CAMPUS_ROWS * TILE

  const layout = useMemo(
    () =>
      campusLayout({
        officeLevel: state.officeLevel,
        datacenters: state.datacenters,
        rentedDatacenters: state.rentedDatacenters,
        fabs: state.fabs,
        dataSources: state.dataSources.length,
      }),
    [state.officeLevel, state.datacenters, state.rentedDatacenters, state.fabs, state.dataSources],
  )

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    const season = Math.floor((((state.date.week % 52) + 52) % 52) / 13)
    const office = layout.find((f) => f.kind === 'office')!
    const lab = layout.find((f) => f.kind === 'lab')!
    const sign = layout.find((f) => f.kind === 'sign')!

    let raf = 0
    const draw = (now: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      drawGround(ctx, season)
      drawRoad(ctx)
      // a path from the road to each door
      drawPath(ctx, office.x + Math.floor(office.cols / 2) - 1, ROAD_ROW, office.y + office.rows)
      drawPath(ctx, lab.x + 2, ROAD_ROW, lab.y + lab.rows)

      for (const f of layout) {
        switch (f.kind) {
          case 'hall':
            drawDatacenter(ctx, f.x, f.y, now, f.leased, f.index)
            break
          case 'fab':
            drawFab(ctx, f.x, f.y, now)
            break
          case 'dish':
            drawDish(ctx, f.x, f.y, now, f.index * 3)
            break
          case 'tree':
            drawTree(ctx, f.x * TILE * SCALE, f.y * TILE * SCALE, f.x + f.y)
            break
          case 'office':
            drawOffice(ctx, f.x, f.y, officeLevelShown(state.officeLevel), now)
            break
          case 'lab':
            drawLab(ctx, f.x, f.y, now)
            break
          case 'sign':
            drawBackSign(ctx, f.x, f.y)
            break
        }
      }

      // the name over the door, which is what makes it your building
      ctx.font = '10px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const signX = (office.x + office.cols / 2) * TILE * SCALE
      const signY = office.y * TILE * SCALE - 30
      const label = state.companyName.toUpperCase().slice(0, 18)
      const width = label.length * 11 + 16
      ctx.fillStyle = '#20242f'
      ctx.fillRect(signX - width / 2, signY - 12, width, 24)
      ctx.fillStyle = '#3a4257'
      ctx.fillRect(signX - width / 2 + 2, signY - 10, width - 4, 20)
      ctx.fillStyle = '#ffd166'
      ctx.fillText(label, signX, signY)

      // traffic
      const roadY = ROAD_ROW * TILE * SCALE + 26
      for (let lane = 0; lane < 2; lane++) {
        const speed = lane === 0 ? 0.055 : -0.042
        for (let i = 0; i < 2; i++) {
          const span = W * SCALE + 120
          const t = (((now * speed + i * 900 + lane * 400) % span) + span) % span
          const x = lane === 0 ? t - 60 : span - t - 60
          drawCar(ctx, x, roadY + lane * 34, CAR_COLOURS[(lane * 2 + i) % CAR_COLOURS.length], lane === 1)
        }
      }

      // a label under the sign, so nobody has to guess what it is
      ctx.font = '8px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = 'rgba(0,0,0,0.75)'
      ctx.fillText('GO INSIDE', sign.x * TILE * SCALE + 29, sign.y * TILE * SCALE + 49)
      ctx.fillStyle = '#f0f3fa'
      ctx.fillText('GO INSIDE', sign.x * TILE * SCALE + 28, sign.y * TILE * SCALE + 48)

      // whatever the pointer is over gets a frame and a name
      const h = hover.current
      if (h && h.kind !== 'sign') {
        const x = h.x * TILE * SCALE
        const y = h.y * TILE * SCALE
        const w = h.cols * TILE * SCALE
        const ht = h.rows * TILE * SCALE
        ctx.strokeStyle = '#ffd166'
        ctx.lineWidth = 3
        ctx.setLineDash([10, 6])
        ctx.lineDashOffset = -(now / 40) % 16
        ctx.strokeRect(x + 1.5, y + 1.5, w - 3, ht - 3)
        ctx.setLineDash([])
        const text = h.kind === 'office' ? 'GO INSIDE' : `ENTER ${h.label.toUpperCase()}`
        ctx.font = '8px "Press Start 2P", monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        const tw = text.length * 9 + 14
        ctx.fillStyle = 'rgba(12,14,20,0.88)'
        ctx.fillRect(x + w / 2 - tw / 2, y - 24, tw, 20)
        ctx.fillStyle = '#ffd166'
        ctx.fillText(text, x + w / 2, y - 8)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [layout, state.officeLevel, state.date.week, state.companyName, W])

  /** Canvas pixels back to tiles, undoing the letterboxing. */
  const tileAt = (clientX: number, clientY: number): { tx: number; ty: number } | null => {
    const canvas = ref.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const zoom = Math.min(rect.width / canvas.width, rect.height / canvas.height)
    if (zoom <= 0) return null
    return {
      tx: (clientX - rect.left - (rect.width - canvas.width * zoom) / 2) / zoom / (TILE * SCALE),
      ty: (clientY - rect.top - (rect.height - canvas.height * zoom) / 2) / zoom / (TILE * SCALE),
    }
  }

  const sources = state.dataSources.map((id) => DATA_SOURCE_MAP[id]?.name).filter(Boolean)
  const halls = state.datacenters + state.rentedDatacenters
  const hidden = Math.max(0, halls - MAX_HALLS_SHOWN)

  return (
    <div className="campus-wrap">
      <canvas
        ref={ref}
        className="campus-canvas"
        width={W * SCALE}
        height={H * SCALE}
        onPointerMove={(e) => {
          const t = tileAt(e.clientX, e.clientY)
          const found = t ? buildingAt(layout, t.tx, t.ty) : null
          hover.current = found
          if (ref.current) ref.current.style.cursor = found ? 'pointer' : 'default'
        }}
        onPointerLeave={() => {
          hover.current = null
        }}
        onClick={(e) => {
          const t = tileAt(e.clientX, e.clientY)
          const found = t ? buildingAt(layout, t.tx, t.ty) : null
          if (found?.kind === 'lab') onEnterLab()
          else if (found?.kind === 'hall') onEnterHall()
          else onEnter()
        }}
        title="Click a building to go in"
      />
      <div className="campus-legend">
        <span className="campus-name">{state.companyName}</span>
        <span>
          Office level {state.officeLevel} · {state.staff.length} people
        </span>
        <span>
          {state.datacenters} datacenter{state.datacenters === 1 ? '' : 's'} built,{' '}
          {state.rentedDatacenters} rented{hidden > 0 ? ` (${hidden} off the map)` : ''}
        </span>
        <span>
          {state.fabs} fab line{state.fabs === 1 ? '' : 's'}
          {state.chipLevel > 0 ? ` · generation ${state.chipLevel} silicon` : ' · no silicon of your own'}
        </span>
        <span title={sources.join(', ')}>
          {sources.length > 0
            ? `${sources.length} data feed${sources.length === 1 ? '' : 's'} running`
            : 'No data sources'}
        </span>
        <span className="campus-hint">Click the lab or any datacenter to go in</span>
      </div>
      <button className="campus-back" onClick={onEnter}>
        Go inside
      </button>
    </div>
  )
}
