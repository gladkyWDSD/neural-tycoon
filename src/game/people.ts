import type { GameState, PendingEvent, Staff, TraitId } from './types'
import { marketSalaryFor, staffPower } from './hiring'
import { AMENITY_MAP } from './amenities'

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

export const STARTING_MORALE = 72
/** Below this and they are counted as unhappy, in the readouts and by themselves. */
export const UNHAPPY = 35
export const DELIGHTED = 85
/** Weeks of misery before somebody hands in their notice. */
export const QUIT_AFTER_WEEKS = 5
/** How long they work their notice, which is your window to fix it. */
export const NOTICE_WEEKS = 3

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
 * How much of themselves somebody is actually bringing to work, as a
 * multiplier on everything they contribute. A miserable hire is still worth
 * having; a happy one is worth a bit more than the payroll says.
 */
export function effortOf(s: Staff): number {
  const morale = s.morale ?? STARTING_MORALE
  // 0.78 at rock bottom, 1.0 at 60, 1.10 when they love it here
  const mood = 0.78 + Math.max(0, Math.min(100, morale)) * 0.0032
  const traits = traitsOf(s).reduce((m, t) => m * t.output, 1)
  return Math.max(0.6, Math.min(1.3, mood * traits))
}

/** The same thing, in points: what this person is worth to the work this week. */
export function effectivePower(s: Staff): number {
  return staffPower(s) * effortOf(s)
}

/** How hard their mood swings, from their quirks. */
export function swingOf(s: Staff): number {
  return traitsOf(s).reduce((m, t) => m * t.swing, 1)
}

export function moodLabel(morale: number): string {
  if (morale >= DELIGHTED) return 'Loving it'
  if (morale >= 70) return 'Happy'
  if (morale >= 50) return 'Fine'
  if (morale >= UNHAPPY) return 'Restless'
  if (morale >= 18) return 'Unhappy'
  return 'Looking elsewhere'
}

export function moodColour(morale: number): string {
  if (morale >= DELIGHTED) return '#3ddc84'
  if (morale >= 50) return '#9fd28a'
  if (morale >= UNHAPPY) return '#ffd166'
  return '#ff5c5c'
}

/** The company's mood in one number, for the readout on the rail. */
export function averageMorale(state: GameState): number {
  if (state.staff.length === 0) return 0
  return state.staff.reduce((sum, s) => sum + (s.morale ?? STARTING_MORALE), 0) / state.staff.length
}

export function unhappyCount(state: GameState): number {
  return state.staff.filter((s) => (s.morale ?? STARTING_MORALE) < UNHAPPY).length
}

/** How far behind the market somebody is, as a fraction of what they should earn. */
export function payGap(s: Staff, week: number): number {
  const market = marketSalaryFor(s.role, staffPower(s), week)
  if (market <= 0) return 0
  return (market - s.salary) / market
}

export interface MoodChange {
  delta: number
  /** the one reason that moved them most, for the roster and the bubbles */
  reason: string
}

/**
 * One week of somebody's mood.
 *
 * Everything that can move it is listed here in one place so the roster can
 * explain itself: the biggest single term is what they will tell you about.
 */
export function moraleWeek(
  state: GameState,
  s: Staff,
  ctx: { crunch: number; shipped: boolean; incident: boolean; mentors: number; week: number },
): MoodChange {
  const terms: { why: string; amount: number }[] = []

  // pay, measured against what a rival would offer them today
  const gap = payGap(s, ctx.week)
  if (gap > 0.04) {
    // Being behind the market is a slow grind, not a cliff: it pulls their
    // mood down to a level and holds it there. Ignore somebody for a year and
    // they get restless; pay them half of what they are worth and they leave.
    terms.push({
      why: `paid ${Math.round(gap * 100)}% under the market`,
      amount: -Math.min(10, gap * 11) * (hasTrait(s, 'mercenary') ? 1.9 : 1),
    })
  } else if (gap < -0.05) {
    terms.push({ why: 'paid well above the market', amount: Math.min(4, -gap * 10) })
  }

  // how much work there is per pair of hands
  if (ctx.crunch > 1.2) {
    const bite = Math.min(6, (ctx.crunch - 1.2) * (hasTrait(s, 'nightowl') ? 3 : 6))
    terms.push({ why: 'buried in work', amount: -bite })
  } else if (ctx.crunch < 0.4) {
    terms.push({ why: 'not much to do', amount: -1.2 })
  }

  // the office itself
  const comforts = state.amenities.reduce((sum, id) => sum + (AMENITY_MAP[id] ? 1 : 0), 0)
  if (comforts > 0) terms.push({ why: 'likes the office', amount: Math.min(3, comforts * 0.8) })

  // what the company did this week
  if (ctx.shipped) terms.push({ why: 'we shipped something', amount: 6 })
  if (ctx.incident) terms.push({ why: 'the incident', amount: -5 })
  if (hasTrait(s, 'idealist') && state.risk > 45) {
    terms.push({ why: 'we are cutting corners on safety', amount: -(state.risk - 45) / 12 })
  }
  if (hasTrait(s, 'showman') && state.hype > 1.15) terms.push({ why: 'everyone is talking about us', amount: 2.5 })
  if (ctx.mentors > 0 && !hasTrait(s, 'mentor')) {
    terms.push({ why: 'good people to work with', amount: Math.min(3, ctx.mentors * 1.5) })
  }

  // and the pull back towards ordinary: nobody stays furious or elated forever
  const morale = s.morale ?? STARTING_MORALE
  terms.push({ why: 'settling back to normal', amount: (58 - morale) * 0.18 })

  const swing = swingOf(s)
  const raw = terms.reduce((sum, t) => sum + t.amount, 0)
  const biggest = terms.reduce((a, b) => (Math.abs(a.amount) >= Math.abs(b.amount) ? a : b), terms[0])
  return { delta: raw * swing, reason: biggest?.why ?? 'nothing in particular' }
}

