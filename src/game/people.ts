import type { GameState, PendingEvent, Staff, TraitId } from './types'
import { marketSalaryFor, staffPower } from './hiring'

// The people, as people.
//
// Everything in here is about one member of staff rather than the company: the
// quirk they were hired with, the mood they are in this week, the thing they
// want from you, and what they say out loud about it. Nothing here decides a
// company-wide number on its own — it always goes through one person first.

export interface Trait {
  id: TraitId
  name: string
  /** the one-line version, for the hire card and the roster */
  blurb: string
  /** how much work they get through, as a multiplier */
  output: number
  /** how fast their mood moves, up and down */
  swing: number
}

export const TRAITS: Trait[] = [
  {
    id: 'nightowl',
    name: 'Night owl',
    blurb: 'Gets more done than anybody, and burns out faster for it.',
    output: 1.14,
    swing: 1.2,
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    blurb: 'Slower, but what they ship is better.',
    output: 0.92,
    swing: 1,
  },
  {
    id: 'mercenary',
    name: 'Mercenary',
    blurb: 'In it for the money. Falls behind market and they are gone.',
    output: 1.05,
    swing: 1,
  },
  {
    id: 'mentor',
    name: 'Mentor',
    blurb: 'Lifts the mood of everybody around them.',
    output: 0.96,
    swing: 0.8,
  },
  {
    id: 'fragile',
    name: 'Fragile',
    blurb: 'Takes everything to heart, good weeks and bad.',
    output: 1,
    swing: 1.8,
  },
  {
    id: 'steady',
    name: 'Steady',
    blurb: 'Nothing rattles them. Nothing thrills them either.',
    output: 1,
    swing: 0.45,
  },
  {
    id: 'showman',
    name: 'Showman',
    blurb: 'Posts about the work. People follow the company because of them.',
    output: 0.98,
    swing: 1,
  },
  {
    id: 'idealist',
    name: 'Idealist',
    blurb: 'Here to do it properly. Cutting corners on safety eats at them.',
    output: 1.02,
    swing: 1.2,
  },
]

export const TRAIT_MAP: Record<string, Trait> = Object.fromEntries(TRAITS.map((t) => [t.id, t]))

/** How many people ask for time off at once, and how long they get. */
export const BREAK_ASK_COUNT = 3
export const BREAK_WEEKS = 2
/** They ask on a rhythm rather than at random: once every this many weeks. */
export const BREAK_ASK_EVERY = 5
/** Nobody is asked about twice in a row. */
export const ASK_COOLDOWN_WEEKS = 10

export function traitsOf(s: Staff): Trait[] {
  return (s.traits ?? []).map((id) => TRAIT_MAP[id]).filter(Boolean)
}

export function hasTrait(s: Staff, id: TraitId): boolean {
  return (s.traits ?? []).includes(id)
}

/** Roll one or two quirks for a new hire. Nobody gets a contradictory pair. */
export function rollTraits(): TraitId[] {
  const pool = TRAITS.map((t) => t.id)
  const first = pool[Math.floor(Math.random() * pool.length)]
  if (Math.random() < 0.45) return [first]
  const conflicts: Partial<Record<TraitId, TraitId>> = { fragile: 'steady', steady: 'fragile' }
  const rest = pool.filter((id) => id !== first && conflicts[first] !== id)
  return [first, rest[Math.floor(Math.random() * rest.length)]]
}

/**
 * How much of themselves somebody brings to the work, as a multiplier on
 * everything they contribute. It comes from their quirks and nothing else — a
 * night owl gets more done than their exam score says, a perfectionist less.
 */
export function effortOf(s: Staff): number {
  const traits = traitsOf(s).reduce((m, t) => m * t.output, 1)
  return Math.max(0.7, Math.min(1.3, traits))
}

/** The same thing, in points: what this person is worth to the work. */
export function effectivePower(s: Staff): number {
  return staffPower(s) * effortOf(s)
}

/** How far behind the market somebody is, as a fraction of what they should earn. */
export function payGap(s: Staff, week: number): number {
  const market = marketSalaryFor(s.role, staffPower(s), week)
  if (market <= 0) return 0
  return (market - s.salary) / market
}

