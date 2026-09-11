import type { Staff } from '../game/types'

const SKIN_TONES = ['#e8b98a', '#d69a6b', '#c98a5a', '#a96f4a', '#8d5a3a']
const HAIR_COLORS = ['#2a2019', '#4a3626', '#14100c', '#6b4a2f', '#8a6038']
const SHIRT_COLORS = ['#4aa3ff', '#3ddc84', '#ffd166', '#ff5c5c', '#c084fc', '#f28cb8']

export function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

const BOB_PERIOD = 900 // ms per up/down step
const BLINK_PERIOD = 3200 // ms between blinks
const BLINK_DURATION = 120 // ms eyes stay shut
const TYPE_FRAME_MS = 160 // hands alternate this fast while working
const WALK_FRAME_MS = 180
const ACTION_LENGTH = 1100 // ms an idle action (stretch, coffee, ...) stays on screen

// sprites are 12x16 grids of palette keys; '.' is transparent
export const SPRITE_W = 12
export const SPRITE_H = 16

export type Grid = string[][]

function blankGrid(): Grid {
  return Array.from({ length: SPRITE_H }, () => Array<string>(SPRITE_W).fill('.'))
}

function put(g: Grid, x: number, y: number, ch: string) {
  if (y < 0 || y >= SPRITE_H || x < 0 || x >= SPRITE_W) return
  g[y][x] = ch
}

function box(g: Grid, x: number, y: number, w: number, h: number, ch: string) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) put(g, xx, yy, ch)
}


function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * amount)))
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * amount)))
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * amount)))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

const PANTS_COLORS = ['#2a2d3a', '#3b3f5c', '#4a3626', '#1e2a3a', '#5a4a6a']
type HairStyle = 'short' | 'long' | 'spiky' | 'bun' | 'buzz'
const HAIR_STYLES: HairStyle[] = ['short', 'long', 'spiky', 'bun', 'buzz']

export interface Look {
  hairStyle: HairStyle
  beard: boolean
  palette: Record<string, string>
}

export function lookFor(staff: Staff): Look {
  const h = hash(staff.id)
  const skin = SKIN_TONES[h % SKIN_TONES.length]
  const hair = HAIR_COLORS[(h >>> 3) % HAIR_COLORS.length]
  // lawyers always wear a dark suit — everyone else picks a shirt colour
  const shirt = staff.role === 'lawyer' ? '#2f3550' : SHIRT_COLORS[(h >>> 6) % SHIRT_COLORS.length]
  const pants = PANTS_COLORS[(h >>> 9) % PANTS_COLORS.length]
  return {
    hairStyle: HAIR_STYLES[(h >>> 12) % HAIR_STYLES.length],
    beard: (h >>> 15) % 5 === 0,
    palette: {
      H: hair,
      I: shade(hair, 0.7), // hair shadow
      S: skin,
      N: shade(skin, 0.8), // neck / under the chin
      E: '#1a1c25',
      M: shade(skin, 0.6), // mouth
      C: shirt,
      D: shade(shirt, 0.72), // shirt fold / shade
      P: pants,
      B: '#14151c', // shoes
      W: '#f4f6fb', // white: coat, collar, paper
      A: '#3ddc84', // accent: headphones, badge
      T: '#d64550', // tie
      K: '#1a1c25', // sunglasses / phone body
      G: '#e8e2d0', // mug
      O: '#0b0c11', // glasses frame
      L: '#ffd166', // light bulb
      R: '#4aa3ff', // phone screen glow
      n: shade(skin, 0.86), // nose
      e: shade(skin, 1.1), // the white of an eye
    },
  }
}

export type Action = 'none' | 'stretch' | 'coffee' | 'look' | 'phone' | 'idea' | 'read'

export interface Pose {
  bob: number // 0 or 1 px lift
  blink: boolean
  typing: number | null // 0/1 frame while working, null when not
  walk: number | null // 0/1 frame while walking
  action: Action
  actionT: number // 0..1 progress through the action
}

