import { px } from './officeArt'
import { hash } from './sprites'

// Furniture for the parts of the office nobody works in: the margins either
// side of the desk grid. Everything here is drawn in art pixels on the same
// SCALE grid as the desks, and placed in whole world tiles.

const FT = 32 // art pixels per world tile

/** What the room looks like this frame, in world tiles. */
export interface RoomInfo {
  roomCols: number
  roomRows: number
  startCol: number
  startRow: number
  gridW: number
}

// ------------------------------------------------------------------ pieces

function drawRug(ctx: CanvasRenderingContext2D, tx: number, ty: number, tw: number, th: number) {
  const x = tx * FT
  const y = ty * FT
  const w = tw * FT
  const h = th * FT
  px(ctx, x + 2, y + 2, w - 4, h - 4, '#26404a')
  px(ctx, x + 4, y + 4, w - 8, h - 8, '#2e4b57')
  px(ctx, x + 8, y + 8, w - 16, h - 16, '#26404a')
  px(ctx, x + 10, y + 10, w - 20, h - 20, '#355663')
  // fringe along the short edges
  for (let i = 4; i < w - 4; i += 4) {
    px(ctx, x + i, y + 1, 2, 1, '#3d6270')
    px(ctx, x + i, y + h - 2, 2, 1, '#3d6270')
  }
}

function drawSofa(ctx: CanvasRenderingContext2D, tx: number, ty: number) {
  const x = tx * FT
  const y = ty * FT
  px(ctx, x + 1, y + 1, 62, 32, '#1b2233') // outline, so it reads against the floor
  px(ctx, x + 3, y + 3, 58, 16, '#4a5c86') // backrest
  px(ctx, x + 3, y + 3, 58, 3, '#7286b5') // top light
  px(ctx, x + 6, y + 7, 23, 11, '#5a6e9e') // back cushions
  px(ctx, x + 35, y + 7, 23, 11, '#5a6e9e')
  px(ctx, x + 3, y + 8, 8, 22, '#3c4c72') // arms
  px(ctx, x + 53, y + 8, 8, 22, '#3c4c72')
  px(ctx, x + 4, y + 9, 6, 2, '#7286b5')
  px(ctx, x + 54, y + 9, 6, 2, '#7286b5')
  px(ctx, x + 11, y + 19, 42, 11, '#546792') // seat
  px(ctx, x + 12, y + 20, 19, 9, '#63779f')
  px(ctx, x + 33, y + 20, 19, 9, '#63779f')
  px(ctx, x + 11, y + 29, 42, 2, '#2c3855') // shadow under the seat
  px(ctx, x + 7, y + 31, 4, 3, '#1d1409') // legs
  px(ctx, x + 53, y + 31, 4, 3, '#1d1409')
}

function drawCoffeeTable(ctx: CanvasRenderingContext2D, tx: number, ty: number) {
  const x = tx * FT
  const y = ty * FT
  px(ctx, x + 4, y + 8, 40, 10, '#8a6038') // top
  px(ctx, x + 4, y + 8, 40, 2, '#a8763f')
  px(ctx, x + 4, y + 18, 40, 3, '#5c3f22') // edge
  px(ctx, x + 7, y + 21, 3, 6, '#4a3218') // legs
  px(ctx, x + 38, y + 21, 3, 6, '#4a3218')
  px(ctx, x + 10, y + 4, 9, 5, '#e8ecf6') // a magazine
  px(ctx, x + 11, y + 5, 7, 1, '#9aa0b4')
  px(ctx, x + 11, y + 7, 5, 1, '#9aa0b4')
  px(ctx, x + 30, y + 3, 7, 6, '#c9cddb') // and a mug
  px(ctx, x + 31, y + 4, 5, 4, '#b5544a')
  px(ctx, x + 37, y + 4, 2, 3, '#c9cddb')
}

function drawFloorPlant(ctx: CanvasRenderingContext2D, tx: number, ty: number) {
  const x = tx * FT + 6
  const y = ty * FT
  // leaves first, so the pot sits in front of them
  px(ctx, x + 8, y + 2, 4, 14, '#2f7d4f') // central stem
  const frond = (fx: number, fy: number, dir: number, len: number, c: string) => {
    for (let i = 0; i < len; i++) {
      px(ctx, fx + dir * i, fy + Math.round(i * 0.6), 3, 2, c)
    }
  }
  frond(x + 8, y + 4, -1, 8, '#3ddc84')
  frond(x + 10, y + 3, 1, 8, '#34b86e')
  frond(x + 8, y + 10, -1, 7, '#2f9d5c')
  frond(x + 10, y + 9, 1, 7, '#3ddc84')
  frond(x + 9, y + 1, 0, 4, '#4bf09a')
  px(ctx, x + 2, y + 18, 16, 4, '#3a2418') // soil
  px(ctx, x + 1, y + 20, 18, 3, '#a0522d') // pot rim
  px(ctx, x + 2, y + 23, 16, 10, '#8a4a2f') // pot
  px(ctx, x + 3, y + 23, 3, 10, '#a35c3a') // pot highlight
  px(ctx, x + 4, y + 33, 12, 2, '#1a1c25') // shadow
}

