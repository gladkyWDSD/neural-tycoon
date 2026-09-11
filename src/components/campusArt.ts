import { px } from './officeArt'

// Outside. Everything you have bought, standing in a field: the office you work
// in, the datacenters you built or rent, the fab lines turning out your own
// silicon, and the dishes feeding the data pipeline.
//
// Drawn in art pixels on the same grid as the office, so a tile out here is a
// tile in there.

const FT = 32 // art pixels per world tile

export const CAMPUS_COLS = 44
export const CAMPUS_ROWS = 22

const GRASS = ['#2f4a33', '#33513a', '#2b4530']
const ROAD = '#2a2d38'
const ROAD_LINE = '#6b7288'
const PATH = '#4a4436'

/** Four seasons, the same as the office: the field goes with the year. */
const SEASON_GRASS: [string, string, string][] = [
  ['#3b4a44', '#41514a', '#36453f'], // winter, frost on the grass
  ['#2f4a33', '#33513a', '#2b4530'], // spring
  ['#3a4d2c', '#405430', '#354828'], // summer, dry
  ['#4a4030', '#51462f', '#443a2b'], // autumn
]

export function drawGround(ctx: CanvasRenderingContext2D, season: number): void {
  const grass = SEASON_GRASS[season] ?? GRASS
  for (let row = 0; row < CAMPUS_ROWS; row++) {
    for (let col = 0; col < CAMPUS_COLS; col++) {
      // a stable scatter, so the field does not shimmer between frames
      const n = (col * 7 + row * 13 + ((col * row) % 5)) % 3
      px(ctx, col * FT, row * FT, FT, FT, grass[n])
    }
  }
  // tufts
  for (let i = 0; i < 160; i++) {
    const x = ((i * 97) % (CAMPUS_COLS * FT))
    const y = ((i * 61) % ((CAMPUS_ROWS - 3) * FT))
    px(ctx, x, y, 2, 1, '#456b4a')
    px(ctx, x + 1, y - 1, 1, 1, '#456b4a')
  }
}

export function drawRoad(ctx: CanvasRenderingContext2D): void {
  const y = (CAMPUS_ROWS - 3) * FT
  px(ctx, 0, y, CAMPUS_COLS * FT, FT * 3, ROAD)
  px(ctx, 0, y, CAMPUS_COLS * FT, 3, '#3a3e4d') // kerb
  px(ctx, 0, y + FT * 3 - 3, CAMPUS_COLS * FT, 3, '#1d2029')
  for (let x = 8; x < CAMPUS_COLS * FT; x += 40) {
    px(ctx, x, y + FT * 1.5, 18, 3, ROAD_LINE)
  }
}

/** A path from the road up to whatever it leads to. */
export function drawPath(ctx: CanvasRenderingContext2D, tx: number, fromRow: number, toRow: number): void {
  const x = tx * FT
  for (let row = toRow; row < fromRow; row++) {
    px(ctx, x, row * FT, FT * 2, FT, PATH)
    px(ctx, x, row * FT, FT * 2, 2, '#5a5343')
  }
}

function windows(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  floors: number,
  now: number,
  seed: number,
): void {
  // wide, evenly spread windows: a dozen narrow ones reads as graph paper
  const cols = Math.max(2, Math.min(8, Math.floor((w - 24) / 44)))
  const pitch = Math.floor((w - 24) / cols)
  const spare = w - 24 - cols * pitch
  for (let r = 0; r < floors; r++) {
    const wy = y + 18 + r * 34
    // a band of darker cladding between the floors, which is what stops a
    // building looking like graph paper
    px(ctx, x + 4, wy - 8, w - 8, 6, '#2f3648')
    for (let c = 0; c < cols; c++) {
      const wx = x + 12 + Math.round(spare / 2) + c * pitch
      const key = (c * 3 + r * 7 + seed) % 11
      const lit = key !== 4 && (key !== 7 || Math.sin(now / 1400 + key) > -0.3)
      px(ctx, wx - 1, wy - 1, 22, 22, '#20242f')
      px(ctx, wx, wy, 20, 20, lit ? '#ffd166' : '#2b3141')
      px(ctx, wx, wy, 20, 4, lit ? '#fff0c0' : '#333a4d')
      px(ctx, wx + 9, wy, 2, 20, '#1a1c25') // the mullion
      if (lit) px(ctx, wx + 2, wy + 14, 6, 4, '#d8a13a') // somebody at a desk
    }
  }
}

