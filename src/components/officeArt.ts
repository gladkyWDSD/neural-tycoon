import type { Staff } from '../game/types'

// Furniture and desk hardware for the office view.
//
// The office canvas renders at SCALE times the 16px world grid so that the
// things on a desk get enough pixels to actually read as a computer: a 2-tile
// desk is 64x32 art pixels instead of 32x16. Everything in this module works in
// those art pixels; callers pass world tile coordinates.

export const TILE = 16
export const SCALE = 2
const FT = TILE * SCALE // art pixels per world tile

// Desk layout, relative to the desk's top-left art pixel (64 wide, 32 tall):
//   rows 2..25   table surface        rows 26..31  front edge and lip
//   cols 2..13   left prop zone       cols 16..47  screen zone
//   cols 50..61  right prop zone
const SCREEN_X = 16
const SCREEN_W = 32
const LEFT_X = 2
const RIGHT_X = 50

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c
  ctx.fillRect(x, y, w, h)
}

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * amount)))
  return `#${((ch((n >> 16) & 255) << 16) | (ch((n >> 8) & 255) << 8) | ch(n & 255)).toString(16).padStart(6, '0')}`
}

// ---------------------------------------------------------------- furniture

function drawChair(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  const y = oy + FT // the chair sits on the tile below the desk, behind its occupant
  px(ctx, ox + 14, y + 2, 36, 21, '#171a23') // backrest shell
  px(ctx, ox + 16, y + 4, 32, 17, '#333a4d') // mesh pad
  px(ctx, ox + 16, y + 4, 32, 2, '#4a5268') // top highlight
  for (let r = 0; r < 4; r++) px(ctx, ox + 17, y + 8 + r * 3, 30, 1, '#2b3142') // mesh weave
  px(ctx, ox + 10, y + 12, 6, 9, '#171a23') // armrests
  px(ctx, ox + 48, y + 12, 6, 9, '#171a23')
  px(ctx, ox + 11, y + 12, 4, 1, '#3d4459') // armrest pad
  px(ctx, ox + 16, y + 21, 32, 4, '#23283a') // seat edge
  px(ctx, ox + 16, y + 21, 32, 1, '#3a4257')
  px(ctx, ox + 30, y + 25, 4, 4, '#14161d') // gas cylinder
  px(ctx, ox + 18, y + 29, 28, 2, '#14161d') // star base
  px(ctx, ox + 16, y + 30, 3, 2, '#0e1015') // casters
  px(ctx, ox + 45, y + 30, 3, 2, '#0e1015')
}

export function drawDesk(ctx: CanvasRenderingContext2D, dx: number, dy: number) {
  const ox = dx * FT
  const oy = dy * FT

  drawChair(ctx, ox, oy)

  px(ctx, ox, oy, 64, 32, '#3a2a1c') // carcass
  px(ctx, ox, oy + 2, 64, 24, '#8a6038') // table top
  px(ctx, ox, oy + 2, 64, 2, '#a87a4a') // back edge catches the ceiling light
  px(ctx, ox + 4, oy + 8, 24, 1, '#7d5530') // grain
  px(ctx, ox + 34, oy + 12, 26, 1, '#7d5530')
  px(ctx, ox + 12, oy + 18, 18, 1, '#7d5530')
  px(ctx, ox + 40, oy + 22, 16, 1, '#7d5530')
  px(ctx, ox, oy + 26, 64, 2, '#5c3f26') // front edge
  px(ctx, ox, oy + 28, 64, 2, '#6b4a2f')
  px(ctx, ox, oy + 30, 64, 2, '#2a1d13')
}

/** Corner washroom, placed by tile so it can follow the wall as the room grows. */
export function drawToilet(ctx: CanvasRenderingContext2D, dx: number, dy: number) {
  const x = dx * FT + 8
  const y = dy * FT + 16
  px(ctx, x + 3, y, 10, 9, '#aab1c4') // cistern
  px(ctx, x + 4, y + 1, 8, 6, '#e8ecf6')
  px(ctx, x + 9, y + 2, 2, 2, '#9aa0b4') // flush button
  px(ctx, x + 3, y + 9, 10, 1, '#aab1c4') // bowl
  px(ctx, x + 2, y + 10, 12, 12, '#c9cddb')
  px(ctx, x + 3, y + 10, 10, 1, '#f0f3fa') // seat rim highlight
  px(ctx, x + 5, y + 11, 6, 1, '#8fa6c8') // water
  px(ctx, x + 4, y + 12, 8, 8, '#8fa6c8')
  px(ctx, x + 5, y + 13, 6, 5, '#a8bcd8')
  px(ctx, x + 4, y + 22, 8, 2, '#1a1c25') // base shadow
}