function drawServerRack(ctx: CanvasRenderingContext2D, tx: number, ty: number) {
  const x = tx * FT + 4
  const y = ty * FT + 2
  px(ctx, x, y, 24, 56, '#12141c') // cabinet
  px(ctx, x + 1, y + 1, 22, 54, '#1d212c')
  px(ctx, x + 1, y + 1, 22, 2, '#2b3141') // top light
  for (let i = 0; i < 6; i++) {
    const sy = y + 4 + i * 8
    px(ctx, x + 3, sy, 18, 6, '#242936') // a server
    px(ctx, x + 3, sy, 18, 1, '#333a4d')
    for (let v = 0; v < 5; v++) px(ctx, x + 5 + v * 2, sy + 3, 1, 2, '#171b24') // vents
  }
  px(ctx, x + 2, y + 54, 20, 2, '#0c0e14') // plinth
}

/** The blinking half of the rack, drawn live over the cached cabinet. */
export function drawRackLights(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  now: number,
) {
  const x = tx * FT + 4
  const y = ty * FT + 2
  for (let i = 0; i < 6; i++) {
    const sy = y + 4 + i * 8
    const t = now / (260 + i * 90)
    px(ctx, x + 17, sy + 2, 2, 2, Math.sin(t) > 0 ? '#3ddc84' : '#14361f')
    px(ctx, x + 17, sy + 4, 2, 1, Math.sin(t * 1.7 + i) > 0.3 ? '#ffd166' : '#3a2f14')
  }
}

function drawWhiteboard(ctx: CanvasRenderingContext2D, tx: number, ty: number) {
  const x = tx * FT + 2
  const y = ty * FT + 2
  px(ctx, x, y, 60, 40, '#8e94a8') // frame
  px(ctx, x + 2, y + 2, 56, 32, '#eef1f8') // board
  // a line that goes up and to the right, as all the best lines do
  const pts = [30, 27, 28, 22, 19, 20, 14, 10, 8, 6]
  for (let i = 0; i < pts.length; i++) {
    px(ctx, x + 5 + i * 5, y + 2 + pts[i], 5, 2, '#4aa3ff')
  }
  px(ctx, x + 4, y + 4, 2, 30, '#9aa0b4') // axes
  px(ctx, x + 4, y + 32, 52, 2, '#9aa0b4')
  px(ctx, x + 40, y + 5, 14, 3, '#3ddc84') // a couple of scribbled notes
  px(ctx, x + 40, y + 10, 10, 2, '#ff5c5c')
  px(ctx, x + 2, y + 34, 56, 2, '#6f7488') // marker tray
  px(ctx, x + 8, y + 35, 8, 2, '#ff5c5c')
  px(ctx, x + 20, y + 35, 8, 2, '#4aa3ff')
  px(ctx, x + 26, y + 40, 4, 8, '#5d6376') // legs
  px(ctx, x + 32, y + 40, 4, 8, '#5d6376')
}

function drawFilingCabinet(ctx: CanvasRenderingContext2D, tx: number, ty: number) {
  const x = tx * FT + 6
  const y = ty * FT + 4
  px(ctx, x, y, 20, 34, '#454b5e')
  px(ctx, x + 1, y + 1, 18, 32, '#565d73')
  px(ctx, x + 1, y + 1, 18, 2, '#6b7288')
  for (let i = 0; i < 3; i++) {
    const dy = y + 3 + i * 10
    px(ctx, x + 2, dy, 16, 8, '#4c5369')
    px(ctx, x + 7, dy + 3, 6, 2, '#8e94a8') // handle
  }
  px(ctx, x + 4, y + 34, 12, 2, '#1a1c25')
}