/** What somebody is chewing over this week, said out loud. */
export function chatterFor(state: GameState, s: Staff, week: number): string[] {
  const lines: string[] = []
  const morale = s.morale ?? STARTING_MORALE
  const gap = payGap(s, week)

  if (s.noticeWeeks != null) {
    lines.push('Last few weeks here.', 'I already signed the offer.', 'Nothing personal.')
    return lines
  }

  if (gap > 0.12) lines.push('I looked up what I am worth.', 'Nebulai pays more for this.', 'We should talk about pay.')
  if (morale < UNHAPPY) lines.push('I am so tired.', 'Why do we do it this way?', 'I need a break.')
  else if (morale >= DELIGHTED) lines.push('Best job I have had.', 'This is going to work.', 'I love this place.')

  if (hasTrait(s, 'nightowl')) lines.push('Slept here again.', 'Fourth coffee.', 'One more run before dawn.')
  if (hasTrait(s, 'perfectionist')) lines.push('It is not ready.', 'Give me one more week.', 'The eval is wrong.')
  if (hasTrait(s, 'mercenary')) lines.push('Options vest when?', 'What is the raise cycle?')
  if (hasTrait(s, 'mentor')) lines.push('Come look at this with me.', 'You are doing fine.')
  if (hasTrait(s, 'idealist')) lines.push('Did anyone red-team this?', 'We should publish the flaws too.')
  if (hasTrait(s, 'showman')) lines.push('I posted the demo.', 'This is going to trend.')

  if (state.models.some((m) => m.status === 'training')) lines.push('Loss is going down.', 'Run is at 40%.', 'Checkpoint looks good.')
  if (state.researching.length > 0) lines.push('The maths works out.', 'I read the paper twice.')
  if (state.risk > 50) lines.push('This will bite us.', 'We skipped the evals again.')
  if (serviceStrain(state)) lines.push('We are out of capacity.', 'The queue is backing up.')
  if (state.money < weeklyBurnGuess(state) * 6) lines.push('Are we fine on money?', 'Payroll is Friday, right?')

  if (lines.length === 0) {
    lines.push('Morning.', 'Coffee?', 'Standup in five.', 'It compiles.', 'Ship it.', 'Any news?')
  }
  return lines
}

function serviceStrain(state: GameState): boolean {
  const served = state.models.reduce((sum, m) => sum + (m.status === 'published' ? m.customers : 0), 0)
  return served > 0 && state.gpuCards > 0 && served / state.gpuCards > 90_000
}

function weeklyBurnGuess(state: GameState): number {
  return state.staff.reduce((sum, s) => sum + s.salary, 0) + 1
}

// ---------------------------------------------------------------------------
// What they ask you for
// ---------------------------------------------------------------------------

export const ASK_COOLDOWN_WEEKS = 14
/** No two requests closer together than this, whoever is asking. */
export const REQUEST_GAP_WEEKS = 7

