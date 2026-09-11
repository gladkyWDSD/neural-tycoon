import { useEffect, useRef } from 'react'
import type { GameState, Staff } from '../game/types'
import { SCALE, TILE, drawWorkIcon } from './officeArt'
import { drawCharacter } from './sprites'
import {
  LAB_COLS,
  LAB_ROWS,
  drawLabBench,
  drawLabFridge,
  drawLabRoom,
  drawScreenWall,
  drawTestRig,
  drawWhiteboardWall,
} from './labArt'
import { RESEARCH_MAP } from '../game/research'

interface Props {
  state: GameState
  onLeave: () => void
}

const BENCHES = [
  { x: 3, y: 5 },
  { x: 3, y: 9 },
  { x: 7, y: 5 },
  { x: 7, y: 9 },
  { x: 20, y: 5 },
  { x: 20, y: 9 },
  { x: 24, y: 5 },
  { x: 24, y: 9 },
  { x: 11, y: 10 },
  { x: 16, y: 10 },
]

/** The research lab. Only researchers work in here. */
export function LabView({ state, onLeave }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const W = LAB_COLS * TILE
  const H = LAB_ROWS * TILE
  const researchers = state.staff.filter((s) => s.role === 'researcher')
  const running = state.researching.length > 0

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
      drawLabFridge(ctx, LAB_COLS - 3, 3, now)
      drawTestRig(ctx, 13, 4, now)

      BENCHES.forEach((b, i) => {
        drawLabBench(ctx, b.x, b.y, now, i * 5)
      })

      // the people, at the benches they belong to
      researchers.slice(0, BENCHES.length).forEach((person: Staff, i) => {
        const b = BENCHES[i]
        drawCharacter(ctx, person, b.x * TILE + 10, b.y * TILE + 18, now, running, false)
      })

      // what they are working on, floating over the rig
      if (running) {
        const soonest = [...state.researching].sort((a, b) => a.weeksRemaining - b.weeksRemaining)[0]
        drawWorkIcon(ctx, 15 * TILE * SCALE, 3 * TILE * SCALE, 'research')
        ctx.font = '8px "Press Start 2P", monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const label = `${RESEARCH_MAP[soonest.id]?.name ?? 'Research'} · ${Math.ceil(soonest.weeksRemaining)}wk`
        ctx.fillStyle = 'rgba(0,0,0,0.7)'
        ctx.fillText(label, 15 * TILE * SCALE + 1, 2 * TILE * SCALE + 1)
        ctx.fillStyle = '#bfe6ff'
        ctx.fillText(label, 15 * TILE * SCALE, 2 * TILE * SCALE)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [researchers, running, state.researching])

  return (
    <div className="campus-wrap">
      <canvas ref={ref} className="campus-canvas" width={W * SCALE} height={H * SCALE} onClick={onLeave} />
      <div className="campus-legend">
        <span className="campus-name">Research lab</span>
        <span>
          {researchers.length} researcher{researchers.length === 1 ? '' : 's'} on the payroll
        </span>
        <span>{state.researched.length} techniques unlocked</span>
        <span>
          {running
            ? `${state.researching.length} project${state.researching.length === 1 ? '' : 's'} running`
            : 'Nothing in progress'}
        </span>
      </div>
      <button className="campus-back" onClick={onLeave}>
        Back outside
      </button>
    </div>
  )
}