export function buildSprite(staff: Staff, look: Look, pose: Pose): Grid {
  const g = blankGrid()
  const lift = pose.bob

  // --- legs (drawn first so the torso overlaps them) ---
  const legShift = pose.walk === null ? 0 : pose.walk === 0 ? 1 : 0
  const legShiftR = pose.walk === null ? 0 : pose.walk === 1 ? 1 : 0
  box(g, 3, 11, 6, 1, 'P') // hips
  box(g, 3, 12 - legShift, 2, 2, 'P')
  box(g, 7, 12 - legShiftR, 2, 2, 'P')
  box(g, 3, 14 - legShift, 2, 1, 'B')
  box(g, 7, 14 - legShiftR, 2, 1, 'B')

  // --- torso ---
  const ty = 7 - lift
  box(g, 2, ty, 8, 1, 'C') // shoulders
  box(g, 1, ty + 1, 10, 3, 'C')
  box(g, 4, ty + 3, 4, 1, 'D') // fold at the waist
  put(g, 1, ty + 1, 'D') // arm shading
  put(g, 10, ty + 1, 'D')

  // --- arms & hands ---
  const leftHand = { x: 1, y: ty + 3 }
  const rightHand = { x: 10, y: ty + 3 }
  if (pose.typing !== null) {
    // hands hover over the keyboard, alternating
    leftHand.y = ty + 2 - (pose.typing === 0 ? 1 : 0)
    rightHand.y = ty + 2 - (pose.typing === 1 ? 1 : 0)
  }
  if (pose.action === 'stretch') {
    // both arms straight up
    box(g, 1, ty - 4, 1, 5, 'C')
    box(g, 10, ty - 4, 1, 5, 'C')
    leftHand.y = ty - 5
    rightHand.y = ty - 5
  } else if (pose.action === 'coffee') {
    // right hand raises a mug to the face, the sip is the mug tilting up a pixel
    const sip = pose.actionT > 0.35 && pose.actionT < 0.7 ? 1 : 0
    box(g, 10, ty - 1, 1, 4, 'C')
    rightHand.y = ty - 1 - sip
    box(g, 9, ty - 3 - sip, 2, 2, 'G')
    put(g, 11, ty - 3 - sip, 'G') // handle
  } else if (pose.action === 'phone') {
    box(g, 10, ty - 1, 1, 4, 'C')
    rightHand.y = ty - 1
    box(g, 9, ty - 4, 2, 3, 'K')
    put(g, 9, ty - 3, 'R')
  } else if (pose.action === 'read') {
    // a sheet of paper held in front of the chest, flipping between two pages
    const flip = Math.floor(pose.actionT * 4) % 2
    box(g, 3 + flip, ty + 1, 5, 3, 'W')
    put(g, 4 + flip, ty + 2, 'K')
    put(g, 6 + flip, ty + 2, 'K')
    leftHand.y = ty + 2
    rightHand.y = ty + 2
  }
  put(g, leftHand.x, leftHand.y, 'S')
  put(g, rightHand.x, rightHand.y, 'S')

  // --- role outfits ---
  if (staff.role === 'researcher') {
    // open lab coat over the shirt
    box(g, 1, ty + 1, 2, 3, 'W')
    box(g, 9, ty + 1, 2, 3, 'W')
    put(g, 2, ty, 'W')
    put(g, 9, ty, 'W')
  } else if (staff.role === 'engineer') {
    // hoodie strings + a headphone band comes later with the head
    put(g, 5, ty + 1, 'W')
    put(g, 6, ty + 1, 'W')
    put(g, 5, ty + 2, 'W')
    put(g, 6, ty + 2, 'W')
  } else if (staff.role === 'hardware') {
    // a bench coat over the shirt, with a pen in the top pocket
    box(g, 1, ty + 1, 2, 3, 'G')
    box(g, 9, ty + 1, 2, 3, 'G')
    put(g, 2, ty, 'G')
    put(g, 9, ty, 'G')
    put(g, 8, ty + 2, 'A')
  } else if (staff.role === 'marketer') {
    // lanyard and badge
    put(g, 5, ty + 1, 'W')
    put(g, 6, ty + 1, 'W')
    box(g, 5, ty + 2, 2, 2, 'A')
  } else if (staff.role === 'lawyer') {
    // white collar and a tie
    put(g, 4, ty, 'W')
    put(g, 7, ty, 'W')
    box(g, 5, ty, 2, 1, 'W')
    box(g, 5, ty + 1, 2, 3, 'T')
  }
  // hands drawn again over outfits so sleeves never cover them
  put(g, leftHand.x, leftHand.y, 'S')
  put(g, rightHand.x, rightHand.y, 'S')

  // --- head ---
  const hy = 1 - lift
  box(g, 3, hy + 1, 6, 5, 'S') // face
  box(g, 4, hy + 6, 4, 1, 'N') // chin / neck shadow
  const eyeShift = pose.action === 'look' ? (pose.actionT < 0.5 ? 1 : -1) : 0
  if (pose.blink) {
    put(g, 4 + eyeShift, hy + 3, 'N')
    put(g, 7 + eyeShift, hy + 3, 'N')
  } else {
    put(g, 4 + eyeShift, hy + 3, 'E')
    put(g, 7 + eyeShift, hy + 3, 'E')
  }
  put(g, 5, hy + 4, 'n') // the bridge of the nose
  put(g, 5, hy + 5, 'M')
  put(g, 6, hy + 5, 'M')
  if (look.beard) {
    box(g, 3, hy + 4, 1, 2, 'H')
    box(g, 8, hy + 4, 1, 2, 'H')
    box(g, 4, hy + 6, 4, 1, 'H')
  }

  // --- hair ---
  switch (look.hairStyle) {
    case 'short':
      box(g, 4, hy, 4, 1, 'H')
      box(g, 3, hy + 1, 6, 1, 'H')
      put(g, 3, hy + 2, 'I')
      put(g, 8, hy + 2, 'I')
      break
    case 'long':
      box(g, 4, hy, 4, 1, 'H')
      box(g, 3, hy + 1, 6, 1, 'H')
      box(g, 2, hy + 2, 1, 5, 'H')
      box(g, 9, hy + 2, 1, 5, 'H')
      put(g, 3, hy + 2, 'I')
      put(g, 8, hy + 2, 'I')
      break
    case 'spiky':
      put(g, 3, hy, 'H')
      put(g, 5, hy - 1, 'H')
      put(g, 7, hy - 1, 'H')
      put(g, 8, hy, 'H')
      box(g, 3, hy + 1, 6, 1, 'H')
      box(g, 4, hy, 4, 1, 'H')
      break
    case 'bun':
      box(g, 4, hy, 4, 1, 'H')
      box(g, 3, hy + 1, 6, 1, 'H')
      box(g, 9, hy, 2, 2, 'H')
      put(g, 3, hy + 2, 'I')
      put(g, 8, hy + 2, 'I')
      break
    case 'buzz':
      box(g, 4, hy, 4, 1, 'I')
      box(g, 3, hy + 1, 6, 1, 'I')
      break
  }

  // --- role headgear & eyewear (over the hair) ---
  if (staff.role === 'researcher') {
    // round glasses with a bridge
    put(g, 3, hy + 3, 'O')
    put(g, 5, hy + 3, 'O')
    put(g, 6, hy + 3, 'O')
    put(g, 8, hy + 3, 'O')
  } else if (staff.role === 'engineer') {
    // headphones: band over the top, cups on the ears
    box(g, 3, hy, 6, 1, 'A')
    put(g, 2, hy + 1, 'A')
    put(g, 9, hy + 1, 'A')
    box(g, 2, hy + 2, 1, 2, 'K')
    box(g, 9, hy + 2, 1, 2, 'K')
  } else if (staff.role === 'marketer') {
    // sunglasses
    box(g, 3, hy + 3, 6, 1, 'K')
  } else if (staff.role === 'hardware') {
    // a loupe pushed up on the forehead
    box(g, 4, hy + 1, 4, 1, 'K')
    put(g, 5, hy + 1, 'R')
  }

  // --- a light bulb goes on when a researcher gets an idea ---
  if (pose.action === 'idea') {
    const on = Math.floor(pose.actionT * 6) % 2 === 0
    const ly = hy - 5
    box(g, 5, ly, 2, 2, on ? 'L' : 'G')
    put(g, 4, ly + 1, on ? 'L' : 'G')
    put(g, 7, ly + 1, on ? 'L' : 'G')
    box(g, 5, ly + 2, 2, 1, 'K')
  }

  return g
}

