import { px } from './officeArt'

// The research lab. Nobody but researchers works in here, and it is meant to
// look like the expensive part of the building: a test rig down the middle,
// glass, whiteboards covered in working, and a wall of screens.

const FT = 32

export const LAB_COLS = 30
export const LAB_ROWS = 14

/** The room is split down the middle: research on the left, hardware on the right. */
export const HARDWARE_FROM = 18

export function drawLabRoom(ctx: CanvasRenderingContext2D, now: number): void {
  // a pale floor, because a lab is not an office. The hardware bay is warmer,
  // so you can see at a glance which half of the building you are looking at.
  for (let row = 1; row < LAB_ROWS - 1; row++) {
    for (let col = 1; col < LAB_COLS - 1; col++) {
      const bay = col >= HARDWARE_FROM
      const even = (row + col) % 2 === 0
      px(ctx, col * FT, row * FT, FT, FT, bay ? (even ? '#33313f' : '#383544') : even ? '#2b3140' : '#2f3646')
      px(ctx, col * FT, row * FT, FT, 1, bay ? '#413d4e' : '#353d4f')
    }
  }
  // the hazard line painted on the floor between the two bays
  for (let row = 1; row < LAB_ROWS - 1; row++) {
    px(ctx, HARDWARE_FROM * FT - 6, row * FT, 5, FT, '#3a3524')
    for (let i = 0; i < 4; i++) px(ctx, HARDWARE_FROM * FT - 6, row * FT + i * 8, 5, 4, '#c9a43a')
  }
  // walls, lit along the top
  px(ctx, 0, 0, LAB_COLS * FT, FT, '#1b2029')
  px(ctx, 0, 0, LAB_COLS * FT, 3, '#2b3342')
  px(ctx, 0, (LAB_ROWS - 1) * FT, LAB_COLS * FT, FT, '#1b2029')
  px(ctx, 0, 0, FT, LAB_ROWS * FT, '#1b2029')
  px(ctx, (LAB_COLS - 1) * FT, 0, FT, LAB_ROWS * FT, '#1b2029')

  // strip lights in the ceiling, throwing a pool of light on the floor
  for (let i = 0; i < 5; i++) {
    const x = 3 * FT + i * 5 * FT
    px(ctx, x, FT - 6, FT * 3, 5, '#dfe6f5')
    px(ctx, x, FT - 1, FT * 3, 2, 'rgba(223,230,245,0.35)')
    px(ctx, x - 8, FT + 1, FT * 3 + 16, 3, 'rgba(223,230,245,0.12)')
  }
  void now
}

/**
 * The rig down the middle of the room: a glass column with something running
 * inside it, cables into the floor, and a ring of instruments around the base.
 */
export function drawTestRig(ctx: CanvasRenderingContext2D, tx: number, ty: number, now: number): void {
  const x = tx * FT
  const y = ty * FT
  const w = FT * 4
  const h = FT * 5

  px(ctx, x - 10, y + h - 8, w + 20, 10, 'rgba(0,0,0,0.35)')
  // plinth
  px(ctx, x, y + h - 26, w, 26, '#2b3141')
  px(ctx, x, y + h - 26, w, 3, '#4a5268')
  // the column
  px(ctx, x + 20, y, w - 40, h - 24, '#101a2a')
  px(ctx, x + 22, y + 2, w - 44, h - 28, '#16304a')
  // whatever is running in it, rising in bands
  for (let i = 0; i < 7; i++) {
    const t = (now / 900 + i / 7) % 1
    const by = y + h - 30 - t * (h - 34)
    const bright = 0.35 + 0.65 * Math.sin(t * Math.PI)
    px(ctx, x + 24, by, w - 48, 5, `rgba(74,163,255,${bright.toFixed(2)})`)
    px(ctx, x + 28, by + 1, w - 56, 2, `rgba(191,230,255,${(bright * 0.9).toFixed(2)})`)
  }
  px(ctx, x + 20, y, w - 40, 4, '#8e94a8') // the collar at the top
  px(ctx, x + 20, y + h - 28, w - 40, 4, '#8e94a8')

  // instruments around the base
  for (let i = 0; i < 4; i++) {
    const ix = x + 4 + i * 30
    px(ctx, ix, y + h - 22, 24, 16, '#1b2029')
    px(ctx, ix + 2, y + h - 20, 20, 9, '#0b1a12')
    const v = Math.round(3 + Math.abs(Math.sin(now / 500 + i * 1.3)) * 6)
    px(ctx, ix + 4, y + h - 13 - v, 3, v, '#3ddc84')
    px(ctx, ix + 9, y + h - 13 - Math.round(v * 0.6), 3, Math.round(v * 0.6), '#3ddc84')
    px(ctx, ix + 14, y + h - 13 - Math.round(v * 0.85), 3, Math.round(v * 0.85), '#ffd166')
  }
  // cables into the floor
  for (const cx of [x + 6, x + w - 10]) {
    px(ctx, cx, y + h - 6, 4, 8, '#2f6f9e')
    px(ctx, cx - 2, y + h + 1, 8, 3, '#1b2029')
  }
}