// ------------------------------------------------------------------ screens

// Panel content gets a 26x10 art-pixel canvas inside the bezel.
type ScreenFn = (sx: number, sy: number, sw: number, sh: number) => void

function windowChrome(ctx: CanvasRenderingContext2D, sx: number, sy: number, sw: number, bar: string) {
  px(ctx, sx, sy, sw, 3, bar)
  px(ctx, sx + 2, sy + 1, 1, 1, '#ff5f57') // traffic lights
  px(ctx, sx + 4, sy + 1, 1, 1, '#febc2e')
  px(ctx, sx + 6, sy + 1, 1, 1, '#28c840')
  px(ctx, sx + 10, sy + 1, 9, 1, '#3c4456') // title
}

/** 32x16 monitor: bezel, panel, chin with brand mark and power LED, stand. */
function drawMonitor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  screen: ScreenFn,
  led = '#3ddc84',
) {
  px(ctx, x, y, SCREEN_W, 16, '#12141b') // shell
  px(ctx, x, y, SCREEN_W, 1, '#3a4155') // top bevel
  px(ctx, x, y, 1, 16, '#262c3a') // lit side
  px(ctx, x + SCREEN_W - 1, y, 1, 16, '#0a0c11') // shadowed side
  px(ctx, x + 2, y + 2, 28, 12, '#05070c') // panel well
  screen(x + 3, y + 3, 26, 10)
  px(ctx, x + 2, y + 2, 28, 1, '#000000') // inner bezel shadow
  px(ctx, x, y + 14, SCREEN_W, 2, '#171b24') // chin
  px(ctx, x + 14, y + 15, 4, 1, '#39405a') // brand mark
  px(ctx, x + 27, y + 15, 2, 1, led) // power LED
  px(ctx, x + 13, y + 16, 6, 2, '#20242f') // neck
  px(ctx, x + 8, y + 18, 16, 2, '#2e3444') // base
  px(ctx, x + 8, y + 18, 16, 1, '#3d4459')
  ctx.fillStyle = 'rgba(140,190,255,0.08)' // panel light spilling onto the desk
  ctx.fillRect(x - 2, y + 20, SCREEN_W + 4, 6)
}

const TOKENS = ['#4d8fd6', '#57a86b', '#9b7bd4', '#c08046', '#6f9cc4', '#c25f58', '#5c6478']
// each row is a list of [offset, width, token] segments inside a 22px-wide gutter-less area
const CODE_ROWS: [number, number, number][][] = [
  [[0, 3, 0], [4, 6, 1]],
  [[2, 4, 2], [7, 8, 4]],
  [[2, 5, 5], [8, 4, 0], [14, 5, 4]],
  [[4, 3, 1], [8, 7, 2]],
  [[0, 4, 0], [5, 3, 6], [9, 8, 1]],
  [[2, 6, 4]],
  [[2, 3, 3], [6, 9, 0]],
  [[0, 5, 1], [6, 4, 2], [12, 3, 6]],
]

/** An editor window: title bar, line-number gutter, scrolling code, status bar. */
function codeScreen(ctx: CanvasRenderingContext2D, now: number): ScreenFn {
  return (sx, sy, sw, sh) => {
    px(ctx, sx, sy, sw, sh, '#0d1117')
    windowChrome(ctx, sx, sy, sw, '#1b2130')
    px(ctx, sx, sy + 3, 3, 6, '#090d14') // gutter
    const scroll = Math.floor(now / 900) % CODE_ROWS.length
    px(ctx, sx + 3, sy + 8, sw - 3, 1, '#151b26') // current line
    let caret: [number, number] = [sx + 4, sy + 8]
    for (let r = 0; r < 6; r++) {
      const row = CODE_ROWS[(r + scroll) % CODE_ROWS.length]
      px(ctx, sx + 1, sy + 3 + r, 1, 1, '#39415a') // line number
      let end = 0
      for (const [off, w, t] of row) {
        px(ctx, sx + 4 + off, sy + 3 + r, w, 1, TOKENS[t])
        end = Math.max(end, off + w)
      }
      if (r === 5) caret = [sx + 5 + end, sy + 8]
    }
    if (Math.floor(now / 480) % 2 === 0) px(ctx, Math.min(caret[0], sx + sw - 1), caret[1], 1, 1, '#f4f6fb')
    px(ctx, sx, sy + sh - 1, sw, 1, '#1f4f9c') // status bar
    px(ctx, sx + 1, sy + sh - 1, 5, 1, '#7fb3ff')
    px(ctx, sx + sw - 5, sy + sh - 1, 3, 1, '#7fb3ff')
  }
}

