import { drawDepth } from './artDepth'
import { px } from './officeArt'

// Inside a datacenter: rows of racks, and in the racks the cards themselves.
// Everything is drawn in art pixels on the same grid as every other room, so a
// tile in here is a tile in the office.

const FT = 32

export const HALL_COLS = 34
export const HALL_ROWS = 17

const FLOOR = '#20242f'
const FLOOR_ALT = '#242936'
const WALL = '#161a23'

/** A raised floor of perforated tiles, which is what a hall stands on. */
export function drawHallFloor(ctx: CanvasRenderingContext2D): void {
  for (let row = 0; row < HALL_ROWS; row++) {
    for (let col = 0; col < HALL_COLS; col++) {
      const x = col * FT
      const y = row * FT
      px(ctx, x, y, FT, FT, (row + col) % 2 === 0 ? FLOOR : FLOOR_ALT)
      px(ctx, x, y, FT, 1, '#2c3240') // the seam between tiles
      px(ctx, x, y, 1, FT, '#2c3240')
      // the vents in a floor tile, where the cold comes up
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          px(ctx, x + 10 + i * 5, y + 10 + j * 5, 2, 2, '#181c26')
        }
      }
    }
  }
  // walls top and bottom
  px(ctx, 0, 0, HALL_COLS * FT, FT, WALL)
  px(ctx, 0, 0, HALL_COLS * FT, 3, '#252b38')
  px(ctx, 0, (HALL_ROWS - 1) * FT, HALL_COLS * FT, FT, WALL)
}

/** Cable trays overhead, running the length of the hall. */
export function drawCableTrays(ctx: CanvasRenderingContext2D, now: number): void {
  for (const row of [3, 9]) {
    const y = row * FT - 10
    px(ctx, 0, y, HALL_COLS * FT, 8, '#2b3141')
    px(ctx, 0, y, HALL_COLS * FT, 2, '#454b5e')
    for (let x = 0; x < HALL_COLS * FT; x += 6) {
      px(ctx, x, y + 3, 4, 2, x % 24 === 0 ? '#2f6f9e' : '#8a6038')
    }
    // a data light chasing along the tray, which is the hall thinking
    const head = (now / 4) % (HALL_COLS * FT)
    px(ctx, head, y + 3, 10, 2, '#bfe6ff')
  }
}

/**
 * One rack, with `cards` of its slots filled.
 *
 * A filled slot is a server: a chassis, a green board inside it with a fan, and
 * a cable off the back into the spine. An empty slot is a blanking plate.
 */
export function drawRack(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  cards: number,
  now: number,
  seed: number,
): void {
  const x = tx * FT
  const y = ty * FT
  const w = FT * 3
  const h = FT * 5
  const SLOTS = 8

  drawDepth(ctx, x, y, w, h, 12, '#566579', '#141e2b', '#8a9db0')

  px(ctx, x + 4, y + h, w, 8, 'rgba(0,0,0,0.45)') // shadow on the floor
  px(ctx, x, y, w, h, '#12141c') // cabinet
  px(ctx, x + 2, y + 2, w - 4, h - 4, '#1b1f29')
  px(ctx, x, y, w, 3, '#333a4d') // lit top edge
  px(ctx, x, y, 3, h, '#262c3a')
  px(ctx, x + 4, y + 3, w - 10, 3, '#56677c')
  px(ctx, x + w - 6, y + 6, 3, h - 10, '#090f18')
  // Mounting rails, screw heads, and feet make the rack feel assembled.
  for (let railY = 12; railY < h - 6; railY += 18) {
    px(ctx, x + 2, y + railY, 2, 2, '#8a99a8')
    px(ctx, x + w - 5, y + railY, 2, 2, '#647285')
  }
  px(ctx, x + 7, y + h - 2, 12, 4, '#090e17')
  px(ctx, x + w - 19, y + h - 2, 12, 4, '#090e17')

  for (let i = 0; i < SLOTS; i++) {
    const sy = y + 8 + i * 18
    const filled = i < cards
    if (!filled) {
      // a blanking plate over an empty slot
      px(ctx, x + 6, sy, w - 12, 14, '#20242f')
      px(ctx, x + 6, sy, w - 12, 2, '#2b3141')
      px(ctx, x + w / 2 - 6, sy + 6, 12, 2, '#181c26')
      continue
    }
    // the chassis
    px(ctx, x + 5, sy, w - 10, 15, '#2b3141')
    px(ctx, x + 5, sy, w - 10, 2, '#454b5e')
    px(ctx, x + 6, sy + 2, w - 12, 11, '#1a2030')
    // the card: a green board with a fan on it
    px(ctx, x + 9, sy + 3, w - 26, 9, '#1f6b42')
    px(ctx, x + 9, sy + 3, w - 26, 1, '#2f9d5c')
    for (let trace = 0; trace < 3; trace++) {
      px(ctx, x + 12 + trace * 17, sy + 10, 12, 1, '#479b78')
      px(ctx, x + 22 + trace * 17, sy + 7, 1, 3, '#479b78')
    }
    for (let c = 0; c < 4; c++) px(ctx, x + 11 + c * 5, sy + 5, 2, 2, '#12141c') // the chips on it
    const spin = Math.floor(now / 70 + i + seed) % 2 === 0
    px(ctx, x + w - 17, sy + 4, 8, 8, '#12141c') // the fan housing
    px(ctx, x + w - 16, sy + 7, 6, 2, spin ? '#5d6376' : '#8e94a8')
    px(ctx, x + w - 14, sy + 5, 2, 6, spin ? '#8e94a8' : '#5d6376')
    // the cable out of the back, into the spine
    px(ctx, x + w - 7, sy + 6, 7, 2, seed % 2 === 0 ? '#2f6f9e' : '#b5544a')
    // and the lights on the front
    const t = now / (240 + ((i * 37 + seed * 13) % 400))
    px(ctx, x + 6, sy + 3, 2, 2, Math.sin(t) > 0 ? '#3ddc84' : '#14361f')
    px(ctx, x + 6, sy + 7, 2, 2, Math.sin(t * 1.8 + i) > 0.2 ? '#ffd166' : '#3a2f14')
  }

  // the spine the cables run into
  px(ctx, x + w - 3, y + 6, 3, h - 12, '#2b3141')
}