function idleActionFor(staff: Staff, phase: number, now: number): { action: Action; t: number } {
  // every 9-14s (staggered per person) a short idle action plays
  const cycle = 9000 + (phase % 5000)
  const t = (now + phase * 7) % cycle
  if (t > ACTION_LENGTH) return { action: 'none', t: 0 }
  const pick = Math.floor((now + phase * 7) / cycle) % 3
  let actions: Action[]
  switch (staff.role) {
    case 'researcher':
      actions = ['idea', 'coffee', 'stretch']
      break
    case 'engineer':
      actions = ['stretch', 'coffee', 'look']
      break
    case 'marketer':
      actions = ['phone', 'coffee', 'look']
      break
    default:
      actions = ['read', 'coffee', 'look']
  }
  return { action: actions[pick], t: t / ACTION_LENGTH }
}

const OUTLINE = '#0a0b10'

/**
 * Paint a sprite at twice its grid resolution, with a light on it.
 *
 * Every cell becomes four art pixels, and each of those four is lit or shaded
 * by what is next to it: an edge with nothing above catches the light, an edge
 * with nothing below falls into shadow, and the whole silhouette gets a dark
 * outline so a person reads against the floor instead of melting into it. Eyes
 * and mouths are drawn at the finer resolution, which is what a face needs.
 *
 * `ox`/`oy` are in art pixels, so the caller works in the same space the desks
 * are drawn in.
 */