/**
 * The office you sit in. It grows with the upgrades: a unit at level one, a
 * proper block by level four, with the name over the door.
 */
export function drawOffice(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  level: number,
  now: number,
): { cols: number; rows: number } {
  const cols = 8 + level * 2
  const rows = 4 + level
  const x = tx * FT
  const y = ty * FT
  const w = cols * FT
  const h = rows * FT

  px(ctx, x + 6, y + h - 10, w, 10, 'rgba(0,0,0,0.35)') // shadow on the grass
  px(ctx, x, y, w, h, '#3a4257') // body
  px(ctx, x, y, w, 6, '#59627a') // lit roof edge
  px(ctx, x + w - 6, y, 6, h, '#2b3141') // shaded side
  px(ctx, x, y + h - 8, w, 8, '#2b3141') // base

  px(ctx, x + 4, y + 6, w - 8, h - 18, '#333b4f') // the facade inside the frame
  windows(ctx, x, y, w, Math.max(1, rows - 2), now, level)

  // the door, and a light over it
  const dx = x + Math.floor(w / 2) - 12
  const dy = y + h - 34
  px(ctx, dx - 2, dy - 2, 28, 28, '#20242f')
  px(ctx, dx, dy, 24, 26, '#8a6038')
  px(ctx, dx + 11, dy, 2, 26, '#5c3f22')
  px(ctx, dx + 6, dy + 12, 3, 3, '#ffd166')
  px(ctx, dx + 15, dy + 12, 3, 3, '#ffd166')
  px(ctx, dx + 4, dy - 8, 16, 4, '#ffd166')
  px(ctx, dx + 6, dy - 12, 12, 4, '#2b3141')

  // aerials on the roof
  px(ctx, x + 20, y - 14, 2, 14, '#8e94a8')
  px(ctx, x + 16, y - 16, 10, 2, '#8e94a8')
  const blink = Math.sin(now / 500) > 0
  px(ctx, x + 20, y - 18, 2, 2, blink ? '#ff5c5c' : '#4a2028')
  return { cols, rows }
}

/** A long low shed with cooling on the roof. Leased ones fly somebody else's colours. */
export function drawDatacenter(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  now: number,
  leased: boolean,
  seed: number,
): void {
  const x = tx * FT
  const y = ty * FT
  const w = FT * 6
  const h = FT * 3

  px(ctx, x + 5, y + h - 8, w, 8, 'rgba(0,0,0,0.32)')
  px(ctx, x, y, w, h, leased ? '#454b5e' : '#33425e')
  px(ctx, x, y, w, 5, leased ? '#5d6376' : '#4b5d84')
  px(ctx, x, y + h - 7, w, 7, '#20242f')
  px(ctx, x + w - 5, y, 5, h, '#1d2029')

  // roof units, fans turning
  for (let i = 0; i < 4; i++) {
    const ux = x + 14 + i * 42
    px(ctx, ux, y + 10, 26, 20, '#2b3141')
    px(ctx, ux, y + 10, 26, 3, '#4a5268')
    const spin = Math.floor(now / 90 + i) % 2 === 0
    px(ctx, ux + 5, y + 17, 16, 3, spin ? '#8e94a8' : '#5d6376')
    px(ctx, ux + 11, y + 13, 3, 12, spin ? '#5d6376' : '#8e94a8')
  }
  // doors and a status light
  px(ctx, x + 10, y + h - 24, 16, 17, '#20242f')
  px(ctx, x + 12, y + h - 22, 12, 15, '#2f6f9e')
  const on = Math.sin(now / 700 + seed) > -0.4
  px(ctx, x + w - 22, y + h - 18, 4, 4, on ? '#3ddc84' : '#14361f')
  if (leased) {
    px(ctx, x + w - 40, y + h - 20, 14, 8, '#8a6038')
    px(ctx, x + w - 40, y + h - 20, 14, 2, '#a8763f')
  }
}

