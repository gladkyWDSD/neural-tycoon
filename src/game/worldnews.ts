import type { GameState } from './types'

/**
 * The world outside your office, which does not care about you.
 *
 * None of this changes the simulation. It is here because a company that only
 * ever hears about itself feels like a spreadsheet, and a feed that carries
 * rockets, lawsuits and a man who ate a hard drive feels like a place.
 *
 * The famous names are parodies, the way ClosedAI and Gargle Brain are, so
 * nothing here puts words in a real person's mouth.
 */

type Pick = (state: GameState, week: number) => string

const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)]

const BIG_NAMES = [
  'Elon Tusk',
  'Jeff Bezops',
  'Mark Suckerburger',
  'Tim Cooke',
  'Sam Allmen',
  'Satya Nutella',
  'Jensen Wong',
  'Larry Paige-Break',
]

const COUNTRIES = ['Japan', 'Norway', 'Brazil', 'Estonia', 'New Zealand', 'Portugal', 'Korea', 'Canada']

const ANIMALS = ['a goose', 'a raccoon', 'a very large cat', 'three ducks', 'a golden retriever', 'an emu']

/** Absurd, and the point. */
const NONSENSE: Pick[] = [
  () => `${pick(BIG_NAMES)} launched another rocket at Mars. It got halfway and turned around.`,
  () => `${pick(BIG_NAMES)} announced a phone with no screen. Pre-orders are apparently strong.`,
  () => `${pick(BIG_NAMES)} bought a small country's entire supply of sand. Nobody will say why.`,
  () => `A man in ${pick(COUNTRIES)} ate a hard drive to prove a point. The point is unclear.`,
  () => `${pick(ANIMALS).replace(/^a /, 'A ').replace(/^three /, 'Three ')} got into a datacenter in ${pick(COUNTRIES)} and took out half the internet for nine minutes.`,
  () => `${pick(BIG_NAMES)} says the future is a cube. He would not elaborate.`,
  () => `Scientists in ${pick(COUNTRIES)} taught a fish to use a keyboard. It has opinions.`,
  () => `A startup raised $400M to deliver ice cream by drone. The drones melt it.`,
  () => `Someone paid $2.3M for a JPEG of a sandwich. The sandwich has since been eaten.`,
  () => `${pick(BIG_NAMES)} challenged ${pick(BIG_NAMES)} to a cage fight. Again.`,
  () => `A man has been living inside an airport in ${pick(COUNTRIES)} for eleven months, running a server.`,
  () => `The world's largest spreadsheet crashed, taking a national holiday schedule with it.`,
  () => `A crypto coin named after ${pick(ANIMALS)} briefly overtook a mid-sized bank.`,
  () => `An AI-generated song about tax filing reached number one in ${pick(COUNTRIES)}.`,
]

/** Things that could plausibly be in a tech paper. */
const TECH: Pick[] = [
  () => `A lab in ${pick(COUNTRIES)} claims a model that runs on a phone and beats last year's best.`,
  () => `Chip shortage eases. Analysts say it will be back by winter.`,
  () => `A leaked memo says ${pick(BIG_NAMES)} thinks AI is "either everything or nothing".`,
  () => `Open-weights release of the week: a 30B model trained entirely on cookbooks.`,
  () => `Benchmark scandal: three labs were testing on the answer key.`,
  () => `A new paper says scaling laws bend at the top. Everyone disagrees loudly.`,
  () => `GPU prices climbed again. Somewhere a procurement manager is crying.`,
  () => `Researchers found a prompt that makes every model in the world talk like a pirate.`,
  () => `A fine-tuned model passed a bar exam, then failed a parking ticket appeal.`,
  () => `Data labelling union formed in ${pick(COUNTRIES)}. The industry is nervous.`,
]

/** Money, markets and the people who talk about them. */
const MARKET: Pick[] = [
  () => `Markets closed up. Nobody knows why, and everyone has a theory.`,
  () => `An analyst downgraded the whole sector using the phrase "vibes-based capex".`,
  () => `Venture capital is pouring into AI again. The term sheets are getting shorter.`,
  () => `A pension fund quietly bought half a datacenter. Returns are "under review".`,
  () => `Another AI startup raised at a valuation with more digits than employees.`,
  () => `Two labs merged this week. The logo is worse than both.`,
]