/** A training run: loss curve dropping towards the axis, with a live head. */
function lossScreen(ctx: CanvasRenderingContext2D, now: number): ScreenFn {
  return (sx, sy, sw, sh) => {
    px(ctx, sx, sy, sw, sh, '#0b1016')
    windowChrome(ctx, sx, sy, sw, '#16202b')
    const top = sy + 4
    const bottom = sy + sh - 1
    const rows = bottom - top
    px(ctx, sx + 1, top, 1, rows + 1, '#22303f') // y axis
    px(ctx, sx + 1, bottom, sw - 2, 1, '#22303f') // x axis
    for (let gx = sx + 5; gx < sx + sw - 1; gx += 5) px(ctx, gx, top + 2, 1, 1, '#1a2431') // grid
    let headY = top
    for (let i = 0; i < sw - 3; i++) {
      const t = i / (sw - 4)
      const v = Math.exp(-t * 2.8) + 0.04 * Math.sin(t * 13 + now / 450)
      const yy = top + Math.round(Math.max(0, Math.min(1, 1 - v)) * (rows - 1))
      px(ctx, sx + 2 + i, yy + 1, 1, bottom - yy - 1, '#12402b') // area fill
      px(ctx, sx + 2 + i, yy, 1, 1, '#3ddc84') // curve
      headY = yy
    }
    px(ctx, sx + sw - 2, headY, 1, 1, Math.floor(now / 320) % 2 === 0 ? '#f4f6fb' : '#3ddc84')
  }
}

/** A campaign dashboard: bars climbing to the right under a headline number. */
function chartScreen(ctx: CanvasRenderingContext2D, now: number): ScreenFn {
  return (sx, sy, sw, sh) => {
    px(ctx, sx, sy, sw, sh, '#0f1219')
    windowChrome(ctx, sx, sy, sw, '#1a2130')
    const bottom = sy + sh - 1
    px(ctx, sx + 1, bottom, sw - 2, 1, '#26313f')
    px(ctx, sx + 1, sy + 4, 6, 1, '#8b949e') // headline label
    const base = [2, 2, 3, 4, 4, 5]
    for (let i = 0; i < 6; i++) {
      const wave = Math.sin(now / 360 + i * 0.8) > 0.4 ? 1 : 0
      const h = Math.min(bottom - sy - 4, base[i] + wave)
      const bx = sx + 2 + i * 4
      px(ctx, bx, bottom - h, 3, h, i === 5 ? '#ffd166' : '#4aa3ff')
      px(ctx, bx, bottom - h, 3, 1, i === 5 ? '#ffe6a8' : '#8fc8ff') // lit cap
    }
    px(ctx, sx + sw - 4, sy + 4, 1, 1, '#3ddc84') // trend arrow
    px(ctx, sx + sw - 5, sy + 5, 3, 1, '#3ddc84')
  }
}

/** A word processor: toolbar, white page, text lines and a typing caret. */
function documentScreen(ctx: CanvasRenderingContext2D, now: number): ScreenFn {
  return (sx, sy, sw, sh) => {
    px(ctx, sx, sy, sw, sh, '#2a3040') // app background
    px(ctx, sx, sy, sw, 2, '#1d2330') // toolbar
    px(ctx, sx + 1, sy, 2, 1, '#6e768c')
    px(ctx, sx + 4, sy, 2, 1, '#6e768c')
    px(ctx, sx + 7, sy, 2, 1, '#6e768c')
    px(ctx, sx + 3, sy + 2, sw - 6, sh - 2, '#f4f6fb') // page
    px(ctx, sx + 5, sy + 3, 8, 1, '#2c3243') // heading
    const widths = [16, 12, 15, 9]
    for (let r = 0; r < 4; r++) px(ctx, sx + 5, sy + 5 + r, widths[r], 1, '#8a90a4')
    if (Math.floor(now / 500) % 2 === 0) px(ctx, sx + 5 + widths[3] + 1, sy + 8, 1, 1, '#1a1c25')
  }
}

// ------------------------------------------------------------- desk gadgets

