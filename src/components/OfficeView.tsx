import { useEffect, useMemo, useRef } from 'react'
import type { GameState, Staff } from '../game/types'
import { playWorkSfx } from '../game/audio'
import { SPRITE_H, SPRITE_W, drawCharacter, hash } from './sprites'
import { Chatter, drawBubble, drawMoodPip } from './bubbles'
import type { WorkKind } from './officeArt'
import { SCALE, TILE, drawBurst, drawDesk, drawDeskProp, drawToilet, drawWorkIcon, drawWorkToken } from './officeArt'
import {
  breakSpots,
  doorTile,
  drawAmenities,
  drawDecor,
  drawDoor,
  drawRackLights,
  drawWallClock,
  rackTile,
  tripFor,
} from './officeDecor'

// winter, spring, summer, autumn: floor, alternate floor, wall
const SEASON_LIGHT: [string, string, string][] = [
  ['#212633', '#242a38', '#171c28'],
  ['#233428', '#26392c', '#172218'],
  ['#2a2a30', '#2e2e35', '#1d1b22'],
  ['#2b2620', '#2f2a24', '#1e1a16'],
]
// The walls used to be the same near-black as the page behind the canvas, which
// left the office looking like a floor floating in space.
const WALL_TOP = '#202634'
const SKIRTING = '#0f1218'

const BAR_H = 6
const BAR_MAX_W = 240
const BAR_MARGIN = 40
// Every job that is running gets its own bar, stacked from the top of the room.
// Four is as many as fit above the first row of desks.
export const MAX_BARS = 4
const BAR_TOP = 1
const BAR_PITCH = 8
// the token that says which kind of work feeds this bar sits just left of it
const BAR_ICON_GAP = 11

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

const KIND_COLOR: Record<WorkKind, string> = {
  research: '#3ddc84',
  training: '#4aa3ff',
  marketing: '#ffd166',
}

/** One thing the company is working on: a research item, a model, a campaign. */
export interface Job {
  /** stable across frames, so a bar keeps its fill while it runs */
  id: string
  kind: WorkKind
  progress: number
  /** what is being worked on, written along the bar */
  label: string
}

const barY = (index: number) => BAR_TOP + index * BAR_PITCH