function id(): string {
  return `ask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const money = (n: number) => `$${Math.round(n).toLocaleString()}`

/**
 * Somebody with something to ask, or nobody.
 *
 * The people who want something most are the ones who are underpaid, miserable
 * or on the wrong job, so the ask is nearly always about the thing you have
 * been ignoring.
 */
export function pickRequest(state: GameState, week: number): PendingEvent | null {
  if (state.staff.length === 0) return null
  if (week - state.lastRequestWeek < REQUEST_GAP_WEEKS) return null

  const ready = state.staff.filter((s) => week - (s.lastAskWeek ?? -99) >= ASK_COOLDOWN_WEEKS && s.noticeWeeks == null)
  if (ready.length === 0) return null

  // weight by how much they want something
  const weighted = ready.map((s) => {
    const gap = payGap(s, week)
    const morale = s.morale ?? STARTING_MORALE
    let w = 1
    if (gap > 0.08) w += gap * 12
    if (morale < 50) w += (50 - morale) / 12
    if (hasTrait(s, 'mercenary')) w += 1.5
    return { s, w }
  })
  const total = weighted.reduce((sum, x) => sum + x.w, 0)
  let roll = Math.random() * total
  let person = weighted[0].s
  for (const x of weighted) {
    roll -= x.w
    if (roll <= 0) {
      person = x.s
      break
    }
  }

  const gap = payGap(person, week)
  const morale = person.morale ?? STARTING_MORALE
  const kinds: (() => PendingEvent)[] = []
  if (gap > 0.08) kinds.push(() => raiseAsk(person, week))
  if (morale < 55) kinds.push(() => timeOffAsk(person))
  if (person.role === 'researcher' && person.assignment !== 'research') kinds.push(() => transferAsk(person, 'research'))
  if (person.role === 'engineer' && person.assignment !== 'training') kinds.push(() => transferAsk(person, 'training'))
  if (hasTrait(person, 'idealist') && state.risk > 40) kinds.push(() => safetyAsk(state, person))
  if (hasTrait(person, 'showman')) kinds.push(() => talkAsk(person))
  if (hasTrait(person, 'mentor') && state.staff.length >= 3) kinds.push(() => friendAsk(person))
  kinds.push(() => kitAsk(person))

  return kinds[Math.floor(Math.random() * kinds.length)]()
}

function raiseAsk(person: Staff, week: number): PendingEvent {
  const market = marketSalaryFor(person.role, staffPower(person), week)
  const rise = market - person.salary
  return {
    id: id(),
    icon: '💬',
    title: `${person.name} wants a word`,
    text:
      `"I have been here a while and I looked up what people doing this are paid. I am on ` +
      `${money(person.salary)} a week. The going rate is ${money(market)}. I would rather not go anywhere."`,
    person,
    choices: [
      {
        label: `Put them on ${money(market)}/wk (+${money(rise)})`,
        hint: 'They stay, and they mean it.',
        news: `${person.name} got the raise they asked for.`,
        effects: {
          keepStaffId: person.id,
          keepStaffSalary: market,
          moraleFor: { id: person.id, delta: 26 },
        },
      },
      {
        label: 'Split the difference',
        hint: `${money(person.salary + Math.round(rise / 2))}/wk. Better than nothing.`,
        news: `${person.name} took half a raise, and noticed it was half.`,
        effects: {
          keepStaffId: person.id,
          keepStaffSalary: person.salary + Math.round(rise / 2),
          moraleFor: { id: person.id, delta: 8 },
        },
      },
      {
        label: 'Tell them the money is not there',
        hint: 'It is free, and they will remember it.',
        news: `${person.name} asked for a raise and was turned down.`,
        effects: { moraleFor: { id: person.id, delta: -22 } },
      },
    ],
  }
}

function timeOffAsk(person: Staff): PendingEvent {
  return {
    id: id(),
    icon: '💬',
    title: `${person.name} is running on empty`,
    text: `"I have not had a week off since I started. I am making mistakes I do not normally make. Can I take one?"`,
    person,
    choices: [
      {
        label: 'Take the week',
        hint: 'They do nothing for a week and come back a different person.',
        news: `${person.name} took a week off.`,
        effects: { sabbaticalFor: person.id, moraleFor: { id: person.id, delta: 30 } },
      },
      {
        label: 'Not this week',
        hint: 'There is a run going.',
        news: `${person.name} was told to take it later.`,
        effects: { moraleFor: { id: person.id, delta: -16 } },
      },
    ],
  }
}

function transferAsk(person: Staff, to: Staff['assignment']): PendingEvent {
  const what = to === 'research' ? 'research' : 'the training runs'
  return {
    id: id(),
    icon: '💬',
    title: `${person.name} wants to move`,
    text: `"I am good at this, but it is not what I came here to do. Put me on ${what} and you will see the difference."`,
    person,
    choices: [
      {
        label: `Move them onto ${what}`,
        hint: 'Costs nothing except wherever they were.',
        news: `${person.name} moved onto ${what}.`,
        effects: { assignFor: { id: person.id, assignment: to }, moraleFor: { id: person.id, delta: 18 } },
      },
      {
        label: 'Keep them where they are',
        hint: 'You need them there.',
        news: `${person.name} stayed put, and was not happy about it.`,
        effects: { moraleFor: { id: person.id, delta: -12 } },
      },
    ],
  }
}

