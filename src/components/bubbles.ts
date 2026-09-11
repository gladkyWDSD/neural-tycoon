import type { GameState, Staff } from '../game/types'
import { chatterFor, hasTrait } from '../game/people'
import { px } from './officeArt'

// What the room sounds like.
//
// A bubble is the only place the game says something in somebody's own voice,
// so it is worth getting right: short lines, a tail pointing at whoever said
// it, and never two people talking over each other in the same corner.

const CHAR_W = 8 // "Press Start 2P" at 8px is square
const PAD = 6
const LINE_H = 11
const MAX_CHARS = 22

/** One person saying one thing, for as long as it stays on screen. */
export interface Bubble {
  id: string
  text: string
  /** when it appeared and when it goes, in the animation clock */
  from: number
  until: number
}

export const BUBBLE_MS = 4200
const GAP_MIN_MS = 2600
const GAP_JITTER_MS = 3400

/**
 * Keeps at most `most` bubbles alive at once and starts new ones on a timer.
 *
 * The view owns the list; this only decides when somebody new speaks up, so a
 * room of twenty people is never a wall of text.
 */
export class Chatter {
  private next = 0
  private most: number
  bubbles: Bubble[] = []

  constructor(most = 2) {
    this.most = most
  }

  step(now: number, people: Staff[], state: GameState, week: number): Bubble[] {
    this.bubbles = this.bubbles.filter((b) => b.until > now)
    if (people.length === 0) return this.bubbles
    if (now < this.next) return this.bubbles
    this.next = now + GAP_MIN_MS + Math.random() * GAP_JITTER_MS
    if (this.bubbles.length >= this.most) return this.bubbles

    // the loud ones talk more often, which is the only thing that decides it
    const weighted = people.map((s) => {
      let w = 1
      if (hasTrait(s, 'showman')) w += 1.5
      if (hasTrait(s, 'mentor')) w += 0.8
      if (hasTrait(s, 'steady')) w -= 0.4
      return { s, w: Math.max(0.2, w) }
    })
    const total = weighted.reduce((sum, x) => sum + x.w, 0)
    let roll = Math.random() * total
    let who = weighted[0].s
    for (const x of weighted) {
      roll -= x.w
      if (roll <= 0) {
        who = x.s
        break
      }
    }
    if (this.bubbles.some((b) => b.id === who.id)) return this.bubbles

    const lines = chatterFor(state, who, week)
    const text = lines[Math.floor(Math.random() * lines.length)]
    this.bubbles.push({ id: who.id, text, from: now, until: now + BUBBLE_MS })
    return this.bubbles
  }
}

/** Break a line into at most two that fit the bubble. */
function wrap(text: string): string[] {
  if (text.length <= MAX_CHARS) return [text]
  const words = text.split(' ')
  const lines: string[] = ['']
  for (const w of words) {
    const line = lines[lines.length - 1]
    if (line.length === 0) lines[lines.length - 1] = w
    else if (line.length + 1 + w.length <= MAX_CHARS) lines[lines.length - 1] = `${line} ${w}`
    else lines.push(w)
  }
  return lines.slice(0, 2)
}

/**
 * A speech bubble over somebody's head, in art pixels.
 *
 * `x`/`y` are where the person is standing, in art pixels; the bubble floats
 * above them and pops in rather than fading, because everything else in the
 * room is drawn at pixel precision too.
 */
export function drawBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  age: number,
  canvasW: number,
): void {
  const lines = wrap(text)
  const w = Math.max(...lines.map((l) => l.length)) * CHAR_W + PAD * 2
  const h = lines.length * LINE_H + PAD * 2 - 2

  // it grows into place over the first fifth of a second
  const pop = Math.min(1, age / 160)
  const lift = Math.round((1 - pop) * 6)
  if (pop < 1) {
    ctx.save()
    ctx.globalAlpha = pop
  }

  let bx = Math.round(x + 16 - w / 2)
  bx = Math.max(4, Math.min(canvasW - w - 4, bx))
  const by = Math.round(y - h - 14 + lift)

  px(ctx, bx + 2, by + 3, w, h, 'rgba(0,0,0,0.45)') // the shadow it casts
  px(ctx, bx, by, w, h, '#0d1018')
  px(ctx, bx + 2, by + 2, w - 4, h - 4, '#f2f4fb')
  px(ctx, bx + 2, by + 2, w - 4, 2, '#ffffff')

  // the tail, pointing back at whoever is talking
  const tailX = Math.max(bx + 6, Math.min(bx + w - 12, Math.round(x + 10)))
  px(ctx, tailX, by + h - 2, 8, 3, '#0d1018')
  px(ctx, tailX + 1, by + h, 6, 3, '#0d1018')
  px(ctx, tailX + 2, by + h + 2, 4, 3, '#0d1018')
  px(ctx, tailX + 1, by + h - 2, 5, 3, '#f2f4fb')
  px(ctx, tailX + 2, by + h, 3, 2, '#f2f4fb')

  ctx.font = '8px "Press Start 2P", monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#14161d'
  lines.forEach((line, i) => {
    ctx.fillText(line, bx + PAD, by + PAD + i * LINE_H - 1)
  })

  if (pop < 1) ctx.restore()
}
