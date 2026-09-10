import { useEffect, useMemo, useRef } from 'react'
import type { Staff } from '../game/types'
import { playWorkSfx } from '../game/audio'
import { SPRITE_H, SPRITE_W, drawCharacter, hash } from './sprites'
import { SCALE, TILE, drawDesk, drawDeskProp, drawToilet } from './officeArt'

const FLOOR_A = '#232634'
const FLOOR_B = '#262a38'
const WALL = '#0b0c11'

const BAR_H = 6
const BAR_MAX_W = 240
const BAR_MARGIN = 40

// A desk is 2 tiles wide and its occupant sits on the tile below it, so a desk
// slot needs this much room including the walkway around it.
// One worker's output flies to the bar every couple of seconds, and each one
// lands with a visible shove rather than trickling in dozens a second.
const SPAWN_MIN_MS = 2000
const SPAWN_JITTER_MS = 1000
// a landing closes this much of the gap between the drawn bar and the real progress
const LAND_CATCHUP = 0.8
// ...and always moves the bar at least this share of its width, so every hit counts
const LAND_MIN_STEP = 0.006
const FLASH_LIFE = 0.4

const DESK_W = 2
const PITCH_X = 4
const PITCH_Y = 3
const MAX_DESK_COLS = 6
// The room is padded out to roughly this shape. The office panel is a wide,
// short box, so a squarer room would leave black bars down both sides.
const TARGET_ASPECT = 2

type WorkKind = 'research' | 'training' | 'marketing'

const KIND_CONFIG: Record<WorkKind, { y: number; color: string }> = {
  research: { y: 5, color: '#3ddc84' },
  training: { y: 14, color: '#4aa3ff' },
  marketing: { y: 23, color: '#ffd166' },
}

function roleKind(role: Staff['role']): WorkKind | null {
  if (role === 'researcher') return 'research'
  if (role === 'engineer') return 'training'
  if (role === 'marketer') return 'marketing'
  return null
}

interface Desk {
  dx: number
  dy: number
}

/**
 * The office grows with the company. The desks are laid out on a grid that gets
 * wider and then taller as you upgrade, and the room is sized around that grid
 * rather than being a fixed box that runs out of space at twelve people.
 */
interface Layout {
  cols: number
  rows: number
  roomCols: number
  roomRows: number
  startCol: number
  startRow: number
}

function layoutFor(deskCount: number): Layout {
  const cols = Math.min(MAX_DESK_COLS, Math.max(3, Math.ceil(deskCount / 3)))
  const rows = Math.max(1, Math.ceil(Math.max(1, deskCount) / cols))
  const gridW = (cols - 1) * PITCH_X + DESK_W
  const gridH = (rows - 1) * PITCH_Y + 2
  // walls plus a tile of margin all round, then padded to a widescreen shape so
  // the canvas does not letterbox away half the panel
  let roomCols = gridW + 4
  let roomRows = gridH + 4
  roomCols = Math.max(roomCols, Math.round(roomRows * TARGET_ASPECT))
  roomRows = Math.max(roomRows, Math.round(roomCols / TARGET_ASPECT))
  return {
    cols,
    rows,
    roomCols,
    roomRows,
    startCol: Math.floor((roomCols - gridW) / 2),
    startRow: 2, // leave the top strip clear for the progress bars
  }
}

function generateDesks(count: number, layout: Layout): Desk[] {
  const desks: Desk[] = []
  for (let i = 0; i < count; i++) {
    desks.push({
      dx: layout.startCol + (i % layout.cols) * PITCH_X,
      dy: layout.startRow + Math.floor(i / layout.cols) * PITCH_Y,
    })
  }
  return desks
}

function staffPosition(index: number, deskList: Desk[], layout: Layout): { x: number; y: number } {
  const d = index < deskList.length ? deskList[index] : null
  if (d) return { x: d.dx * TILE + 10, y: d.dy * TILE + TILE }
  // no desk of their own: they pace the open floor along the bottom of the room
  const spare = index - deskList.length
  const width = layout.roomCols * TILE
  const x = Math.round(((spare % 6) + 1) * (width / 7))
  return { x, y: (layout.roomRows - 2) * TILE }
}