/** A fab: taller, with a cleanroom block and a stack breathing steam. */
export function drawFab(ctx: CanvasRenderingContext2D, tx: number, ty: number, now: number): void {
  const x = tx * FT
  const y = ty * FT
  const w = FT * 5
  const h = FT * 4

  px(ctx, x + 5, y + h - 8, w, 8, 'rgba(0,0,0,0.32)')
  px(ctx, x, y, w, h, '#3d3a4d')
  px(ctx, x, y, w, 5, '#57536b')
  px(ctx, x + w - 5, y, 5, h, '#2a2836')
  px(ctx, x, y + h - 8, w, 8, '#23212e')

  // cleanroom glass, lit blue
  for (let i = 0; i < 3; i++) {
    const gx = x + 10 + i * 46
    px(ctx, gx, y + 20, 34, 28, '#16304a')
    px(ctx, gx, y + 20, 34, 3, '#2f6f9e')
    const lit = Math.sin(now / 900 + i * 2) > -0.5
    px(ctx, gx + 4, y + 26, 26, 16, lit ? '#2f6f9e' : '#1c3c5c')
    px(ctx, gx + 8, y + 30, 8, 8, lit ? '#bfe6ff' : '#2f6f9e')
  }

  // the stack, with steam rising off it
  px(ctx, x + w - 30, y - 26, 14, 30, '#4a4658')
  px(ctx, x + w - 30, y - 26, 14, 3, '#6b6680')
  for (let i = 0; i < 4; i++) {
    const t = (now / 700 + i * 0.25) % 1
    const py = y - 30 - t * 34
    const size = 5 + Math.round(t * 7)
    px(ctx, x + w - 30 + 4 - Math.round(t * 5), py, size, size, `rgba(200,210,225,${(0.4 * (1 - t)).toFixed(2)})`)
  }
}

/** A dish on a mast, one for every source feeding the pipeline. */
export function drawDish(ctx: CanvasRenderingContext2D, tx: number, ty: number, now: number, seed: number): void {
  const x = tx * FT
  const y = ty * FT
  px(ctx, x + 12, y + 44, 12, 4, 'rgba(0,0,0,0.3)')
  px(ctx, x + 16, y + 16, 4, 28, '#8e94a8') // mast
  px(ctx, x + 10, y + 42, 16, 4, '#5d6376') // footing
  // the dish itself, tilting slowly
  const tilt = Math.round(Math.sin(now / 2600 + seed) * 3)
  px(ctx, x + 6, y + 6 + tilt, 22, 14, '#c9cddb')
  px(ctx, x + 8, y + 8 + tilt, 18, 10, '#8e94a8')
  px(ctx, x + 15, y + 12 + tilt, 4, 4, '#2b3141')
  px(ctx, x + 6, y + 6 + tilt, 22, 2, '#eef1f8')
}

/**
 * The research lab: low, glassy and expensive-looking, with the rig visible
 * through the front and a skylight on the roof.
 */