/** What somebody is chewing over this week, said out loud. */
export function chatterFor(state: GameState, s: Staff, week: number): string[] {
  const lines: string[] = []
  const gap = payGap(s, week)

  if (gap > 0.12) lines.push('I looked up what I am worth.', 'Nebulai pays more for this.', 'We should talk about pay.')
  if (hasTrait(s, 'nightowl')) lines.push('Slept here again.', 'Fourth coffee.', 'One more run before dawn.')
  if (hasTrait(s, 'perfectionist')) lines.push('It is not ready.', 'Give me one more week.', 'The eval is wrong.')
  if (hasTrait(s, 'mercenary')) lines.push('Options vest when?', 'What is the raise cycle?')
  if (hasTrait(s, 'mentor')) lines.push('Come look at this with me.', 'You are doing fine.')
  if (hasTrait(s, 'idealist')) lines.push('Did anyone red-team this?', 'We should publish the flaws too.')
  if (hasTrait(s, 'showman')) lines.push('I posted the demo.', 'This is going to trend.')
  if (hasTrait(s, 'fragile')) lines.push('Was that my fault?', 'Long week.')
  if (hasTrait(s, 'steady')) lines.push('It is under control.', 'Same as yesterday.')

  if (state.models.some((m) => m.status === 'training')) {
    lines.push('Loss is going down.', 'Run is at 40%.', 'Checkpoint looks good.')
  }
  if (state.researching.length > 0) lines.push('The maths works out.', 'I read the paper twice.')
  if (state.chipDesign) lines.push('The tape-out is close.', 'Yield is the problem.')
  if (state.risk > 50) lines.push('This will bite us.', 'We skipped the evals again.')
  if (state.money < weeklyBurnGuess(state) * 6) lines.push('Are we fine on money?', 'Payroll is Friday, right?')

  if (lines.length === 0) {
    lines.push('Morning.', 'Coffee?', 'Standup in five.', 'It compiles.', 'Ship it.', 'Any news?')
  }
  return lines
}

function weeklyBurnGuess(state: GameState): number {
  return state.staff.reduce((sum, s) => sum + s.salary, 0) + 1
}

// ---------------------------------------------------------------------------
// Asking for time off
// ---------------------------------------------------------------------------

function id(): string {
  return `ask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Every few weeks a few people come and ask for time off together.
 *
 * It is the one thing the staff ever ask you for, and the whole decision is
 * whether you can spare them: a break is two weeks of no work at all from
 * people you are still paying.
 */
export function pickBreakRequest(state: GameState, week: number): PendingEvent | null {
  if (week - state.lastRequestWeek < BREAK_ASK_EVERY) return null
  const ready = state.staff.filter(
    (s) => week - (s.lastAskWeek ?? -99) >= ASK_COOLDOWN_WEEKS && !state.sabbaticals.some((sb) => sb.id === s.id),
  )
  if (ready.length < 1) return null

  // whoever has been here longest without a break goes to the front of the queue
  const queue = [...ready].sort((a, b) => (a.lastBreakWeek ?? -99) - (b.lastBreakWeek ?? -99))
  const asking = queue.slice(0, Math.min(BREAK_ASK_COUNT, queue.length))
  const names = asking.map((s) => s.name)
  const list =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

  return {
    id: id(),
    icon: '🌴',
    title: names.length === 1 ? `${names[0]} wants time off` : `${names.length} of your people want time off`,
    text:
      `${list} ${names.length === 1 ? 'has' : 'have'} been at it without a break. ` +
      `They are asking for ${BREAK_WEEKS} weeks. You keep paying them either way; you just do not get the work.`,
    person: asking[0],
    asking: asking.map((s) => s.id),
    choices: [
      {
        label: `Give ${names.length === 1 ? 'them' : 'all of them'} the ${BREAK_WEEKS} weeks`,
        hint: `No work from ${names.length === 1 ? 'them' : `those ${names.length}`} until they are back.`,
        news: `${list} took ${BREAK_WEEKS} weeks off.`,
        effects: { breakFor: asking.map((s) => s.id) },
      },
      {
        label: 'Tell them to take it later',
        hint: 'Nothing stops, and nothing changes.',
        news: `${list} asked for time off and were told to wait.`,
        effects: {},
      },
    ],
  }
}