function paintLit(
  ctx: CanvasRenderingContext2D,
  g: Grid,
  ox: number,
  oy: number,
  palette: Record<string, string>,
) {
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H ? '.' : g[y][x])
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c
    ctx.fillRect(ox + x, oy + y, w, h)
  }

  for (let y = 0; y < SPRITE_H; y++) {
    for (let x = 0; x < SPRITE_W; x++) {
      const ch = at(x, y)
      if (ch === '.') continue
      const base = palette[ch] ?? '#ff00ff'
      const X = x * 2
      const Y = y * 2

      // features are drawn whole and small, so a face keeps its shape
      if (ch === 'E') {
        px(X, Y, 2, 2, palette.e ?? base)
        px(X, Y + 1, 1, 1, base)
        px(X + 1, Y, 1, 1, '#f8fafd')
        continue
      }
      if (ch === 'n') {
        px(X, Y, 2, 2, palette.S ?? base)
        px(X + 1, Y + 1, 1, 1, base)
        continue
      }
      if (ch === 'M') {
        px(X, Y, 2, 2, palette.S ?? base)
        px(X, Y, 2, 1, base)
        continue
      }
      // eyewear is a rim and a glint, not a band of black across the face
      if (ch === 'O') {
        px(X, Y, 2, 2, palette.S ?? base)
        px(X, Y, 2, 1, base)
        px(X, Y + 1, 1, 1, base)
        continue
      }
      if (ch === 'K' && at(x, y - 1) !== '.' && (at(x - 1, y) === 'K' || at(x + 1, y) === 'K')) {
        px(X, Y, 2, 2, base)
        px(X, Y, 2, 1, shade(base, 1.9))
        px(X, Y + 1, 1, 1, shade(base, 1.4))
        continue
      }

      // Everything else is painted as four quarter-pixels. A quarter with
      // nothing above or beside it is an outside corner and gets rounded away,
      // which is what turns a stack of squares into a shoulder or a skull.
      for (let qy = 0; qy < 2; qy++) {
        for (let qx = 0; qx < 2; qx++) {
          const sideEmpty = at(qx === 0 ? x - 1 : x + 1, y) === '.'
          const endEmpty = at(x, qy === 0 ? y - 1 : y + 1) === '.'
          const diagEmpty = at(qx === 0 ? x - 1 : x + 1, qy === 0 ? y - 1 : y + 1) === '.'
          if (sideEmpty && endEmpty && diagEmpty) continue // rounded corner
          let colour = base
          if ((qy === 0 && endEmpty) || (qx === 0 && sideEmpty)) colour = shade(base, 1.3)
          if ((qy === 1 && endEmpty) || (qx === 1 && sideEmpty)) colour = shade(base, 0.66)
          px(X + qx, Y + qy, 1, 1, colour)
          // the outline hugs whatever was actually painted
          if (endEmpty) px(X + qx, Y + qy + (qy === 0 ? -1 : 1), 1, 1, OUTLINE)
          if (sideEmpty) px(X + qx + (qx === 0 ? -1 : 1), Y + qy, 1, 1, OUTLINE)
        }
      }
    }
  }
}