function drawBoxes(ctx: CanvasRenderingContext2D, tx: number, ty: number) {
  const x = tx * FT + 4
  const y = ty * FT + 10
  px(ctx, x, y + 12, 22, 14, '#8a6038') // lower box
  px(ctx, x, y + 12, 22, 2, '#a8763f')
  px(ctx, x + 10, y + 12, 2, 14, '#c9cddb') // tape
  px(ctx, x + 4, y, 16, 12, '#8a6038') // upper box
  px(ctx, x + 4, y, 16, 2, '#a8763f')
  px(ctx, x + 11, y, 2, 12, '#c9cddb')
}

/** A wall clock, hung where the progress bars will not cover it. */
export function drawWallClock(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  now: number,
) {
  const cx = tx * FT + 16
  const cy = ty * FT + 16
  for (let y = -9; y <= 9; y++) {
    for (let x = -9; x <= 9; x++) {
      const d = Math.hypot(x, y)
      if (d > 9) continue
      px(ctx, cx + x, cy + y, 1, 1, d > 7.5 ? '#2b3141' : d > 6.5 ? '#8e94a8' : '#e8ecf6')
    }
  }
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2
    px(ctx, cx + Math.round(Math.sin(a) * 5), cy - Math.round(Math.cos(a) * 5), 1, 1, '#5d6376')
  }
  const secs = now / 1000
  const hand = (angle: number, len: number, color: string) => {
    for (let i = 0; i < len; i++) {
      px(ctx, cx + Math.round(Math.sin(angle) * i), cy - Math.round(Math.cos(angle) * i), 1, 1, color)
    }
  }
  hand((secs / 60) * Math.PI * 2, 5, '#1a1c25') // minutes
  hand((secs / 720) * Math.PI * 2, 3, '#1a1c25') // hours
  hand(secs * ((Math.PI * 2) / 60), 6, '#ff5c5c') // seconds
  px(ctx, cx, cy, 1, 1, '#1a1c25')
}

// --------------------------------------------------------------- amenities

function drawCoffeeBar(ctx: CanvasRenderingContext2D, tx: number, ty: number) {
  const x = tx * FT
  const y = ty * FT + 6
  px(ctx, x + 2, y + 8, 60, 18, '#4a3018') // counter body
  px(ctx, x + 2, y + 6, 60, 4, '#6b4a2a') // counter top
  px(ctx, x + 2, y + 6, 60, 1, '#a8763f')
  for (let i = 0; i < 5; i++) px(ctx, x + 6 + i * 12, y + 12, 10, 10, '#3a2a18') // cupboard doors
  px(ctx, x + 8, y - 4, 14, 12, '#2b3141') // the machine
  px(ctx, x + 9, y - 3, 12, 6, '#3d4459')
  px(ctx, x + 10, y - 2, 4, 3, '#ff5c5c') // its little red light
  px(ctx, x + 12, y + 3, 6, 4, '#1a1c25') // spout and cup
  px(ctx, x + 13, y + 5, 4, 3, '#e8ecf6')
  px(ctx, x + 30, y + 1, 6, 6, '#c9cddb') // cups waiting
  px(ctx, x + 38, y + 1, 6, 6, '#c9cddb')
  px(ctx, x + 46, y + 1, 6, 6, '#b5544a')
}

function drawMeetingTable(ctx: CanvasRenderingContext2D, tx: number, ty: number) {
  const x = tx * FT
  const y = ty * FT + 1
  for (const cx of [x + 12, x + 28, x + 44]) {
    px(ctx, cx, y + 1, 10, 7, '#3a4257') // chairs along both sides
    px(ctx, cx, y + 1, 10, 2, '#4f596f')
    px(ctx, cx, y + 22, 10, 7, '#3a4257')
    px(ctx, cx, y + 22, 10, 2, '#4f596f')
  }
  px(ctx, x + 6, y + 8, 52, 14, '#8a6038') // table
  px(ctx, x + 6, y + 8, 52, 2, '#a8763f')
  px(ctx, x + 6, y + 20, 52, 2, '#5c3f22')
  px(ctx, x + 16, y + 12, 10, 6, '#e8ecf6') // papers on it
  px(ctx, x + 34, y + 13, 8, 4, '#c9cddb')
  px(ctx, x + 46, y + 12, 5, 5, '#b5544a') // and somebody's mug
}