function safetyAsk(state: GameState, person: Staff): PendingEvent {
  const cost = 60_000
  return {
    id: id(),
    icon: '💬',
    title: `${person.name} will not let it go`,
    text:
      `"We are shipping faster than we are checking. I want two weeks of evals before the next release. ` +
      `If we hurt somebody with this I am not staying to watch."`,
    person,
    choices: [
      {
        label: `Do the evals (${money(cost)})`,
        hint: 'Cuts the safety debt, and everybody hears about it.',
        news: `${person.name} got the evals they asked for.`,
        effects: { money: -cost, moraleFor: { id: person.id, delta: 22 }, moraleAll: 3 },
        disabled: state.money < cost,
      },
      {
        label: 'Ship it anyway',
        hint: 'They will take it personally.',
        news: `${person.name} was overruled on the safety review.`,
        effects: { moraleFor: { id: person.id, delta: -26 } },
      },
    ],
  }
}

function talkAsk(person: Staff): PendingEvent {
  return {
    id: id(),
    icon: '💬',
    title: `${person.name} wants to give a talk`,
    text: `"There is a conference in two weeks. Let me show what we built. People should know our name."`,
    person,
    choices: [
      {
        label: 'Send them ($25,000)',
        hint: 'A week of their output, and a lot of new followers.',
        news: `${person.name} gave a talk about your work, and the room filled up.`,
        effects: { money: -25_000, followers: 6_000, sabbaticalFor: person.id, moraleFor: { id: person.id, delta: 20 } },
      },
      {
        label: 'We need them here',
        hint: 'Nobody outside hears about it.',
        news: `${person.name} skipped the conference.`,
        effects: { moraleFor: { id: person.id, delta: -10 } },
      },
    ],
  }
}

function friendAsk(person: Staff): PendingEvent {
  return {
    id: id(),
    icon: '💬',
    title: `${person.name} knows somebody`,
    text: `"Someone I used to work with is leaving their lab. They are better than me. Want me to make the call?"`,
    person,
    choices: [
      {
        label: 'Make the call ($40,000 finder fee)',
        hint: 'A strong hire walks in, if there is a desk free.',
        news: `${person.name} brought somebody in from their old lab.`,
        effects: { money: -40_000, hireRole: person.role, moraleFor: { id: person.id, delta: 14 } },
      },
      {
        label: 'Not right now',
        hint: 'Costs nothing.',
        news: `${person.name}'s friend went somewhere else.`,
        effects: { moraleFor: { id: person.id, delta: -8 } },
      },
    ],
  }
}

function kitAsk(person: Staff): PendingEvent {
  return {
    id: id(),
    icon: '💬',
    title: `${person.name} needs better kit`,
    text: `"My machine takes four minutes to start. I am not asking for much. I just want to work."`,
    person,
    choices: [
      {
        label: 'Buy it ($12,000)',
        hint: 'Cheap, and they remember it.',
        news: `${person.name} got the machine they asked for.`,
        effects: { money: -12_000, moraleFor: { id: person.id, delta: 16 } },
      },
      {
        label: 'Make do',
        hint: 'It is only a laptop.',
        news: `${person.name} is still waiting on that machine.`,
        effects: { moraleFor: { id: person.id, delta: -9 } },
      },
    ],
  }
}

/** The one you cannot ignore: they are leaving unless you move. */
export function resignationEvent(state: GameState, person: Staff, week: number): PendingEvent {
  const market = marketSalaryFor(person.role, staffPower(person), week)
  const counter = Math.round(Math.max(market, person.salary) * 1.2)
  return {
    id: `notice-${person.id}-${week}`,
    icon: '🚪',
    title: `${person.name} has handed in their notice`,
    text:
      `"I have taken something else. It is not only the money — it has not been good here for a while." ` +
      `They work ${NOTICE_WEEKS} more weeks either way.`,
    person,
    choices: [
      {
        label: `Counter-offer ${money(counter)}/wk`,
        hint: 'A big raise, and they tear up the offer.',
        news: `${person.name} tore up their resignation.`,
        effects: {
          keepStaffId: person.id,
          keepStaffSalary: counter,
          cancelNoticeFor: person.id,
          moraleFor: { id: person.id, delta: 45 },
        },
        disabled: state.money < counter * 4,
      },
      {
        label: 'Let them go',
        hint: `They finish in ${NOTICE_WEEKS} weeks and take everything they know.`,
        news: `${person.name} is working their notice.`,
        effects: {},
      },
    ],
  }
}
