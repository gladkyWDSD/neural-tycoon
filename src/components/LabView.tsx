import { useEffect, useRef } from 'react'
import type { GameState, Staff } from '../game/types'
import { SCALE, TILE, drawWorkIcon } from './officeArt'
import { SPRITE_H, SPRITE_W, drawCharacter } from './sprites'
import { Chatter, drawBubble } from './bubbles'
import {
  LAB_COLS,
  LAB_ROWS,
  drawHardwareBench,
  drawLabFridge,
  drawLabRoom,
  drawScreenWall,
  drawTestRig,
  drawWhiteboardWall,
} from './labArt'
import { chipDesignWeeks, globalWeek } from '../game/state'

interface Props {
  state: GameState
  onLeave: () => void
  onStaffMenu?: (id: string, x: number, y: number) => void
}

// The whole floor is hardware: benches down both sides of the test rig, which
// stands in the middle behind its hazard line.
const BENCHES = [
  { x: 2, y: 4 },
  { x: 6, y: 4 },
  { x: 18, y: 4 },
  { x: 22, y: 4 },
  { x: 26, y: 4 },
  { x: 2, y: 8 },
  { x: 6, y: 8 },
  { x: 18, y: 8 },
  { x: 22, y: 8 },
  { x: 26, y: 8 },
  { x: 2, y: 11 },
  { x: 6, y: 11 },
  { x: 10, y: 11 },
  { x: 18, y: 11 },
  { x: 22, y: 11 },
  { x: 26, y: 11 },
]

/** The white building on the field: the hardware lab, and nobody else works in it. */
export function LabView({ state, onLeave, onStaffMenu }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  // where each person ended up this frame, so they can still be right-clicked
  const hits = useRef<{ id: string; x: number; y: number }[]>([])
  const chatter = useRef(new Chatter(2))
  const said = useRef<{ id: string; text: string; from: number }[]>([])
  const W = LAB_COLS * TILE
  const H = LAB_ROWS * TILE
  const hardware = state.staff.filter((s) => s.role === 'hardware')
  const week = globalWeek(state)
  const designing = Boolean(state.chipDesign)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    let raf = 0
    const draw = (now: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      drawLabRoom(ctx, now)
      drawWhiteboardWall(ctx, 2, 1, now)
      drawScreenWall(ctx, 20, 1, now)
      drawLabFridge(ctx, 28, 2, now)
      drawTestRig(ctx, 13, 4, now)

      BENCHES.forEach((b, i) => drawHardwareBench(ctx, b.x, b.y, now, i * 3))

      // the people, at the benches their job belongs to
      hits.current = []
      const seat = (person: Staff, b: { x: number; y: number }, busy: boolean) => {
        const x = b.x * TILE + 10
        const y = b.y * TILE + 18
        hits.current.push({ id: person.id, x, y })
        drawCharacter(ctx, person, x, y, now, busy, false)
      }
      hardware.slice(0, BENCHES.length).forEach((p, i) => seat(p, BENCHES[i], designing))

      // what the two halves are working on, over their own bay
      ctx.font = '8px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const caption = (text: string, tx: number, ty: number, colour: string) => {
        ctx.fillStyle = 'rgba(0,0,0,0.7)'
        ctx.fillText(text, tx * TILE * SCALE + 1, ty * TILE * SCALE + 1)
        ctx.fillStyle = colour
        ctx.fillText(text, tx * TILE * SCALE, ty * TILE * SCALE)
      }
      // the two bays are named on the wall over them
      caption('HARDWARE LAB', 8, 0.55, '#7f889c')
      caption('TEST FLOOR', 23, 0.55, '#7f889c')

      if (state.chipDesign) {
        drawWorkIcon(ctx, 15 * TILE * SCALE, 3 * TILE * SCALE, 'training')
        caption(
          `Gen ${state.chipDesign.toLevel} tape-out · ${Math.ceil(state.chipDesign.weeksRemaining)}wk`,
          15,
          2,
          '#ffd166',
        )
      }

      // the lab talks too
      said.current = chatter.current.step(now, hardware, state, week)
      for (const b of said.current) {
        const at = hits.current.find((h) => h.id === b.id)
        if (at) drawBubble(ctx, at.x * SCALE, at.y * SCALE, b.text, now - b.from, W * SCALE)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [hardware, designing, state, week, W])

  /** Whoever is under a client-space point, the same way the office does it. */
  function personAt(clientX: number, clientY: number): string | null {
    const canvas = ref.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const zoom = Math.min(rect.width / canvas.width, rect.height / canvas.height)
    if (zoom <= 0) return null
    const x = (clientX - rect.left - (rect.width - canvas.width * zoom) / 2) / zoom / SCALE
    const y = (clientY - rect.top - (rect.height - canvas.height * zoom) / 2) / zoom / SCALE
    for (let i = hits.current.length - 1; i >= 0; i--) {
      const h = hits.current[i]
      if (x >= h.x - 2 && x <= h.x + SPRITE_W + 2 && y >= h.y - 2 && y <= h.y + SPRITE_H + 2) return h.id
    }
    return null
  }

  const over = Math.max(0, hardware.length - BENCHES.length)

  return (
    <div className="campus-wrap">
      <canvas
        ref={ref}
        className="campus-canvas"
        width={W * SCALE}
        height={H * SCALE}
        onClick={(e) => {
          // clicking a person does nothing; clicking the room takes you out
          if (!personAt(e.clientX, e.clientY)) onLeave()
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          const id = personAt(e.clientX, e.clientY)
          if (id && onStaffMenu) onStaffMenu(id, e.clientX, e.clientY)
        }}
        title="Right-click somebody to manage them"
      />
      <div className="campus-legend">
        <span className="campus-name">Hardware lab</span>
        <span>
          {hardware.length} hardware engineer{hardware.length === 1 ? '' : 's'}
          {over > 0 ? ` (${over} without a bench)` : ''}
        </span>
        <span>
          {hardware.length === 0 ? 'Nobody works in here yet' : 'Nobody else works in here'}
        </span>
        <span>
          {state.chipLevel > 0 ? `Generation ${state.chipLevel} silicon in the field` : 'Bought off the shelf'}
        </span>
        <span>
          {state.chipDesign
            ? `Taping out generation ${state.chipDesign.toLevel} silicon`
            : hardware.length > 0
              ? `A design would take ${chipDesignWeeks(state)} weeks`
              : 'No silicon of your own'}
        </span>
      </div>
      <button className="campus-back" onClick={onLeave}>
        Back outside
      </button>
    </div>
  )
}