/** Mechanical keyboard: bevelled case, three key rows, optional RGB underglow. */
function drawKeyboard(ctx: CanvasRenderingContext2D, x: number, y: number, glow?: string) {
  const w = 30
  px(ctx, x, y, w, 4, '#161a23') // case
  px(ctx, x, y, w, 1, '#2c3243') // top bevel
  for (let i = 0; i < 10; i++) px(ctx, x + 1 + i * 3, y + 1, 2, 1, '#525a72') // number row
  for (let i = 0; i < 9; i++) px(ctx, x + 2 + i * 3, y + 2, 2, 1, '#525a72') // letter row
  px(ctx, x + 9, y + 3, 12, 1, '#525a72') // space bar
  px(ctx, x + 3, y + 3, 4, 1, '#3f4658') // modifiers
  px(ctx, x + 23, y + 3, 4, 1, '#3f4658')
  if (glow) {
    ctx.fillStyle = glow // underglow spilling onto the desk
    ctx.fillRect(x + 2, y + 4, w - 4, 1)
  }
}

function drawMouse(ctx: CanvasRenderingContext2D, x: number, y: number, wheel?: string) {
  px(ctx, x + 1, y, 4, 1, '#2c3243') // rounded top
  px(ctx, x, y + 1, 6, 7, '#161a23')
  px(ctx, x + 1, y + 1, 4, 3, '#20242f') // button shells
  px(ctx, x + 3, y + 1, 1, 3, '#0b0d13') // split
  px(ctx, x + 2, y + 2, 2, 1, wheel ?? '#525a72') // scroll wheel
  px(ctx, x, y + 8, 6, 1, '#0a0c11') // contact shadow
  px(ctx, x + 3, y - 3, 1, 3, '#20242f') // cable
}

function drawSteam(ctx: CanvasRenderingContext2D, x: number, y: number, now: number) {
  for (let i = 0; i < 4; i++) {
    const t = (now / 520 + i * 0.25) % 1
    const yy = y - Math.round(t * 9)
    const xx = x + Math.round(Math.sin(t * 6.2 + i * 1.7) * 1.6)
    ctx.fillStyle = `rgba(220,230,245,${(0.4 * (1 - t)).toFixed(2)})`
    ctx.fillRect(xx, yy, 1, 2)
  }
}

/** 8x10 mug with a rim, coffee in it and a handle you can see through. */
function drawMug(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, now: number) {
  const dark = shade(color, 0.6)
  px(ctx, x + 6, y + 3, 2, 1, dark) // handle
  px(ctx, x + 7, y + 4, 1, 3, dark)
  px(ctx, x + 6, y + 7, 2, 1, dark)
  px(ctx, x, y, 6, 10, color) // body
  px(ctx, x + 4, y + 2, 2, 8, dark) // side shading
  px(ctx, x, y + 2, 1, 8, shade(color, 1.25)) // highlight
  px(ctx, x, y, 6, 2, '#efe9da') // rim
  px(ctx, x + 1, y + 1, 4, 1, '#3f2a18') // coffee
  px(ctx, x, y + 9, 6, 1, shade(color, 0.38)) // base shadow
  drawSteam(ctx, x + 3, y - 2, now)
}

function drawPapers(ctx: CanvasRenderingContext2D, x: number, y: number, text = true) {
  px(ctx, x, y + 6, 13, 4, '#b0b7c9') // sheets underneath
  px(ctx, x + 1, y + 4, 13, 3, '#cdd3e0')
  px(ctx, x, y + 2, 13, 3, '#e2e6f0')
  px(ctx, x + 1, y, 13, 4, '#f6f8fd') // top sheet, slightly askew
  if (text) {
    px(ctx, x + 3, y + 1, 6, 1, '#5d6478')
    px(ctx, x + 3, y + 2, 9, 1, '#9aa0b4')
    px(ctx, x + 3, y + 3, 7, 1, '#9aa0b4')
  }
}

