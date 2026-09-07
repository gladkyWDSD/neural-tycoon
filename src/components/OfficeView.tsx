import { useEffect, useMemo, useRef } from 'react'
import type { Staff } from '../game/types'

const TILE = 16
const COLS = 20
const ROWS = 12
const W = COLS * TILE
const H = ROWS * TILE

const FLOOR_A = '#232634'
const FLOOR_B = '#262a38'
const WALL = '#0b0c11'
const DESK = '#6b4a2f'
const DESK_TOP = '#8a6038'

const SKIN_TONES = ['#e8b98a', '#d69a6b', '#c98a5a', '#a96f4a', '#8d5a3a']
const HAIR_COLORS = ['#2a2019', '#4a3626', '#14100c', '#6b4a2f', '#8a6038']
const SHIRT_COLORS = ['#4aa3ff', '#3ddc84', '#ffd166', '#ff5c5c', '#c084fc', '#f28cb8']

const BAR_X = 40
const BAR_W = 240
const BAR_Y = 6
const BAR_H = 8

interface Desk {
  dx: number
  dy: number
}

function generateDesks(count: number): Desk[] {
  const desks: Desk[] = []
  for (let i = 0; i < count; i++) {
    const col = 3 + (i % 3) * 6
    const row = 2 + Math.floor(i / 3) * 2
    desks.push({ dx: col, dy: row })
  }
  return desks
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function colors(staff: Staff) {
  const h = hash(staff.id)
  return {
    skin: SKIN_TONES[h % SKIN_TONES.length],
    hair: HAIR_COLORS[(h >> 3) % HAIR_COLORS.length],
    shirt: SHIRT_COLORS[(h >> 6) % SHIRT_COLORS.length],
  }
}

function staffPosition(index: number, deskList: Desk[]): { x: number; y: number } {
  const d = index < deskList.length ? deskList[index] : null
  if (d) return { x: d.dx * TILE + 8, y: d.dy * TILE + TILE }
  const spots = [40, 80, 120, 160, 200, 240]
  const sx = spots[(index - deskList.length) % spots.length]
  return { x: sx, y: 150 }
}

function drawToilet(ctx: CanvasRenderingContext2D) {
  const x = 272
  const y = 24
  ctx.fillStyle = '#1a1c25'
  ctx.fillRect(x, y + 4, 8, 8)
  ctx.fillStyle = '#e0e4f0'
  ctx.fillRect(x + 1, y + 5, 6, 5)
  ctx.fillStyle = '#3a3f52'
  ctx.fillRect(x + 1, y + 4, 6, 2)
  ctx.fillStyle = '#e0e4f0'
  ctx.fillRect(x + 2, y, 4, 4)
  ctx.fillStyle = '#3a3f52'
  ctx.fillRect(x + 3, y + 1, 2, 2)
}

function drawDesk(ctx: CanvasRenderingContext2D, dx: number, dy: number) {
  const x = dx * TILE
  const y = dy * TILE
  ctx.fillStyle = '#3a3f52'
  ctx.fillRect(x + 2, y + TILE, 12, 2)
  ctx.fillStyle = '#4a5066'
  ctx.fillRect(x + 3, y + TILE + 2, 10, 3)
  ctx.fillStyle = DESK
  ctx.fillRect(x, y, TILE * 2, TILE)
  ctx.fillStyle = DESK_TOP
  ctx.fillRect(x + 1, y + 1, TILE * 2 - 2, TILE - 3)
}

function drawDeskProp(ctx: CanvasRenderingContext2D, dx: number, dy: number, role: Staff['role']) {
  const x = dx * TILE + 10
  const y = dy * TILE + 5
  if (role === 'researcher') {
    ctx.fillStyle = '#f4f6fb'
    ctx.fillRect(x, y, 4, 3)
    ctx.fillStyle = '#1a1c25'
    ctx.fillRect(x + 5, y, 1, 3)
  } else if (role === 'engineer') {
    ctx.fillStyle = '#3a3f52'
    ctx.fillRect(x, y + 3, 5, 2)
    ctx.fillStyle = '#4aa3ff'
    ctx.fillRect(x, y, 5, 4)
    ctx.fillStyle = '#0b0c11'
    ctx.fillRect(x + 1, y + 1, 3, 2)
  } else if (role === 'marketer') {
    ctx.fillStyle = '#3ddc84'
    ctx.fillRect(x + 2, y, 3, 5)
  } else if (role === 'lawyer') {
    ctx.fillStyle = '#f4f6fb'
    ctx.fillRect(x, y, 4, 4)
    ctx.fillStyle = '#1a1c25'
    ctx.fillRect(x, y + 1, 4, 1)
  }
}

function drawCharacter(ctx: CanvasRenderingContext2D, staff: Staff, x: number, y: number) {
  const c = colors(staff)

  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(x, y + 13, 8, 1)

  ctx.fillStyle = '#2a2d3a'
  ctx.fillRect(x + 1, y + 11, 2, 3)
  ctx.fillRect(x + 5, y + 11, 2, 3)

  ctx.fillStyle = c.shirt
  ctx.fillRect(x + 1, y + 5, 6, 6)

  ctx.fillStyle = c.skin
  ctx.fillRect(x, y + 5, 1, 4)
  ctx.fillRect(x + 7, y + 5, 1, 4)

  ctx.fillStyle = c.skin
  ctx.fillRect(x + 2, y, 4, 5)
  ctx.fillStyle = c.hair
  ctx.fillRect(x + 2, y, 4, 2)

  ctx.fillStyle = '#1a1c25'
  ctx.fillRect(x + 3, y + 2, 1, 1)
  ctx.fillRect(x + 5, y + 2, 1, 1)
}

interface Ball {
  x: number
  y: number
  t: number
  color: string
}

interface Flash {
  x: number
  y: number
  t: number
  color: string
}

interface Props {
  staff: Staff[]
  desks: number
  researchProgress: number | null
  trainingProgress: number | null
  researchTotalWeeks: number | null
  trainingTotalWeeks: number | null
}

export function OfficeView({
  staff,
  desks,
  researchProgress,
  trainingProgress,
  researchTotalWeeks,
  trainingTotalWeeks,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const deskList = useMemo(() => generateDesks(desks), [desks])
  const balls = useRef<Ball[]>([])
  const flashes = useRef<Flash[]>([])
  const vis = useRef({ research: 0, training: 0 })
  const startTime = useRef({ research: 0, training: 0 })

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

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

    const drawScene = () => {
      // floor
      for (let row = 1; row < ROWS - 1; row++) {
        for (let col = 1; col < COLS - 1; col++) {
          ctx.fillStyle = (row + col) % 2 === 0 ? FLOOR_A : FLOOR_B
          ctx.fillRect(col * TILE, row * TILE, TILE, TILE)
        }
      }

      // walls
      ctx.fillStyle = WALL
      ctx.fillRect(0, 0, W, TILE)
      ctx.fillRect(0, H - TILE, W, TILE)
      ctx.fillRect(0, 0, TILE, H)
      ctx.fillRect(W - TILE, 0, TILE, H)

      drawToilet(ctx)
      for (const d of deskList) drawDesk(ctx, d.dx, d.dy)

      // progress bar(s) — filled by the flying balls
      if (researchProgress !== null) drawBar(BAR_X, BAR_Y, BAR_W, BAR_H, vis.current.research, '#3ddc84')
      if (trainingProgress !== null) drawBar(BAR_X, BAR_Y + BAR_H + 2, BAR_W, BAR_H, vis.current.training, '#4aa3ff')

      // characters
      staff.forEach((s, i) => {
        const p = staffPosition(i, deskList)
        drawCharacter(ctx, s, p.x, p.y)
      })

      // desk props
      for (let i = 0; i < deskList.length; i++) {
        const s = staff[i]
        if (s) drawDeskProp(ctx, deskList[i].dx, deskList[i].dy, s.role)
      }

      // landing flashes
      for (const f of flashes.current) {
        const a = 1 - f.t / 0.4
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 1, 3, 3)
        void a
      }

      // flying progress balls
      for (const b of balls.current) {
        const prog = b.color === '#3ddc84' ? vis.current.research : vis.current.training
        const tx = BAR_X + prog
        const ty = BAR_Y + BAR_H / 2
        const tt = Math.min(1, b.t)
        const x = b.x + (tx - b.x) * tt
        const y = b.y + (ty - b.y) * tt - Math.sin(tt * Math.PI) * 18
        ctx.fillStyle = b.color
        ctx.fillRect(Math.round(x), Math.round(y), 2, 2)
      }
    }

    // draw the base scene synchronously so it's never blank
    drawScene()

    let raf = 0
    let last = performance.now()
    let spawnAcc = 0

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      spawnAcc += dt

      // continuous time-based fill: full bar over totalWeeks * 30s
      if (researchProgress === null) {
        vis.current.research = 0
        startTime.current.research = 0
      } else if (researchTotalWeeks != null) {
        if (startTime.current.research === 0) startTime.current.research = now
        const elapsed = (now - startTime.current.research) / 1000
        const frac = Math.min(1, elapsed / (researchTotalWeeks * 30))
        vis.current.research = frac * BAR_W
      }
      if (trainingProgress === null) {
        vis.current.training = 0
        startTime.current.training = 0
      } else if (trainingTotalWeeks != null) {
        if (startTime.current.training === 0) startTime.current.training = now
        const elapsed = (now - startTime.current.training) / 1000
        const frac = Math.min(1, elapsed / (trainingTotalWeeks * 30))
        vis.current.training = frac * BAR_W
      }

      // spawn balls from working staff
      if (spawnAcc > 0.2) {
        spawnAcc = 0
        staff.forEach((s, i) => {
          const busy =
            (s.role === 'researcher' && researchProgress !== null) ||
            (s.role === 'engineer' && trainingProgress !== null)
          if (!busy) return
          const p = staffPosition(i, deskList)
          balls.current.push({
            x: p.x + 4,
            y: p.y,
            t: 0,
            color: s.role === 'researcher' ? '#3ddc84' : '#4aa3ff',
          })
        })
      }

      // advance balls & handle landings
      const landed: Ball[] = []
      for (const b of balls.current) {
        b.t += dt * 1.4
        if (b.t >= 1) landed.push(b)
      }
      balls.current = balls.current.filter((b) => b.t < 1)
      for (const b of landed) {
        const prog = b.color === '#3ddc84' ? vis.current.research : vis.current.training
        flashes.current.push({
          x: BAR_X + prog,
          y: BAR_Y + BAR_H / 2,
          t: 0,
          color: b.color,
        })
      }

      // fade flashes
      for (const f of flashes.current) f.t += dt
      flashes.current = flashes.current.filter((f) => f.t < 0.4)

      drawScene()
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [staff, deskList, researchProgress, trainingProgress, researchTotalWeeks, trainingTotalWeeks])

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
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