/** A whiteboard covered in working that changes as you watch. */
export function drawWhiteboardWall(ctx: CanvasRenderingContext2D, tx: number, ty: number, now: number): void {
  const x = tx * FT
  const y = ty * FT
  const w = FT * 5
  const h = FT * 2 + 16
  px(ctx, x, y, w, h, '#8e94a8')
  px(ctx, x + 3, y + 3, w - 6, h - 6, '#eef1f8')
  // lines of working, a few of which get rewritten
  const rows = 6
  for (let r = 0; r < rows; r++) {
    const live = Math.floor(now / 2600 + r) % 5 === 0
    const len = 20 + ((r * 37) % (w - 40))
    px(ctx, x + 10, y + 10 + r * 12, live ? Math.round(len * 0.6) : len, 3, r % 3 === 0 ? '#3c6ea5' : '#2b3141')
    if (r % 2 === 0) px(ctx, x + 14 + len, y + 9 + r * 12, 8, 5, '#b5544a')
  }
  // a diagram in the corner
  px(ctx, x + w - 60, y + h - 34, 46, 26, '#dfe6f5')
  for (let i = 0; i < 5; i++) {
    px(ctx, x + w - 56 + i * 9, y + h - 14 - i * 4, 6, 3, '#3ddc84')
  }
  // and the tray
  px(ctx, x + 6, y + h - 4, w - 12, 4, '#6f7488')
  px(ctx, x + 14, y + h - 3, 8, 2, '#b5544a')
  px(ctx, x + 26, y + h - 3, 8, 2, '#3c6ea5')
}

/** A wall of screens showing whatever is being trained. */
export function drawScreenWall(ctx: CanvasRenderingContext2D, tx: number, ty: number, now: number): void {
  const x = tx * FT
  const y = ty * FT
  px(ctx, x, y, FT * 4, FT * 2, '#12141c')
  for (let i = 0; i < 4; i++) {
    const sx = x + 4 + (i % 2) * 62
    const sy = y + 4 + Math.floor(i / 2) * 30
    px(ctx, sx, sy, 58, 26, '#0d1220')
    px(ctx, sx, sy, 58, 2, '#2f6f9e')
    if (i === 0) {
      // a loss curve falling away
      for (let p = 0; p < 26; p++) {
        const v = Math.round(18 * Math.exp(-p / 9) + Math.sin(now / 400 + p) * 1.2)
        px(ctx, sx + 3 + p * 2, sy + 22 - v, 2, 2, '#3ddc84')
      }
    } else if (i === 1) {
      // a spectrogram
      for (let c = 0; c < 18; c++) {
        const v = Math.round(4 + Math.abs(Math.sin(now / 300 + c)) * 16)
        px(ctx, sx + 4 + c * 3, sy + 22 - v, 2, v, c % 3 === 0 ? '#4aa3ff' : '#2f6f9e')
      }
    } else if (i === 2) {
      // scrolling text
      for (let r = 0; r < 5; r++) {
        const w = 10 + ((Math.floor(now / 700) + r * 13) % 40)
        px(ctx, sx + 4, sy + 4 + r * 4, w, 2, '#3ddc84')
      }
    } else {
      // a grid lighting up
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
          const on = Math.sin(now / 500 + r * 2 + c) > 0.3
          px(ctx, sx + 5 + c * 6, sy + 5 + r * 5, 4, 3, on ? '#bfe6ff' : '#1c3c5c')
        }
      }
    }
  }
}