/** Mid-tower with a mesh front, drive bay, ports and a glowing RGB fan. */
function drawTower(ctx: CanvasRenderingContext2D, x: number, y: number, now: number) {
  px(ctx, x, y, 12, 24, '#0d0f15') // case
  px(ctx, x, y, 12, 1, '#2a2f3d') // top panel
  px(ctx, x, y, 1, 24, '#1c212c') // lit edge
  px(ctx, x + 1, y + 1, 10, 22, '#191d27') // front bezel
  for (let r = 0; r < 4; r++) px(ctx, x + 2, y + 2 + r * 2, 8, 1, '#0a0c12') // mesh intake
  px(ctx, x + 2, y + 10, 8, 2, '#242a36') // optical drive
  px(ctx, x + 3, y + 11, 4, 1, '#0a0c12')
  px(ctx, x + 2, y + 13, 2, 1, '#0a0c12') // usb ports
  px(ctx, x + 2, y + 15, 2, 1, '#0a0c12')
  px(ctx, x + 8, y + 13, 2, 2, '#39405a') // power button
  px(ctx, x + 8, y + 13, 2, 1, Math.floor(now / 700) % 2 === 0 ? '#3ddc84' : '#1d5c38')

  // RGB fan seen through the front, blades sweeping round the hub
  const fx = x + 2
  const fy = y + 16
  const glow = `hsl(${((now / 30) % 360).toFixed(0)}, 65%, 46%)`
  px(ctx, fx, fy, 7, 7, '#0a0c12') // fan cutout
  px(ctx, fx + 2, fy, 3, 1, glow) // ring
  px(ctx, fx + 2, fy + 6, 3, 1, glow)
  px(ctx, fx + 1, fy + 1, 1, 1, glow)
  px(ctx, fx + 5, fy + 1, 1, 1, glow)
  px(ctx, fx + 1, fy + 5, 1, 1, glow)
  px(ctx, fx + 5, fy + 5, 1, 1, glow)
  px(ctx, fx, fy + 2, 1, 3, glow)
  px(ctx, fx + 6, fy + 2, 1, 3, glow)
  const blades: [number, number][][] = [
    [[2, 2], [4, 4]],
    [[4, 2], [2, 4]],
    [[2, 3], [4, 3]],
    [[3, 2], [3, 4]],
  ]
  for (const [bx, by] of blades[Math.floor(now / 90) % 4]) px(ctx, fx + bx, fy + by, 1, 1, glow)
  px(ctx, fx + 3, fy + 3, 1, 1, '#39405a') // hub
}

/** Open laptop: lid with a webcam, hinge, palm rest with keys and a trackpad. */
function drawLaptop(ctx: CanvasRenderingContext2D, x: number, y: number, screen: ScreenFn) {
  px(ctx, x, y, SCREEN_W, 16, '#565e75') // lid
  px(ctx, x, y, SCREEN_W, 1, '#7c8499')
  px(ctx, x + 2, y + 2, 28, 12, '#05070c') // panel
  screen(x + 3, y + 3, 26, 10)
  px(ctx, x + 15, y + 1, 1, 1, '#0a0c11') // webcam
  px(ctx, x + 13, y + 14, 6, 1, '#3f465a') // brand strip
  px(ctx, x - 2, y + 16, SCREEN_W + 4, 2, '#3f465a') // hinge
  px(ctx, x - 2, y + 18, SCREEN_W + 4, 5, '#565e75') // palm rest
  px(ctx, x + 1, y + 18, SCREEN_W - 2, 3, '#2c3243') // keyboard well
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < 9; i++) px(ctx, x + 2 + i * 3 + r, y + 18 + r, 2, 1, '#7c8499')
  }
  px(ctx, x + 12, y + 21, 8, 2, '#454d64') // trackpad
  px(ctx, x - 2, y + 23, SCREEN_W + 4, 1, '#2c3243') // front lip shadow
  ctx.fillStyle = 'rgba(140,190,255,0.08)'
  ctx.fillRect(x - 2, y + 24, SCREEN_W + 4, 2)
}

function drawPhone(ctx: CanvasRenderingContext2D, x: number, y: number, now: number) {
  px(ctx, x, y, 7, 12, '#0b0d13') // body
  px(ctx, x, y, 7, 1, '#2c3243') // top bevel
  px(ctx, x + 1, y + 2, 5, 8, '#141c2c') // screen
  const lit = Math.floor(now / 1500) % 3 !== 0
  if (lit) {
    px(ctx, x + 1, y + 2, 5, 8, '#2f6fd0')
    px(ctx, x + 2, y + 3, 3, 1, '#9fd0ff') // notification banner
    px(ctx, x + 2, y + 5, 2, 1, '#9fd0ff')
    px(ctx, x + 5, y + 2, 1, 1, '#ff5c5c') // unread badge
  }
  px(ctx, x + 2, y + 10, 3, 1, '#2c3243') // home bar
}

function drawPenHolder(ctx: CanvasRenderingContext2D, x: number, y: number) {
  px(ctx, x + 2, y, 1, 7, '#4aa3ff') // pens
  px(ctx, x + 4, y + 2, 1, 5, '#ff5c5c')
  px(ctx, x + 6, y + 1, 1, 6, '#3ddc84')
  px(ctx, x + 3, y + 1, 1, 1, '#e0e4f0') // pen caps
  px(ctx, x + 5, y + 3, 1, 1, '#e0e4f0')
  px(ctx, x + 1, y + 6, 8, 7, '#3a3f52') // cup
  px(ctx, x + 1, y + 6, 8, 1, '#4a5066')
  px(ctx, x + 1, y + 12, 8, 1, '#23273a')
}