// Painting a lit sprite costs a few hundred rectangles, and an office holds
// twenty-four people at sixty frames a second. Each distinct pose is rasterised
// once into its own little canvas and then blitted, so the cost is paid on the
// frame a pose first appears and never again.
const SPRITE_PAD = 1
const CACHE_W = SPRITE_W * 2 + SPRITE_PAD * 2
const CACHE_H = SPRITE_H * 2 + SPRITE_PAD * 2
const CACHE_LIMIT = 800
const spriteCache = new Map<string, HTMLCanvasElement>()

function cachedSprite(key: string, g: Grid, palette: Record<string, string>): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  const hit = spriteCache.get(key)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = CACHE_W
  canvas.height = CACHE_H
  const c = canvas.getContext('2d')
  if (!c) return null
  c.imageSmoothingEnabled = false
  paintLit(c, g, SPRITE_PAD, SPRITE_PAD, palette)
  if (spriteCache.size >= CACHE_LIMIT) spriteCache.clear()
  spriteCache.set(key, canvas)
  return canvas
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  staff: Staff,
  x: number,
  y: number,
  now: number,
  working: boolean,
  walking: boolean,
) {
  const look = lookFor(staff)
  const phase = hash(staff.id) % 1000

  // idle bob: hop up one pixel on a staggered cycle so staff don't move in sync
  const bobT = (now + phase) % BOB_PERIOD
  const bob = bobT < BOB_PERIOD / 2 ? 0 : 1
  const blink = (now + phase * 3) % BLINK_PERIOD < BLINK_DURATION
  const idle = walking ? { action: 'none' as Action, t: 0 } : idleActionFor(staff, phase, now)
  // an idle action interrupts typing; lawyers have nothing to type
  const typing = working && idle.action === 'none' && !walking ? Math.floor(now / TYPE_FRAME_MS) % 2 : null
  const walk = walking ? Math.floor((now + phase) / WALK_FRAME_MS) % 2 : null

  const g = buildSprite(staff, look, { bob, blink, typing, walk, action: idle.action, actionT: idle.t })

  // The shadow stays on the floor while the body hops, and it is drawn in art
  // pixels like the sprite, so it can taper at the ends instead of being a bar.
  const ax = x * 2
  const ay = y * 2
  ctx.fillStyle = 'rgba(0,0,0,0.28)'
  ctx.fillRect(ax + 4, ay + 31, 16, 2)
  ctx.fillRect(ax + 6, ay + 30, 12, 1)
  ctx.fillStyle = 'rgba(0,0,0,0.16)'
  ctx.fillRect(ax + 2, ay + 31, 2, 2)
  ctx.fillRect(ax + 20, ay + 31, 2, 2)

  const key = `${staff.id}|${staff.role}|${bob}|${blink ? 1 : 0}|${typing ?? 'n'}|${walk ?? 'n'}|${idle.action}|${Math.floor(idle.t * 8)}`
  const sprite = cachedSprite(key, g, look.palette)
  if (sprite) ctx.drawImage(sprite, ax - SPRITE_PAD, ay - SPRITE_PAD)
  else paintLit(ctx, g, ax, ay, look.palette)
}