/** Politics and regulation, without naming anyone real. */
const POLITICS: Pick[] = [
  () => `A committee in ${pick(COUNTRIES)} spent six hours asking what a token is.`,
  () => `A minister called for AI to be "switched off at weekends".`,
  () => `Two governments announced the same AI treaty an hour apart, with different numbers.`,
  () => `A new watchdog was formed. It has a website and no staff.`,
]

/** The office, when there is an office to talk about. */
const OFFICE: Pick[] = [
  (state) => `Someone left ${pick(['a mug', 'half a sandwich', 'a whiteboard marker', 'a laptop'])} in the kitchen at ${state.companyName}. It has been there a week.`,
  () => `The building's fire alarm went off during a training run. Nothing caught fire.`,
  () => `A pigeon got into the office. It has been named and given a desk.`,
  () => `The lift is out again. Everyone is very fit now.`,
]

const SEASONAL: Pick[] = [
  () => `Conference season. Half the industry is in a hotel lobby arguing about attention heads.`,
  () => `End of year. Every lab is promising something enormous in January.`,
  () => `Summer lull. Nothing shipped anywhere for two weeks and everyone pretended not to notice.`,
]

/** A line about somebody who actually works for you. */
const STAFF: Pick[] = [
  (state) => {
    const who = pick(state.staff)
    return `${who.name} ${pick([
      'was quoted in a trade magazine and is unbearable about it',
      'rewrote something over the weekend that nobody asked for, and it is better',
      'has started bringing in a proper lunch and everyone is jealous',
      'gave a talk at a meetup and got one difficult question',
      'has been listening to the same album for nine days',
    ])}.`
  },
]

const POOLS: { weight: number; lines: Pick[]; needsStaff?: boolean }[] = [
  { weight: 4, lines: NONSENSE },
  { weight: 3, lines: TECH },
  { weight: 2, lines: MARKET },
  { weight: 1, lines: POLITICS },
  { weight: 2, lines: OFFICE },
  { weight: 2, lines: STAFF, needsStaff: true },
]

/**
 * One headline from the world, or null. Seasonal lines win when the date says
 * so, because a feed that knows what time of year it is feels like it is set
 * somewhere real.
 */
export function pickWorldNews(state: GameState, week: number): string | null {
  const inSeason =
    state.date.week >= 47 ? SEASONAL[1] : state.date.week >= 28 && state.date.week <= 31 ? SEASONAL[2] : null
  if (inSeason && Math.random() < 0.4) return inSeason(state, week)
  if (state.date.week >= 44 && state.date.week <= 46 && Math.random() < 0.4) return SEASONAL[0](state, week)

  const usable = POOLS.filter((p) => !p.needsStaff || state.staff.length > 0)
  const total = usable.reduce((sum, p) => sum + p.weight, 0)
  let roll = Math.random() * total
  for (const pool of usable) {
    roll -= pool.weight
    if (roll <= 0) return pick(pool.lines)(state, week)
  }
  return null
}

/** Rivals talking about each other, which is how you know they are real. */
const GOSSIP = [
  (a: string, b: string) => `${a} accused ${b} of copying their architecture. ${b} says it is "convergent design".`,
  (a: string, b: string) => `${a} poached three people from ${b} in one afternoon.`,
  (a: string, b: string) => `${a} and ${b} are in a public argument about benchmarks. Neither will publish the numbers.`,
  (a: string, b: string) => `${a} quietly dropped a price under ${b}. Nobody has blinked yet.`,
  (a: string, b: string) => `${b} says ${a}'s new model is "fine, I suppose". The internet did not take it well.`,
  (a: string) => `${a} announced a partnership with a company nobody has heard of.`,
  (a: string) => `${a}'s chief scientist left to start something. Nobody knows what.`,
]

export function pickRivalGossip(names: string[]): string | null {
  if (names.length < 2) return null
  const a = pick(names)
  const rest = names.filter((n) => n !== a)
  const b = pick(rest)
  const line = pick(GOSSIP)
  return line(a, b)
}

/** Milestones worth saying out loud, in the order they are crossed. */
export const USER_MILESTONES = [10_000, 100_000, 1_000_000, 10_000_000, 50_000_000, 100_000_000]
export const FOLLOWER_MILESTONES = [10_000, 100_000, 1_000_000, 10_000_000]

export function milestoneLine(kind: 'users' | 'followers', value: number, company: string): string {
  const pretty = value >= 1_000_000 ? `${value / 1_000_000}M` : `${value / 1_000}k`
  return kind === 'users'
    ? `${company} passed ${pretty} people using its AI. The press noticed.`
    : `${company} passed ${pretty} followers. The feed is out of control.`
}