function drawStickyNotes(ctx: CanvasRenderingContext2D, x: number, y: number) {
  px(ctx, x, y, 6, 6, '#ffd166')
  px(ctx, x + 1, y + 2, 4, 1, '#b8934a')
  px(ctx, x + 1, y + 4, 3, 1, '#b8934a')
  px(ctx, x + 6, y + 2, 6, 6, '#f28cb8')
  px(ctx, x + 7, y + 4, 4, 1, '#b0637f')
  px(ctx, x + 7, y + 6, 3, 1, '#b0637f')
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number) {
  px(ctx, x + 4, y, 1, 5, '#2f7d4f') // stems
  px(ctx, x + 2, y + 2, 1, 4, '#2f7d4f')
  px(ctx, x + 6, y + 2, 1, 4, '#2f7d4f')
  px(ctx, x + 3, y, 3, 2, '#3ddc84') // leaves
  px(ctx, x + 1, y + 2, 2, 2, '#35b872')
  px(ctx, x + 6, y + 2, 2, 2, '#35b872')
  px(ctx, x + 2, y + 4, 5, 2, '#2f9c60')
  px(ctx, x + 1, y + 6, 7, 6, '#a1543a') // terracotta pot
  px(ctx, x + 1, y + 6, 7, 1, '#c26a4a')
  px(ctx, x + 2, y + 11, 5, 1, '#6f3826')
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = 'rgba(255,209,102,0.09)' // pool of light on the desk
  ctx.fillRect(x - 12, y + 8, 24, 16)
  px(ctx, x + 2, y + 14, 3, 9, '#3a3f52') // stem
  px(ctx, x + 1, y + 8, 5, 6, '#3a3f52') // elbow
  px(ctx, x, y + 22, 10, 2, '#3a3f52') // base
  px(ctx, x + 1, y + 22, 8, 1, '#4a5066')
  px(ctx, x + 3, y + 1, 6, 2, '#c9a03a') // shade
  px(ctx, x + 2, y + 3, 8, 2, '#e0b44a')
  px(ctx, x + 1, y + 5, 10, 2, '#c9a03a')
  px(ctx, x + 2, y + 1, 6, 1, '#ffd166')
  px(ctx, x + 3, y + 7, 6, 1, 'rgba(255,229,150,0.75)') // bulb
}

// ---------------------------------------------------------------- desk sets

export function drawDeskProp(
  ctx: CanvasRenderingContext2D,
  dx: number,
  dy: number,
  role: Staff['role'],
  now: number,
) {
  const ox = dx * FT
  const oy = dy * FT
  const sx = ox + SCREEN_X
  const lx = ox + LEFT_X
  const rx = ox + RIGHT_X

  if (role === 'engineer') {
    // tower, code monitor, backlit board and a wired mouse
    drawTower(ctx, lx, oy + 2, now)
    drawMonitor(ctx, sx, oy + 2, codeScreen(ctx, now), '#4aa3ff')
    drawKeyboard(ctx, sx + 1, oy + 22, 'rgba(192,132,252,0.35)')
    drawMug(ctx, rx + 1, oy + 3, '#4a7fb5', now)
    drawMouse(ctx, rx + 2, oy + 17, '#c084fc')
    return
  }

  if (role === 'researcher') {
    // notes and a live training curve, plus the obligatory cold coffee
    drawPenHolder(ctx, lx, oy + 2)
    drawPapers(ctx, lx, oy + 16)
    drawMonitor(ctx, sx, oy + 2, lossScreen(ctx, now), '#3ddc84')
    drawKeyboard(ctx, sx + 1, oy + 22)
    drawMug(ctx, rx + 1, oy + 3, '#c9cddb', now)
    drawStickyNotes(ctx, rx, oy + 17)
    return
  }

  if (role === 'marketer') {
    // laptop running the campaign dashboard, phone always face up
    drawPhone(ctx, lx + 2, oy + 4, now)
    drawStickyNotes(ctx, lx, oy + 18)
    drawLaptop(ctx, sx, oy + 2, chartScreen(ctx, now))
    drawMug(ctx, rx + 1, oy + 3, '#b5544a', now)
    drawPlant(ctx, rx + 1, oy + 14)
    return
  }

  // lawyer: paperwork either side of a document on screen, under a desk lamp
  drawPapers(ctx, lx, oy + 3)
  drawPapers(ctx, lx, oy + 15, false)
  drawMonitor(ctx, sx, oy + 2, documentScreen(ctx, now), '#ffd166')
  drawKeyboard(ctx, sx + 1, oy + 22)
  drawLamp(ctx, rx, oy + 2)
}