/** A bench a researcher sits at: terminal, notes, a mug that never moves. */
export function drawLabBench(ctx: CanvasRenderingContext2D, tx: number, ty: number, now: number, seed: number): void {
  const x = tx * FT
  const y = ty * FT
  px(ctx, x, y + 8, FT * 2, 22, '#c9cddb') // the white worktop
  px(ctx, x, y + 8, FT * 2, 3, '#eef1f8')
  px(ctx, x, y + 30, FT * 2, 4, '#8e94a8')
  // a terminal on it
  px(ctx, x + 14, y - 12, 34, 22, '#20242f')
  px(ctx, x + 16, y - 10, 30, 17, '#0b1a12')
  for (let r = 0; r < 4; r++) {
    const w = 6 + ((Math.floor(now / 600) + r * 7 + seed) % 20)
    px(ctx, x + 18, y - 8 + r * 4, w, 2, r === 0 ? '#3ddc84' : '#1f6b42')
  }
  px(ctx, x + 26, y + 10, 10, 3, '#454b5e') // the stand
  // notes and a mug
  px(ctx, x + 2, y + 14, 10, 8, '#eef1f8')
  px(ctx, x + 3, y + 16, 8, 1, '#8e94a8')
  px(ctx, x + 52, y + 12, 8, 9, '#b5544a')
  px(ctx, x + 60, y + 14, 2, 4, '#b5544a')
}

/** A sample fridge, humming in the corner. */
export function drawLabFridge(ctx: CanvasRenderingContext2D, tx: number, ty: number, now: number): void {
  const x = tx * FT
  const y = ty * FT
  px(ctx, x, y, FT, FT * 2, '#c9cddb')
  px(ctx, x, y, FT, 3, '#eef1f8')
  px(ctx, x + 3, y + 6, FT - 6, FT - 6, '#16304a')
  px(ctx, x + 5, y + 8, FT - 10, FT - 10, '#1c3c5c')
  px(ctx, x + 4, y + FT + 4, FT - 8, FT - 12, '#8e94a8')
  px(ctx, x + FT - 9, y + 20, 4, 10, '#454b5e') // handle
  px(ctx, x + 6, y + 3, 6, 2, Math.sin(now / 700) > 0 ? '#3ddc84' : '#14361f')
}

/**
 * A hardware bench: a scope with a live trace, a tray of dies, an iron with a
 * wisp of smoke coming off it and a wafer catching the light.
 */
export function drawHardwareBench(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  now: number,
  seed: number,
): void {
  const x = tx * FT
  const y = ty * FT
  // steel worktop, not the white one the researchers get
  px(ctx, x, y + 8, FT * 2, 22, '#8e94a8')
  px(ctx, x, y + 8, FT * 2, 3, '#c9cddb')
  px(ctx, x, y + 30, FT * 2, 4, '#5d6376')

  // the scope, standing on the bench
  px(ctx, x + 2, y - 14, 30, 24, '#20242f')
  px(ctx, x + 4, y - 12, 26, 18, '#0b1a12')
  for (let i = 0; i < 24; i++) {
    const v = Math.round(Math.sin((i + now / 90 + seed) / 2) * 6)
    px(ctx, x + 5 + i, y - 3 + v, 1, 2, '#3ddc84')
  }
  px(ctx, x + 6, y - 16, 4, 2, '#c9a43a')

  // a tray of dies, one of which is being probed
  px(ctx, x + 36, y + 12, 20, 14, '#2b3141')
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const hot = (Math.floor(now / 900) + seed) % 6 === r * 3 + c
      px(ctx, x + 38 + c * 6, y + 14 + r * 6, 4, 4, hot ? '#4aa3ff' : '#1f6b42')
    }
  }
  // the wafer, leaning against the back
  const shimmer = (Math.sin(now / 700 + seed) + 1) / 2
  px(ctx, x + 58, y + 10, 4, 16, `rgba(140,190,235,${(0.45 + shimmer * 0.4).toFixed(2)})`)

  // the iron in its stand, still smoking
  px(ctx, x + 6, y + 14, 14, 4, '#454b5e')
  px(ctx, x + 8, y + 12, 10, 3, '#b5544a')
  px(ctx, x + 17, y + 13, 4, 2, '#ffd166')
  for (let i = 0; i < 3; i++) {
    const t = ((now / 800 + i * 0.33) % 1)
    px(ctx, x + 18 + Math.round(t * 3), y + 10 - Math.round(t * 14), 2, 2, `rgba(200,210,225,${(0.35 * (1 - t)).toFixed(2)})`)
  }
}