function drawGym(ctx: CanvasRenderingContext2D, tx: number, ty: number) {
  const x = tx * FT
  const y = ty * FT + 2
  // a bench and a loaded bar read as a gym at this size; a treadmill does not
  px(ctx, x + 10, y + 10, 30, 10, '#3a4257') // bench pad
  px(ctx, x + 10, y + 10, 30, 2, '#59627a')
  px(ctx, x + 12, y + 20, 4, 5, '#20242f') // bench legs
  px(ctx, x + 34, y + 20, 4, 5, '#20242f')
  px(ctx, x + 6, y + 6, 38, 3, '#8e94a8') // the bar
  px(ctx, x + 2, y + 2, 5, 11, '#12141c') // plates
  px(ctx, x + 3, y + 3, 3, 9, '#20242f')
  px(ctx, x + 43, y + 2, 5, 11, '#12141c')
  px(ctx, x + 44, y + 3, 3, 9, '#20242f')
  px(ctx, x + 52, y + 4, 10, 22, '#2b3141') // dumbbell rack
  px(ctx, x + 52, y + 4, 10, 2, '#4a5268')
  for (let i = 0; i < 3; i++) {
    px(ctx, x + 53, y + 9 + i * 6, 8, 2, '#8e94a8')
    px(ctx, x + 52, y + 8 + i * 6, 3, 4, '#12141c')
    px(ctx, x + 59, y + 8 + i * 6, 3, 4, '#12141c')
  }
}

function drawCooling(ctx: CanvasRenderingContext2D, tx: number, ty: number) {
  const x = tx * FT + 4
  const y = ty * FT + 2
  px(ctx, x, y + 6, 24, 24, '#2b3141') // the chiller
  px(ctx, x + 1, y + 7, 22, 22, '#3a4459')
  px(ctx, x + 3, y + 9, 18, 12, '#1a1c25') // grille
  for (let i = 0; i < 6; i++) px(ctx, x + 4, y + 10 + i * 2, 16, 1, '#4a5268')
  px(ctx, x + 3, y + 23, 18, 4, '#20242f')
  px(ctx, x + 5, y + 24, 6, 2, '#4aa3ff') // readout
  px(ctx, x + 8, y, 3, 6, '#4a5268') // pipes going up the wall
  px(ctx, x + 14, y, 3, 6, '#4a5268')
}

function drawTrainingRoom(ctx: CanvasRenderingContext2D, tx: number, ty: number) {
  const x = tx * FT
  const y = ty * FT + 2
  px(ctx, x + 6, y, 52, 4, '#5d6376') // screen rail
  px(ctx, x + 8, y + 3, 48, 20, '#e8ecf6') // projector screen
  px(ctx, x + 10, y + 6, 20, 3, '#4aa3ff') // a slide nobody is reading
  px(ctx, x + 10, y + 11, 32, 2, '#9aa0b4')
  px(ctx, x + 10, y + 15, 26, 2, '#9aa0b4')
  px(ctx, x + 44, y + 6, 10, 10, '#3ddc84')
  for (let i = 0; i < 4; i++) {
    px(ctx, x + 8 + i * 14, y + 26, 10, 5, '#333a4d') // a row of chairs
    px(ctx, x + 8 + i * 14, y + 26, 10, 1, '#4a5268')
  }
}

const AMENITY_ART: Record<string, { width: number; draw: (ctx: CanvasRenderingContext2D, tx: number, ty: number) => void }> = {
  coffee: { width: 2, draw: drawCoffeeBar },
  meeting: { width: 2, draw: drawMeetingTable },
  gym: { width: 2, draw: drawGym },
  cooling: { width: 1, draw: drawCooling },
  academy: { width: 2, draw: drawTrainingRoom },
}

/**
 * Everything the company has bought for the office, laid out left to right
 * along the free row at the bottom of the room. Anything that will not fit is
 * left out rather than drawn on top of a desk.
 */
export function drawAmenities(ctx: CanvasRenderingContext2D, room: RoomInfo, owned: string[]) {
  const row = room.roomRows - 2
  const pieces = owned.map((id) => AMENITY_ART[id]).filter(Boolean)
  if (pieces.length === 0) return
  const span = room.roomCols - 2 // the floor between the two side walls
  const used = pieces.reduce((sum, a) => sum + a.width, 0)
  // spread them across the back of the room rather than bunching them on the left
  const gap = Math.max(1, Math.floor((span - used) / (pieces.length + 1)))
  let col = 1 + Math.max(0, Math.floor((span - used - gap * (pieces.length + 1)) / 2)) + gap
  for (const art of pieces) {
    if (col + art.width > room.roomCols - 1) break
    art.draw(ctx, col, row)
    col += art.width + gap
  }
}

// ------------------------------------------------------------------ layout

/**
 * Furnish the empty margins either side of the desks. What fits depends on how
 * wide the room grew, so each piece is placed only when there is room for it.
 */