function drawParticle(ctx: CanvasRenderingContext2D, x: number, y: number, kind: WorkKind) {
  const px = Math.round(x)
  const py = Math.round(y)
  if (kind === 'research') {
    // brain
    ctx.fillStyle = '#f28cb8'
    ctx.fillRect(px - 3, py - 2, 2, 5)
    ctx.fillRect(px + 1, py - 2, 2, 5)
    ctx.fillRect(px - 2, py - 3, 4, 1)
    ctx.fillRect(px - 2, py + 2, 4, 1)
    ctx.fillStyle = '#c74a7f'
    ctx.fillRect(px - 1, py, 1, 2)
    ctx.fillRect(px + 1, py, 1, 1)
  } else if (kind === 'training') {
    ctx.font = 'bold 8px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#4aa3ff'
    ctx.fillText('</>', px, py)
  } else {
    ctx.font = 'bold 9px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffd166'
    ctx.fillText('$', px, py)
  }
}

interface Particle {
  x: number
  y: number
  t: number
  kind: WorkKind
}

interface Flash {
  x: number
  y: number
  t: number
}

/** Where a person was last drawn, in world pixels, so right-clicks can find them. */
interface HitBox {
  id: string
  x: number
  y: number
}

const HIT_PAD = 2

interface Props {
  staff: Staff[]
  desks: number
  /** 0..1, or null when nothing of that kind is running. */
  researchProgress: number | null
  trainingProgress: number | null
  marketingProgress: number | null
  /** right-clicking a person opens their menu at the pointer */
  onStaffMenu?: (staffId: string, clientX: number, clientY: number) => void
}