/** The end of a row: the cooling wall, breathing cold into the aisle. */
export function drawCooler(ctx: CanvasRenderingContext2D, tx: number, ty: number, now: number): void {
  const x = tx * FT
  const y = ty * FT
  const w = FT * 2
  const h = FT * 5

  drawDepth(ctx, x, y, w, h, 12, '#69788b', '#1a2635', '#a4b7c6')

  px(ctx, x + 4, y + h, w, 8, 'rgba(0,0,0,0.45)')
  px(ctx, x, y, w, h, '#242a36')
  px(ctx, x, y, w, 3, '#454b5e')
  px(ctx, x, y, 3, h, '#333a4d')

  // louvres down most of the face
  px(ctx, x + 6, y + 8, w - 12, h - 74, '#161a23')
  for (let i = 0; i < 9; i++) px(ctx, x + 8, y + 12 + i * 9, w - 16, 4, '#333a4d')

  // the fan at the bottom, in its own housing
  const fy = y + h - 62
  px(ctx, x + 6, fy, w - 12, 54, '#161a23')
  px(ctx, x + 8, fy + 2, w - 16, 50, '#20242f')
  const spin = Math.floor(now / 60) % 2 === 0
  const cx = x + w / 2
  const cy = fy + 27
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + (spin ? 0.4 : 0)
    const bx = Math.round(Math.cos(a) * 16)
    const by = Math.round(Math.sin(a) * 16)
    px(ctx, cx + Math.min(0, bx) - 1, cy + Math.min(0, by) - 1, Math.abs(bx) + 3, Math.abs(by) + 3, '#5d6376')
  }
  px(ctx, cx - 4, cy - 4, 8, 8, '#8e94a8')

  // the cold it pushes into the aisle
  for (let i = 0; i < 3; i++) {
    const t = (now / 900 + i * 0.33) % 1
    px(ctx, x - Math.round(t * 44), y + 26 + i * 34, Math.round(t * 40), 2, `rgba(150,200,235,${(0.22 * (1 - t)).toFixed(2)})`)
  }
}

/** A wall panel showing what the hall is doing. */
export function drawHallScreen(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  load: number,
  now: number,
): void {
  const x = tx * FT
  const y = ty * FT
  px(ctx, x, y, FT * 3, FT * 2, '#12141c')
  px(ctx, x + 3, y + 3, FT * 3 - 6, FT * 2 - 6, '#0b1a12')
  // a load trace crawling across it
  const hot = load > 1
  const colour = hot ? '#ff5c5c' : load > 0.85 ? '#ffd166' : '#3ddc84'
  for (let i = 0; i < 26; i++) {
    const v = (Math.sin(now / 600 + i * 0.5) + 1) / 2
    const height = Math.round(4 + v * Math.min(1.4, load + 0.2) * 26)
    px(ctx, x + 7 + i * 3, y + FT * 2 - 10 - height, 2, height, colour)
  }
  px(ctx, x + 6, y + 8, 20, 3, colour)
  px(ctx, x + 30, y + 8, 10, 3, '#333a4d')
}