// ------------------------------------------------------- flying work tokens

/**
 * The things that fly from a worker's desk to the progress bar. They are drawn
 * in art pixels like the desk hardware, so a brain can have folds and a chip
 * can have pins instead of being a five-pixel blob.
 */
export type WorkKind = 'research' | 'training' | 'marketing'

function blit(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  rows: string[],
  palette: Record<string, string>,
) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    let c = 0
    while (c < row.length) {
      const ch = row[c]
      const color = palette[ch]
      if (!color) {
        c++
        continue
      }
      // runs of one colour go out as a single rect
      let end = c + 1
      while (end < row.length && row[end] === ch) end++
      px(ctx, ox + c, oy + r, end - c, 1, color)
      c = end
    }
  }
}

// A brain: a lobed outline with a dividing fissure and sulci that wander, drawn
// pixel by pixel because straight rows of dashes read as a ball of wool.
const BRAIN_W = 17
const BRAIN_H = 14

function inBrain(x: number, y: number): boolean {
  const dx = (x - 8) / 8.2
  const dy = (y - 6.5) / 6.6
  return dx * dx + dy * dy <= 1
}

function paintBrain(ctx: CanvasRenderingContext2D) {
  for (let y = 0; y < BRAIN_H; y++) {
    for (let x = 0; x < BRAIN_W; x++) {
      if (!inBrain(x, y)) continue
      const edge =
        !inBrain(x - 1, y) || !inBrain(x + 1, y) || !inBrain(x, y - 1) || !inBrain(x, y + 1)
      if (edge) {
        px(ctx, x, y, 1, 1, '#5c1f3e')
        continue
      }
      let color = '#f28cb8'
      if (x + y < 8) color = '#ffc9e2' // light falls on the top left
      if (x + y > 20) color = '#dd7aa6' // and the underside falls away
      // sulci: thin lines that wander rather than run straight across
      const groove = Math.sin(y * 1.5 + Math.sin((x - 8) * 0.5) * 2.1)
      if (Math.abs(groove) < 0.26) color = '#b8447a'
      // the fissure between the hemispheres
      if (x === 8 && y > 1 && y < BRAIN_H - 2) color = '#8f2f5c'
      px(ctx, x, y, 1, 1, color)
    }
  }
  // a couple of bumps so the top is a brain rather than an egg
  px(ctx, 4, 1, 3, 1, '#5c1f3e')
  px(ctx, 10, 1, 3, 1, '#5c1f3e')
  px(ctx, 5, 2, 2, 1, '#ffc9e2')
  px(ctx, 11, 2, 2, 1, '#f9a8c9')
}

// A chip: gold pins down both sides, a board, traces, and a core that glows.
const CHIP = [
  '..oooooooooooo..',
  '..oCCCCCCCCCCo..',
  '..oCttttttttCo..',
  '..oCtCCCCCCtCo..',
  'ppoCtCggggCtCopp',
  '..oCtCgTTgCtCo..',
  'ppoCtCgTTgCtCopp',
  '..oCtCggggCtCo..',
  'ppoCtCCCCCCtCopp',
  '..oCttttttttCo..',
  'ppoCCCCCCCCCCopp',
  '..oCCCCCCCCCCo..',
  '..oooooooooooo..',
]

const CHIP_PALETTE: Record<string, string> = {
  o: '#0d1420',
  C: '#1f4260',
  t: '#2f6f9e',
  g: '#4aa3ff',
  T: '#bfe6ff',
  p: '#d8a13a',
}

// The dollar sign stamped on the coin, as [x, y, w, h] runs.
const COIN_MARK: [number, number, number, number][] = [
  [7, 3, 1, 1],
  [6, 4, 3, 1],
  [6, 5, 1, 1],
  [6, 6, 3, 1],
  [8, 7, 1, 1],
  [6, 8, 3, 1],
  [7, 9, 1, 1],
]

function paintCoin(ctx: CanvasRenderingContext2D) {
  const cx = 6.5
  const cy = 6.5
  for (let y = 0; y < 14; y++) {
    for (let x = 0; x < 14; x++) {
      const d = Math.hypot(x - cx, y - cy)
      if (d > 6.8) continue
      // rim, then the struck face, lit from the top left
      let color = '#6b4a12'
      if (d < 5.9) color = '#b8862b'
      if (d < 4.9) color = x + y < 11 ? '#ffe6a3' : x + y > 16 ? '#d9a63c' : '#ffd166'
      px(ctx, x, y, 1, 1, color)
    }
  }
  for (const [x, y, w, h] of COIN_MARK) px(ctx, x, y, w, h, '#7a5510')
  px(ctx, 3, 2, 2, 1, '#fff6d6') // specular glint
  px(ctx, 2, 3, 1, 1, '#fff6d6')
}