export function drawDecor(ctx: CanvasRenderingContext2D, room: RoomInfo) {
  const floorTop = room.startRow
  const floorBottom = room.roomRows - 3
  const leftW = room.startCol - 1
  const rightStart = room.startCol + room.gridW
  const rightW = room.roomCols - 1 - rightStart

  if (leftW >= 3) {
    drawRug(ctx, 1, floorTop, 3, 2)
    drawSofa(ctx, 1, floorTop)
    drawCoffeeTable(ctx, 2, floorTop + 1)
  } else if (leftW >= 2) {
    drawSofa(ctx, 1, floorTop)
  }
  if (leftW >= 1) drawFloorPlant(ctx, 1, floorBottom - 1)
  if (leftW >= 3) drawBoxes(ctx, leftW - 1, floorBottom - 1)

  if (rightW >= 1) drawServerRack(ctx, rightStart, floorTop)
  if (rightW >= 2) drawWhiteboard(ctx, rightStart + (rightW >= 3 ? 1 : 0), floorTop + 2)
  if (rightW >= 2) drawFilingCabinet(ctx, rightStart, floorBottom - 1)
  if (rightW >= 3) drawFloorPlant(ctx, rightStart + 2, floorBottom - 1)
}

// Nobody sits still for eight hours. Every so often a person gets up, walks to
// the cooler or whatever the company has bought, stands there a moment and
// walks back. It is all worked out from the clock and their id, so it costs
// nothing and looks the same on every machine.
const BREAK_PERIOD_MS = 52_000
const BREAK_JITTER_MS = 38_000
const BREAK_WALK_MS = 2_600
const BREAK_STAY_MS = 5_000

interface Trip {
  x: number
  y: number
  /** true while they are away from the desk, so they face the room */
  walking: boolean
}

export function tripFor(
  id: string,
  deskX: number,
  deskY: number,
  now: number,
  spots: { x: number; y: number }[],
): Trip {
  if (spots.length === 0) return { x: deskX, y: deskY, walking: false }
  const seed = hash(id)
  const period = BREAK_PERIOD_MS + (seed % BREAK_JITTER_MS)
  const t = (now + seed * 7) % period
  const round = BREAK_WALK_MS * 2 + BREAK_STAY_MS
  if (t > round) return { x: deskX, y: deskY, walking: false }
  const spot = spots[seed % spots.length]
  const ease = (k: number) => k * k * (3 - 2 * k)
  const lerp = (a: number, b: number, k: number) => Math.round(a + (b - a) * ease(k))
  if (t < BREAK_WALK_MS) {
    const k = t / BREAK_WALK_MS
    return { x: lerp(deskX, spot.x, k), y: lerp(deskY, spot.y, k), walking: true }
  }
  if (t < BREAK_WALK_MS + BREAK_STAY_MS) return { x: spot.x, y: spot.y, walking: true }
  const k = (t - BREAK_WALK_MS - BREAK_STAY_MS) / BREAK_WALK_MS
  return { x: lerp(spot.x, deskX, k), y: lerp(spot.y, deskY, k), walking: true }
}

/**
 * Somewhere for people to walk to. The water cooler is always there; the coffee
 * bar and the meeting table only once they have been paid for. Coordinates are
 * world pixels, matching where a person stands.
 */
export function breakSpots(room: RoomInfo, owned: string[]): { x: number; y: number }[] {
  const TILE = 16
  const spots = [{ x: (room.roomCols - 3) * TILE + 8, y: 2 * TILE }]
  const pieces = owned.map((id) => AMENITY_ART[id]).filter(Boolean)
  if (pieces.length > 0) {
    const span = room.roomCols - 2
    const used = pieces.reduce((sum, a) => sum + a.width, 0)
    const gap = Math.max(1, Math.floor((span - used) / (pieces.length + 1)))
    let col = 1 + Math.max(0, Math.floor((span - used - gap * (pieces.length + 1)) / 2)) + gap
    for (let i = 0; i < pieces.length; i++) {
      const art = pieces[i]
      if (col + art.width > room.roomCols - 1) break
      // stand in front of it, not on it
      if (owned[i] === 'coffee' || owned[i] === 'meeting' || owned[i] === 'gym') {
        spots.push({ x: col * TILE + art.width * 8, y: (room.roomRows - 2) * TILE })
      }
      col += art.width + gap
    }
  }
  return spots
}

/** Where the rack ended up, so its lights can be animated over the top. */
export function rackTile(room: RoomInfo): { tx: number; ty: number } | null {
  const rightStart = room.startCol + room.gridW
  if (room.roomCols - 1 - rightStart < 1) return null
  return { tx: rightStart, ty: room.startRow }
}