export function drawLab(ctx: CanvasRenderingContext2D, tx: number, ty: number, now: number): void {
  const x = tx * FT
  const y = ty * FT
  const w = FT * 7
  const h = FT * 4

  px(ctx, x + 6, y + h - 8, w, 10, 'rgba(0,0,0,0.35)')
  px(ctx, x, y, w, h, '#d4d8e4') // white cladding
  px(ctx, x, y, w, 6, '#f0f3fa')
  px(ctx, x + w - 6, y, 6, h, '#a8adbd')
  px(ctx, x, y + h - 10, w, 10, '#8e94a8')

  // a long band of glass, with the rig glowing behind it
  px(ctx, x + 10, y + 22, w - 20, 44, '#16304a')
  px(ctx, x + 10, y + 22, w - 20, 3, '#2f6f9e')
  for (let i = 0; i < 6; i++) {
    const gx = x + 16 + i * 34
    const lit = Math.sin(now / 800 + i) > -0.4
    px(ctx, gx, y + 28, 26, 32, lit ? '#1c3c5c' : '#16304a')
    px(ctx, gx + 8, y + 34, 10, 20, lit ? '#4aa3ff' : '#24507a')
  }
  const pulse = (Math.sin(now / 500) + 1) / 2
  px(ctx, x + w / 2 - 8, y + 26, 16, 36, `rgba(74,163,255,${(0.35 + pulse * 0.5).toFixed(2)})`)

  // the door, and a sign
  px(ctx, x + w / 2 - 14, y + h - 34, 28, 26, '#20242f')
  px(ctx, x + w / 2 - 12, y + h - 32, 24, 24, '#2f6f9e')
  px(ctx, x + w / 2 - 1, y + h - 32, 2, 24, '#16304a')
  px(ctx, x + 12, y + 8, 46, 8, '#2b3141')
  px(ctx, x + 14, y + 10, 42, 4, '#3ddc84')

  // a skylight, and the vents beside it
  px(ctx, x + w - 60, y - 10, 40, 12, '#bfe6ff')
  px(ctx, x + w - 60, y - 10, 40, 3, '#eef1f8')
  px(ctx, x + 20, y - 8, 14, 10, '#8e94a8')
}

export function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number): void {
  px(ctx, x + 14, y + 58, 20, 5, 'rgba(0,0,0,0.3)')
  px(ctx, x + 19, y + 32, 9, 28, '#4a3626')
  px(ctx, x + 19, y + 32, 3, 28, '#5c4630')
  const spread = seed % 2 === 0 ? 0 : 4
  px(ctx, x + 4 - spread, y + 10, 38 + spread * 2, 26, '#2f6f3f')
  px(ctx, x + 10, y, 26, 16, '#3a8a4d')
  px(ctx, x + 14, y + 3, 12, 8, '#4bad60')
  px(ctx, x + 6, y + 32, 34, 5, '#245732')
}

/** Cars come and go along the road at the bottom. */
export function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, colour: string, flip: boolean): void {
  px(ctx, x, y + 14, 44, 4, 'rgba(0,0,0,0.35)')
  px(ctx, x + 2, y, 40, 14, colour)
  px(ctx, x + 2, y, 40, 3, '#ffffff22')
  px(ctx, x + (flip ? 8 : 14), y + 2, 18, 8, '#16304a')
  px(ctx, x, y + 4, 2, 7, '#1a1c25')
  px(ctx, x + 42, y + 4, 2, 7, '#1a1c25')
  px(ctx, x + (flip ? 0 : 42), y + 5, 2, 4, '#ffd166') // headlights lead the way
  px(ctx, x + 7, y + 13, 8, 4, '#14161d')
  px(ctx, x + 29, y + 13, 8, 4, '#14161d')
}

/** The way back inside: a sign by the office door. */
export function drawBackSign(ctx: CanvasRenderingContext2D, tx: number, ty: number): void {
  const x = tx * FT
  const y = ty * FT
  px(ctx, x + 6, y + 30, 4, 14, '#5c3f22')
  px(ctx, x + 18, y + 30, 4, 14, '#5c3f22')
  px(ctx, x, y + 6, 28, 26, '#8a6038')
  px(ctx, x, y + 6, 28, 3, '#a8763f')
  px(ctx, x + 3, y + 12, 22, 4, '#f0f3fa')
  px(ctx, x + 3, y + 20, 14, 4, '#f0f3fa')
}