function roleKind(role: Staff['role']): WorkKind | null {
  if (role === 'researcher') return 'research'
  if (role === 'engineer') return 'training'
  if (role === 'marketer') return 'marketing'
  return null // lawyers and the hardware bench have no bar of their own
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
  /** width of the desk grid in tiles, so the decor knows what space is left */
  gridW: number
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
    gridW,
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

interface Particle {
  x: number
  y: number
  t: number
  kind: WorkKind
  /** the bar this piece of work is flying to */
  job: string
  /** keeps two tokens of the same kind from animating in step */
  seed: number
}

interface Flash {
  x: number
  y: number
  t: number
  kind: WorkKind
}

/** Where a person was last drawn, in world pixels, so right-clicks can find them. */
interface HitBox {
  id: string
  x: number
  y: number
}

const HIT_PAD = 2

// how long a visitor takes to cross the room
const VISIT_MS = 14_000

/** Not on the payroll, and never in the hit list: nobody can right-click them. */
const COURIER: Staff = {
  id: 'courier',
  name: 'Courier',
  nationality: 'europe',
  role: 'marketer',
  examScore: 100,
  level: 1,
  salary: 0,
  assignment: 'ops',
  traits: [],
  morale: 70,
  unhappyWeeks: 0,
  noticeWeeks: null,
  lastAskWeek: 0,
  joinedWeek: 0,
  lastBreakWeek: 0,
}

interface Props {
  staff: Staff[]
  /** the whole company, so the people in it have something to talk about */
  state: GameState
  desks: number
  /** everything running right now, one bar each, already capped at MAX_BARS */
  jobs: Job[]
  /** office extras that have been paid for, drawn along the back of the room */
  amenities: string[]
  /** the week, so the room can know what time of year it is */
  week: number
  /** how hard the service is working, which the server rack shows */
  load: number
  /** right-clicking a person opens their menu at the pointer */
  onStaffMenu?: (staffId: string, clientX: number, clientY: number) => void
  /** clicking the door in the corner takes you outside */
  onLeave?: () => void
}

export function OfficeView({ staff, state, desks, jobs, amenities, week, load, onStaffMenu, onLeave }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  // who is talking, and the thing they said
  const chatter = useRef(new Chatter(2))
  const said = useRef<{ id: string; text: string; from: number }[]>([])
  const layout = useMemo(() => layoutFor(desks), [desks])
  const deskList = useMemo(() => generateDesks(desks, layout), [desks, layout])
  const W = layout.roomCols * TILE
  const H = layout.roomRows * TILE
  const barW = Math.min(BAR_MAX_W, W - BAR_MARGIN * 2)
  const barX = Math.round((W - barW) / 2)
  const particles = useRef<Particle[]>([])
  const flashes = useRef<Flash[]>([])
  const hits = useRef<HitBox[]>([])
  const nextSpawn = useRef<Record<string, number>>({})
  // Floor, walls and empty desks never change between frames, so they are
  // rasterised once and blitted underneath the animated layers.
  // Four seasons of light. It is the same room, lit differently, and it is the
  // only thing in the office that tells you a year has gone by.
  const season = Math.floor(((week % 52) + 52) % 52 / 13)
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
    const [floorA, floorB, wall] = SEASON_LIGHT[season]
    for (let row = 1; row < layout.roomRows - 1; row++) {
      for (let col = 1; col < layout.roomCols - 1; col++) {
        bgx.fillStyle = (row + col) % 2 === 0 ? floorA : floorB
        bgx.fillRect(col * TILE, row * TILE, TILE, TILE)
      }
    }
    bgx.fillStyle = wall
    bgx.fillRect(0, 0, w, TILE)
    bgx.fillRect(0, h - TILE, w, TILE)
    bgx.fillRect(0, 0, TILE, h)
    bgx.fillRect(w - TILE, 0, TILE, h)
    // a lit top edge and a skirting board, so the walls have a direction
    bgx.fillStyle = WALL_TOP
    bgx.fillRect(0, 0, w, 2)
    bgx.fillStyle = SKIRTING
    bgx.fillRect(0, TILE - 2, w, 2)
    bgx.fillRect(0, h - TILE, w, 2)
    bgx.fillRect(TILE - 2, TILE, 2, h - TILE * 2)
    bgx.fillRect(w - TILE, TILE, 2, h - TILE * 2)
    bgx.setTransform(1, 0, 0, 1, 0, 0)
    drawToilet(bgx, layout.roomCols - 3, 1)
    drawDecor(bgx, layout)
    drawAmenities(bgx, layout, amenities)
    for (const d of deskList) drawDesk(bgx, d.dx, d.dy)
    return bg
  }, [deskList, layout, amenities, season])
  // drawn fill and next spawn time, per job id, so a bar keeps its place
  const vis = useRef<Record<string, number>>({})

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    const rack = rackTile(layout)
    const spots = breakSpots(layout, amenities)
    const bars = jobs.slice(0, MAX_BARS)
    const barOf = (id: string) => bars.findIndex((b) => b.id === id)
    // work that finished is no longer on screen, so drop what it was tracking
    for (const key of Object.keys(vis.current)) {
      if (barOf(key) < 0) {
        delete vis.current[key]
        delete nextSpawn.current[key]
      }
    }
    for (const b of bars) {
      if (vis.current[b.id] === undefined) vis.current[b.id] = 0
      if (nextSpawn.current[b.id] === undefined) nextSpawn.current[b.id] = 0
    }

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
      bars.forEach((b, i) => {
        drawBar(barX, barY(i), barW, BAR_H, vis.current[b.id], KIND_COLOR[b.kind])
      })

      // Each bar carries the token that feeds it and the name of the job, so
      // two researches running side by side can be told apart.
      art()
      ctx.font = '8px "Press Start 2P", monospace'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      bars.forEach((b, i) => {
        const midY = (barY(i) + BAR_H / 2) * SCALE
        drawWorkIcon(ctx, (barX - BAR_ICON_GAP) * SCALE, midY, b.kind)
        const text = b.label.length > 18 ? `${b.label.slice(0, 17)}…` : b.label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.fillText(text, (barX + 2) * SCALE + 1, midY + 1)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(text, (barX + 2) * SCALE, midY)
      })

      // people are drawn in art pixels now, the same space the desks use, so a
      // face has enough room to be a face
      art()
      const activeKinds = new Set(bars.map((b) => b.kind))
      // rebuilt every frame so a right-click hits people where they actually are,
      // including the ones pacing the corridor
      hits.current.length = 0
      staff.forEach((s, i) => {
        const p = staffPosition(i, deskList, layout)
        const kind = roleKind(s.role)
        const working = kind !== null && activeKinds.has(kind)
        const hasDesk = i < deskList.length
        if (hasDesk) {
          const trip = tripFor(s.id, p.x, p.y, now, spots)
          drawCharacter(ctx, s, trip.x, trip.y, now, working && !trip.walking, trip.walking)
          hits.current.push({ id: s.id, x: trip.x, y: trip.y })
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

      // Somebody from outside walks through every few minutes: a courier with a
      // box, crossing the room and leaving. Nothing depends on them. They are
      // there because an office with only its own staff in it feels sealed.
      const visitPeriod = 190_000
      const visitT = now % visitPeriod
      if (visitT < VISIT_MS) {
        const k = visitT / VISIT_MS
        const vx = Math.round(TILE + k * (W - TILE * 2))
        const vy = (layout.roomRows - 2) * TILE
        drawCharacter(ctx, COURIER, vx, vy, now, false, true)
        // the box they are carrying
        const bx = vx * SCALE + 18
        const by = vy * SCALE + 14
        ctx.fillStyle = '#8a6038'
        ctx.fillRect(bx, by, 12, 10)
        ctx.fillStyle = '#a8763f'
        ctx.fillRect(bx, by, 12, 2)
        ctx.fillStyle = '#c9cddb'
        ctx.fillRect(bx + 5, by, 2, 10)
      }

      art()
      for (let i = 0; i < deskList.length; i++) {
        const s = staff[i]
        if (s) drawDeskProp(ctx, deskList[i].dx, deskList[i].dy, s.role, now)
      }
      // the parts of the furniture that move
      if (rack) drawRackLights(ctx, rack.tx, rack.ty, now, load)
      drawDoor(ctx, layout, now)
      drawWallClock(ctx, 1, 0, now)

      // The tokens and the impact they make are drawn in art pixels, so a brain
      // is a brain rather than a five-pixel blob.
      art()
      for (const f of flashes.current) {
        drawBurst(ctx, f.x * SCALE, f.y * SCALE, f.t / FLASH_LIFE, KIND_COLOR[f.kind])
      }

      for (const p of particles.current) {
        const index = barOf(p.job)
        const tx = barX + (vis.current[p.job] ?? barW)
        const ty = barY(index < 0 ? bars.length : index) + BAR_H / 2
        const at = (tt: number) => {
          const c = Math.max(0, Math.min(1, tt))
          return {
            x: (p.x + (tx - p.x) * c) * SCALE,
            y: (p.y + (ty - p.y) * c - Math.sin(c * Math.PI) * 18) * SCALE,
          }
        }
        // a short ghost trail so the flight path reads at speed
        for (const back of [0.12, 0.06]) {
          if (p.t - back <= 0) continue
          const g = at(p.t - back)
          ctx.globalAlpha = back === 0.12 ? 0.16 : 0.34
          drawWorkToken(ctx, g.x, g.y, p.kind, now, p.seed)
        }
        ctx.globalAlpha = 1
        const here = at(p.t)
        drawWorkToken(ctx, here.x, here.y, p.kind, now, p.seed)
      }

      // The mood marks and the bubbles go on last of all: the desks are drawn
      // over the people, and neither of these may be covered by a monitor.
      art()
      for (const h of hits.current) {
        const who = staff.find((s) => s.id === h.id)
        if (who) drawMoodPip(ctx, h.x * SCALE, h.y * SCALE, who, now)
      }
      for (const b of said.current) {
        const at = hits.current.find((h) => h.id === b.id)
        if (!at) continue
        drawBubble(ctx, at.x * SCALE, at.y * SCALE, b.text, now - b.from, W * SCALE)
      }
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
        const target = targetOf(b.progress)
        if (staff.some((s) => roleKind(s.role) === b.kind)) {
          // someone is on it, so only their work moves the bar; just never overshoot
          if (vis.current[b.id] > target) vis.current[b.id] = target
        } else {
          // nobody works this kind, so it fills on its own rather than freezing
          const v = vis.current[b.id]
          vis.current[b.id] = v + (target - v) * Math.min(1, dt * 3)
        }
      }

      // one worker sends their output up every two to three seconds, per job
      for (const b of bars) {
        if (nextSpawn.current[b.id] === 0) {
          nextSpawn.current[b.id] = now + Math.random() * SPAWN_JITTER_MS
          continue
        }
        if (now < nextSpawn.current[b.id]) continue
        nextSpawn.current[b.id] = now + SPAWN_MIN_MS + Math.random() * SPAWN_JITTER_MS
        const workers: number[] = []
        staff.forEach((s, i) => {
          if (roleKind(s.role) === b.kind) workers.push(i)
        })
        if (workers.length === 0) continue
        const p = staffPosition(workers[Math.floor(Math.random() * workers.length)], deskList, layout)
        particles.current.push({
          x: p.x + 6,
          y: p.y,
          t: 0,
          kind: b.kind,
          job: b.id,
          seed: Math.random() * 10,
        })
      }

      const landed: Particle[] = []
      for (const p of particles.current) {
        p.t += dt
        if (p.t >= 1) landed.push(p)
      }
      particles.current = particles.current.filter((p) => p.t < 1)
      for (const p of landed) {
        const index = barOf(p.job)
        if (index < 0) continue // its job finished while this was in the air
        const bar = bars[index]
        const target = targetOf(bar.progress)
        const v = vis.current[p.job]
        const step = Math.max(barW * LAND_MIN_STEP, (target - v) * LAND_CATCHUP)
        vis.current[p.job] = Math.min(target, v + step)
        flashes.current.push({
          x: barX + vis.current[p.job],
          y: barY(index) + BAR_H / 2,
          t: 0,
          kind: p.kind,
        })
        // the note rises with the bar and pans to wherever the hit landed
        const fill = vis.current[p.job] / barW
        playWorkSfx(p.kind, fill, fill * 1.4 - 0.7)
      }

      for (const f of flashes.current) f.t += dt
      flashes.current = flashes.current.filter((f) => f.t < FLASH_LIFE)

      said.current = chatter.current.step(now, staff, state, week)

      drawScene(now)
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [background, staff, state, week, deskList, layout, barX, barW, W, jobs, amenities, load])

  /** Where a click landed on the canvas, in art pixels. */
  function artPoint(clientX: number, clientY: number): { x: number; y: number } | null {
    const canvas = ref.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    // object-fit: contain letterboxes the canvas inside its box, so undo that first
    const zoom = Math.min(rect.width / canvas.width, rect.height / canvas.height)
    if (zoom <= 0) return null
    return {
      x: (clientX - rect.left - (rect.width - canvas.width * zoom) / 2) / zoom,
      y: (clientY - rect.top - (rect.height - canvas.height * zoom) / 2) / zoom,
    }
  }

  /** Which person, if any, is under a client-space point. */
  function staffAt(clientX: number, clientY: number): string | null {
    const at = artPoint(clientX, clientY)
    if (!at) return null
    const artX = at.x
    const artY = at.y
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
      onClick={(e) => {
        // the door in the corner is the only thing in the room you can click
        const at = artPoint(e.clientX, e.clientY)
        if (!at || !onLeave) return
        const door = doorTile(layout)
        const dx = door.tx * TILE * SCALE
        const dy = door.ty * TILE * SCALE
        if (at.x >= dx && at.x <= dx + TILE * SCALE && at.y >= dy - 10 && at.y <= dy + TILE * SCALE) onLeave()
      }}
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
