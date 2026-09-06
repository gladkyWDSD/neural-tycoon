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
  // chair (backrest + seat) below the desk
  ctx.fillStyle = '#3a3f52'
  ctx.fillRect(x + 2, y + TILE, 12, 2)
  ctx.fillStyle = '#4a5066'
  ctx.fillRect(x + 3, y + TILE + 2, 10, 3)
  // desk top
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

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(x, y + 13, 8, 1)

  // legs
  ctx.fillStyle = '#2a2d3a'
  ctx.fillRect(x + 1, y + 11, 2, 3)
  ctx.fillRect(x + 5, y + 11, 2, 3)

  // torso
  ctx.fillStyle = c.shirt
  ctx.fillRect(x + 1, y + 5, 6, 6)

  // arms
  ctx.fillStyle = c.skin
  ctx.fillRect(x, y + 5, 1, 4)
  ctx.fillRect(x + 7, y + 5, 1, 4)

  // head
  ctx.fillStyle = c.skin
  ctx.fillRect(x + 2, y, 4, 5)
  ctx.fillStyle = c.hair
  ctx.fillRect(x + 2, y, 4, 2)

  // eyes
  ctx.fillStyle = '#1a1c25'
  ctx.fillRect(x + 3, y + 2, 1, 1)
  ctx.fillRect(x + 5, y + 2, 1, 1)
}

export function OfficeView({ staff, desks }: { staff: Staff[]; desks: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const deskList = useMemo(() => generateDesks(desks), [desks])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

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
    ctx.fillStyle = '#15161f'
    ctx.fillRect(0, TILE, W, 2)
    ctx.fillRect(0, H - TILE - 2, W, 2)

    drawToilet(ctx)

    for (const d of deskList) drawDesk(ctx, d.dx, d.dy)

    // characters at their desks (extra staff stand)
    const standingSpots = [40, 80, 120, 160, 200, 240]
    staff.forEach((s, i) => {
      const d = i < deskList.length ? deskList[i] : null
      if (d) {
        drawCharacter(ctx, s, d.dx * TILE + 8, d.dy * TILE + TILE)
      } else {
        const sx = standingSpots[(i - deskList.length) % standingSpots.length]
        drawCharacter(ctx, s, sx, 150)
      }
    })

    // desk props for assigned staff
    for (let i = 0; i < deskList.length; i++) {
      const s = staff[i]
      if (s) drawDeskProp(ctx, deskList[i].dx, deskList[i].dy, s.role)
    }
  }, [staff, deskList])

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