export function OfficeView({
  staff,
  desks,
  researchProgress,
  trainingProgress,
  marketingProgress,
  onStaffMenu,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const layout = useMemo(() => layoutFor(desks), [desks])
  const deskList = useMemo(() => generateDesks(desks, layout), [desks, layout])
  const W = layout.roomCols * TILE
  const H = layout.roomRows * TILE
  const barW = Math.min(BAR_MAX_W, W - BAR_MARGIN * 2)
  const barX = Math.round((W - barW) / 2)
  const particles = useRef<Particle[]>([])
  const flashes = useRef<Flash[]>([])
  const hits = useRef<HitBox[]>([])
  const nextSpawn = useRef<Record<WorkKind, number>>({ research: 0, training: 0, marketing: 0 })
  // Floor, walls and empty desks never change between frames, so they are
  // rasterised once and blitted underneath the animated layers.
  const background = useMemo(() => {
    const bg = document.createElement('canvas')
    const w = layout.roomCols * TILE
    const h = layout.roomRows * TILE
    bg.width = w * SCALE
    bg.height = h * SCALE
    const bgx = bg.getContext('2d')
    if (!bgx) return bg
    bgx.imageSmoothingEnabled = false
    bgx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
    for (let row = 1; row < layout.roomRows - 1; row++) {
      for (let col = 1; col < layout.roomCols - 1; col++) {
        bgx.fillStyle = (row + col) % 2 === 0 ? FLOOR_A : FLOOR_B
        bgx.fillRect(col * TILE, row * TILE, TILE, TILE)
      }
    }
    bgx.fillStyle = WALL
    bgx.fillRect(0, 0, w, TILE)
    bgx.fillRect(0, h - TILE, w, TILE)
    bgx.fillRect(0, 0, TILE, h)
    bgx.fillRect(w - TILE, 0, TILE, h)
    bgx.setTransform(1, 0, 0, 1, 0, 0)
    drawToilet(bgx, layout.roomCols - 3, 1)
    for (const d of deskList) drawDesk(bgx, d.dx, d.dy)
    return bg
  }, [deskList, layout])
  const vis = useRef<Record<WorkKind, number>>({ research: 0, training: 0, marketing: 0 })

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    const bars: { kind: WorkKind; progress: number | null }[] = [
      { kind: 'research', progress: researchProgress },
      { kind: 'training', progress: trainingProgress },
      { kind: 'marketing', progress: marketingProgress },
    ]

    const drawBar = (x: number, y: number, w: number, h: number, fillPx: number, color: string) => {
      ctx.fillStyle = '#0b0c11'
      ctx.fillRect(x - 1, y - 1, w + 2, h + 2)
      ctx.fillStyle = '#2a2d3a'
      ctx.fillRect(x, y, w, h)
      ctx.fillStyle = color
      const f = Math.max(0, Math.min(w, Math.round(fillPx)))
      ctx.fillRect(x, y, f, h)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x + f - 1, y, 1, h)
    }

    // The room, the people and the progress bars are authored on the 16px world
    // grid; the desks and everything on them are drawn at SCALE times that, so
    // the hardware has enough pixels to read properly.
    const world = () => ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
    const art = () => ctx.setTransform(1, 0, 0, 1, 0, 0)

    const drawScene = (now: number) => {
      art()
      ctx.drawImage(background, 0, 0)

      world()
      for (const b of bars) {
        if (b.progress !== null) {
          const cfg = KIND_CONFIG[b.kind]
          drawBar(barX, cfg.y, barW, BAR_H, vis.current[b.kind], cfg.color)
        }
      }

      const activeKinds = new Set(bars.filter((b) => b.progress !== null).map((b) => b.kind))
      // rebuilt every frame so a right-click hits people where they actually are,
      // including the ones pacing the corridor
      hits.current.length = 0
      staff.forEach((s, i) => {
        const p = staffPosition(i, deskList, layout)
        const kind = roleKind(s.role)
        const working = kind !== null && activeKinds.has(kind)
        const hasDesk = i < deskList.length
        if (hasDesk) {
          drawCharacter(ctx, s, p.x, p.y, now, working, false)
          hits.current.push({ id: s.id, x: p.x, y: p.y })
        } else {
          // no desk: pace back and forth along the bottom corridor
          const phase = hash(s.id) % 1000
          const period = 4200 + (phase % 1500)
          const t = ((now + phase * 5) % period) / period
          const tri = t < 0.5 ? t * 2 : 2 - t * 2
          const wx = Math.round(p.x - 12 + tri * 24)
          drawCharacter(ctx, s, wx, p.y, now, false, true)
          hits.current.push({ id: s.id, x: wx, y: p.y })
        }
      })

      art()
      for (let i = 0; i < deskList.length; i++) {
        const s = staff[i]
        if (s) drawDeskProp(ctx, deskList[i].dx, deskList[i].dy, s.role, now)
      }

      world()
      // each landing pops and shrinks, so a single hit reads as an impact
      for (const f of flashes.current) {
        const size = 2 + Math.round((1 - f.t / FLASH_LIFE) * 4)
        const half = Math.floor(size / 2)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(Math.round(f.x) - half, Math.round(f.y) - half, size, size)
      }

      for (const p of particles.current) {
        const cfg = KIND_CONFIG[p.kind]
        const prog = vis.current[p.kind]
        const tx = barX + prog
        const ty = cfg.y + BAR_H / 2
        const tt = Math.min(1, p.t)
        const x = p.x + (tx - p.x) * tt
        const y = p.y + (ty - p.y) * tt - Math.sin(tt * Math.PI) * 18
        drawParticle(ctx, x, y, p.kind)
      }
      art()
    }

    drawScene(performance.now())

    let raf = 0
    let last = performance.now()

    /** How full the bar really is, in pixels. */
    const targetOf = (progress: number) => Math.max(0, Math.min(1, progress)) * barW

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now

      // The drawn bar deliberately lags the real job timer between hits. Each
      // piece of work that lands shoves it forward towards the truth, so the
      // bar visibly moves because someone did something, and it still lands on
      // the end exactly when the job finishes.
      for (const b of bars) {
        if (b.progress === null) {
          vis.current[b.kind] = 0
          nextSpawn.current[b.kind] = 0
          continue
        }
        const target = targetOf(b.progress)
        if (staff.some((s) => roleKind(s.role) === b.kind)) {
          // someone is on it, so only their work moves the bar; just never overshoot
          if (vis.current[b.kind] > target) vis.current[b.kind] = target
        } else {
          // nobody works this kind, so it fills on its own rather than freezing
          const v = vis.current[b.kind]
          vis.current[b.kind] = v + (target - v) * Math.min(1, dt * 3)
        }
      }

      // one worker sends their output up every two to three seconds
      for (const b of bars) {
        if (b.progress === null) continue
        if (nextSpawn.current[b.kind] === 0) {
          nextSpawn.current[b.kind] = now + Math.random() * SPAWN_JITTER_MS
          continue
        }
        if (now < nextSpawn.current[b.kind]) continue
        nextSpawn.current[b.kind] = now + SPAWN_MIN_MS + Math.random() * SPAWN_JITTER_MS
        const workers: number[] = []
        staff.forEach((s, i) => {
          if (roleKind(s.role) === b.kind) workers.push(i)
        })
        if (workers.length === 0) continue
        const p = staffPosition(workers[Math.floor(Math.random() * workers.length)], deskList, layout)
        particles.current.push({ x: p.x + 6, y: p.y, t: 0, kind: b.kind })
      }

      const landed: Particle[] = []
      for (const p of particles.current) {
        p.t += dt
        if (p.t >= 1) landed.push(p)
      }
      particles.current = particles.current.filter((p) => p.t < 1)
      for (const p of landed) {
        const cfg = KIND_CONFIG[p.kind]
        const bar = bars.find((b) => b.kind === p.kind)
        if (bar?.progress != null) {
          const target = targetOf(bar.progress)
          const v = vis.current[p.kind]
          const step = Math.max(barW * LAND_MIN_STEP, (target - v) * LAND_CATCHUP)
          vis.current[p.kind] = Math.min(target, v + step)
        }
        flashes.current.push({
          x: barX + vis.current[p.kind],
          y: cfg.y + BAR_H / 2,
          t: 0,
        })
        // the note rises with the bar and pans to wherever the hit landed
        const fill = vis.current[p.kind] / barW
        playWorkSfx(p.kind, fill, fill * 1.4 - 0.7)
      }

      for (const f of flashes.current) f.t += dt
      flashes.current = flashes.current.filter((f) => f.t < FLASH_LIFE)

      drawScene(now)
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [background, staff, deskList, layout, barX, barW, researchProgress, trainingProgress, marketingProgress])

  /** Which person, if any, is under a client-space point. */
  function staffAt(clientX: number, clientY: number): string | null {
    const canvas = ref.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    // object-fit: contain letterboxes the canvas inside its box, so undo that first
    const zoom = Math.min(rect.width / canvas.width, rect.height / canvas.height)
    if (zoom <= 0) return null
    const artX = (clientX - rect.left - (rect.width - canvas.width * zoom) / 2) / zoom
    const artY = (clientY - rect.top - (rect.height - canvas.height * zoom) / 2) / zoom
    const x = artX / SCALE
    const y = artY / SCALE
    // last drawn is nearest the front, so search back to front
    for (let i = hits.current.length - 1; i >= 0; i--) {
      const h = hits.current[i]
      if (
        x >= h.x - HIT_PAD &&
        x <= h.x + SPRITE_W + HIT_PAD &&
        y >= h.y - HIT_PAD &&
        y <= h.y + SPRITE_H + HIT_PAD
      ) {
        return h.id
      }
    }
    return null
  }

  return (
    <canvas
      ref={ref}
      width={W * SCALE}
      height={H * SCALE}
      onContextMenu={(e) => {
        // the browser menu is suppressed app-wide; this only decides whose menu opens
        e.preventDefault()
        const id = staffAt(e.clientX, e.clientY)
        if (id && onStaffMenu) onStaffMenu(id, e.clientX, e.clientY)
      }}
      style={{
        imageRendering: 'pixelated',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  )
}