interface Sprite {
  canvas: HTMLCanvasElement
  w: number
  h: number
}

const spriteCache = new Map<WorkKind, Sprite>()

function sprite(kind: WorkKind): Sprite {
  const cached = spriteCache.get(kind)
  if (cached) return cached
  const w = kind === 'research' ? BRAIN_W : kind === 'marketing' ? 14 : 16
  const h = kind === 'research' ? BRAIN_H : kind === 'training' ? 13 : 14
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const c = canvas.getContext('2d')
  if (c) {
    c.imageSmoothingEnabled = false
    if (kind === 'research') paintBrain(c)
    else if (kind === 'training') {
      blit(c, 0, 0, CHIP, CHIP_PALETTE)
      px(c, 4, 2, 1, 1, '#d8a13a') // the orientation dot every chip carries
    }
    else paintCoin(c)
  }
  const made = { canvas, w, h }
  spriteCache.set(kind, made)
  return made
}

/** The same art, held still: used to label the progress bar it feeds. */
export function drawWorkIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  kind: WorkKind,
) {
  const s = sprite(kind)
  ctx.drawImage(s.canvas, Math.round(cx - s.w / 2), Math.round(cy - s.h / 2))
}

/**
 * Draw one token centred on an art-pixel position. `seed` keeps two tokens of
 * the same kind from animating in lockstep.
 */
export function drawWorkToken(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  kind: WorkKind,
  now: number,
  seed: number,
) {
  const s = sprite(kind)
  const phase = now / 1000 + seed
  const x = Math.round(cx - s.w / 2)
  const y = Math.round(cy - s.h / 2 + Math.sin(phase * 5) * 1.5)

  if (kind === 'marketing') {
    // a coin tumbling edge over edge: the face narrows, then comes back
    const turn = Math.cos(phase * 7)
    const w = Math.max(2, Math.round(s.w * Math.abs(turn)))
    const dx = Math.round(cx - w / 2)
    if (w <= 3) {
      px(ctx, dx, y + 1, w, s.h - 2, '#b8862b') // seen edge on
      px(ctx, dx, y + 1, w, 1, '#ffe6a3')
    } else {
      ctx.drawImage(s.canvas, dx, y, w, s.h)
    }
    return
  }

  ctx.drawImage(s.canvas, x, y)

  if (kind === 'research') {
    // a thought fires across the folds every so often
    const spark = (Math.sin(phase * 9) + 1) / 2
    if (spark > 0.72) {
      ctx.globalAlpha *= (spark - 0.72) / 0.28
      px(ctx, x + 5, y + 4, 2, 1, '#ffffff')
      px(ctx, x + 9, y + 8, 2, 1, '#ffffff')
      px(ctx, x + 6, y + 10, 1, 1, '#ffe4f2')
      ctx.globalAlpha /= Math.max(0.001, (spark - 0.72) / 0.28)
    }
    return
  }

  // the chip's core pulses and a read line sweeps down its traces
  const pulse = (Math.sin(phase * 8) + 1) / 2
  if (pulse > 0.45) px(ctx, x + 7, y + 5, 2, 2, '#eaf7ff')
  // a read sweeps down the traces on either side of the die
  const line = 2 + Math.floor(((phase * 5) % 1) * 8)
  px(ctx, x + 4, y + line, 1, 1, '#dff2ff')
  px(ctx, x + 11, y + line, 1, 1, '#dff2ff')
}

/** The pop where a token lands on the bar: a ring with four rays. */
export function drawBurst(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  life: number,
  color: string,
) {
  const k = Math.max(0, Math.min(1, life))
  const r = Math.round(2 + k * 7)
  const x = Math.round(cx)
  const y = Math.round(cy)
  ctx.globalAlpha = 1 - k
  px(ctx, x - r, y, r * 2 + 1, 1, color) // rays
  px(ctx, x, y - r, 1, r * 2 + 1, color)
  const d = Math.round(r * 0.7)
  px(ctx, x - d, y - d, 1, 1, color)
  px(ctx, x + d, y - d, 1, 1, color)
  px(ctx, x - d, y + d, 1, 1, color)
  px(ctx, x + d, y + d, 1, 1, color)
  const core = k < 0.4 ? 2 : 1
  px(ctx, x - core, y - core, core * 2, core * 2, '#ffffff')
  ctx.globalAlpha = 1
}
