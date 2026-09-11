import type { Competitor, CompetitorModel } from './types'
import {
  COMPETITOR_MAX_MODELS,
  MARKET_GROWTH_PER_WEEK,
  RIVAL_ELECTRICITY,
  RIVAL_FOLLOWERS_PER_MARKETER,
  RIVAL_GPUS_PER_ENGINEER,
  RIVAL_GPU_COST,
  RIVAL_HIRE_RUNWAY,
  RIVAL_MAX_STAFF,
  RIVAL_QUALITY_SOFTNESS,
  RIVAL_RESEARCH_COST,
  RIVAL_RESEARCH_PER_RESEARCHER,
  RIVAL_RUNWAY_WEEKS,
  RIVAL_PAYROLL_SHARE,
  RIVAL_REV_PER_USER,
  RIVAL_SALARY,
  RIVAL_START_CHANCE,
  RIVAL_SUCCESSION,
  RIVAL_TRAIN_MAX_WEEKS,
  RIVAL_TRAIN_MIN_WEEKS,
} from './constants'

export const MARKET_CAP_BASE: Record<string, number> = {
  general: 2_000_000,
  coding: 1_000_000,
  image: 1_500_000,
  agent: 800_000,
}

export function marketCap(typeId: string, week: number): number {
  const base = MARKET_CAP_BASE[typeId] ?? 1_000_000
  return Math.round(base * (1 + week * MARKET_GROWTH_PER_WEEK))
}

export function competitorCustomers(competitors: Competitor[], typeId: string, week: number): number {
  let sum = 0
  for (const c of competitors) {
    for (const m of c.models) {
      if (m.releaseWeek <= week && m.typeId === typeId) sum += m.customers
    }
  }
  return sum
}

/**
 * The best model the rest of the world has released. Rivals polish their models
 * every week and ship successors, so this bar keeps rising, and anything of yours
 * sitting below it starts losing users to whatever is better.
 */
export function stateOfTheArt(competitors: Competitor[], week: number): number {
  let best = 0
  for (const c of competitors) {
    for (const m of c.models) {
      if (m.releaseWeek <= week && m.quality > best) best = m.quality
    }
  }
  return best
}

export function marketSaturation(typeId: string, week: number, playerCustomers: number, competitors: Competitor[]): number {
  const total = playerCustomers + competitorCustomers(competitors, typeId, week)
  const cap = marketCap(typeId, week)
  return Math.max(0.05, Math.min(1, 1 - total / cap))
}

const MODEL_SUFFIXES = ['Pro', 'Ultra', 'Max', '2', 'X', 'Turbo', '+', 'Neo']

/**
 * What a rival can build right now, out of what they have actually invested in:
 * research levels, researchers thinking, engineers building and cards to build
 * on. Softened the same way the player's quality is, so nobody runs away with it.
 */
export function rivalQuality(c: Competitor): number {
  const raw =
    c.researchLevel * 9 +
    c.staff.researcher * 3 +
    c.staff.engineer * 2 +
    Math.sqrt(Math.max(0, c.gpus)) * 4
  return Math.round(100 * (1 - Math.exp(-raw / RIVAL_QUALITY_SOFTNESS)))
}

/**
 * The headcount they are aiming for. A lab hires on two things: what its
 * products bring in, and what is in the bank. A well funded shop with no users
 * still staffs up, which is exactly how the real ones did it.
 */
function hiringTarget(c: Competitor): number {
  const fromRevenue = (rivalRevenue(c) * RIVAL_PAYROLL_SHARE * c.ambition) / RIVAL_SALARY
  const fromBank = c.money / (RIVAL_SALARY * RIVAL_RUNWAY_WEEKS)
  return Math.min(RIVAL_MAX_STAFF, Math.max(4, Math.round(Math.max(fromRevenue, fromBank))))
}

export function rivalStaffCount(c: Competitor): number {
  return c.staff.researcher + c.staff.engineer + c.staff.marketer + c.staff.lawyer
}

function rivalRevenue(c: Competitor): number {
  const users = c.models.reduce((sum, m) => sum + m.customers, 0)
  return users * RIVAL_REV_PER_USER
}

/** Which role they are short of, in the order a lab actually feels the gap. */
function roleToHire(c: Competitor): keyof Competitor['staff'] {
  const s = c.staff
  if (s.engineer < s.researcher * 0.8) return 'engineer'
  if (s.researcher < s.engineer * 0.9) return 'researcher'
  if (s.marketer < rivalStaffCount(c) * 0.15) return 'marketer'
  if (s.lawyer < rivalStaffCount(c) * 0.08) return 'lawyer'
  return Math.random() < 0.5 ? 'researcher' : 'engineer'
}

export interface RivalWeek {
  competitor: Competitor
  /** things worth putting in the news feed, at most one per rival per week */
  news: string | null
}

/**
 * One week inside a rival company. They take money in from the people using
 * their models, pay for the people and the power, and spend what is left on
 * hiring, hardware, research and the next model. Everything they ship comes out
 * of this, so a lab that is starved of money falls behind and a rich one runs.
 */
export function runRivalWeek(c: Competitor, week: number, growthMult: number): RivalWeek {
  let money = c.money + rivalRevenue(c)
  const staff = { ...c.staff }
  let gpus = c.gpus
  let researchPoints = c.researchPoints
  let researchLevel = c.researchLevel
  let training = c.training
  let followers = c.followers
  let news: string | null = null

  money -= rivalStaffCount(c) * RIVAL_SALARY
  money -= gpus * RIVAL_ELECTRICITY

  // hiring, one head at a time, only with the runway to keep paying them
  if (rivalStaffCount(c) < hiringTarget(c) && money > RIVAL_SALARY * RIVAL_HIRE_RUNWAY) {
    const role = roleToHire({ ...c, staff })
    staff[role] += 1
    money -= RIVAL_SALARY * 2 // what it costs to get someone through the door
    if (Math.random() < 0.12) {
      news = `${c.icon} ${c.name} is hiring — that is ${rivalStaffCount({ ...c, staff })} people on their payroll now.`
    }
  }

  // cards, so the engineers have something to build on
  const wantGpus = staff.engineer * RIVAL_GPUS_PER_ENGINEER
  if (gpus < wantGpus && money > RIVAL_GPU_COST * 8) {
    const batch = Math.min(8, wantGpus - gpus)
    gpus += batch
    money -= batch * RIVAL_GPU_COST
  }

  // research, which is what actually raises the ceiling on what they can ship
  researchPoints += staff.researcher * RIVAL_RESEARCH_PER_RESEARCHER * c.ambition
  // each level costs more than the last, so nobody runs to the ceiling in a year
  const nextLevelCost = RIVAL_RESEARCH_COST * (researchLevel + 1)
  if (researchPoints >= nextLevelCost) {
    researchPoints -= nextLevelCost
    researchLevel += 1
    if (!news && Math.random() < 0.3) {
      news = `${c.icon} ${c.name} published a paper. Their next model just got better.`
    }
  }

  // marketing
  followers += Math.round(staff.marketer * RIVAL_FOLLOWERS_PER_MARKETER * c.ambition)

  // the next model
  let shipped: CompetitorModel | null = null
  if (training) {
    const weeksLeft = training.weeksLeft - 1
    if (weeksLeft <= 0) {
      shipped = {
        id: training.id,
        name: training.name,
        icon: '✨',
        typeId: training.typeId,
        quality: Math.min(99, rivalQuality(c)),
        customers: 0,
        growthBase: 1300 + Math.min(2800, rivalStaffCount(c) * 90),
        releaseWeek: week,
      }
      training = null
    } else {
      training = { ...training, weeksLeft }
    }
  } else if (staff.engineer >= 1 && gpus >= 4 && Math.random() < RIVAL_START_CHANCE) {
    const weeks = Math.round(
      Math.max(
        RIVAL_TRAIN_MIN_WEEKS,
        Math.min(RIVAL_TRAIN_MAX_WEEKS, 260 / Math.max(1, gpus / 8 + staff.engineer)),
      ),
    )
    const suffix = MODEL_SUFFIXES[Math.floor(Math.random() * MODEL_SUFFIXES.length)]
    const types = week < 26 ? ['general', 'general', 'coding', 'image'] : ['general', 'coding', 'image', 'agent']
    training = {
      id: `${c.id}-${week}-${Math.floor(Math.random() * 1000)}`,
      name: `${c.name} ${suffix}`,
      typeId: types[Math.floor(Math.random() * types.length)],
      weeksLeft: weeks,
      totalWeeks: weeks,
    }
  }

  let models = c.models
  if (shipped) {
    // A lab does not run five growing products at once. The new one takes over
    // from whatever it replaces: most of those users move, and the old model
    // becomes a legacy product that barely grows.
    let inherited = 0
    models = models.map((m) => {
      if (m.typeId !== shipped!.typeId || m.releaseWeek > week) return m
      const moving = Math.round(m.customers * RIVAL_SUCCESSION)
      inherited += moving
      return { ...m, customers: m.customers - moving, growthBase: Math.round(m.growthBase * 0.3) }
    })
    models = [...models, { ...shipped, customers: shipped.customers + inherited }]
    if (models.length > COMPETITOR_MAX_MODELS) {
      // and the oldest thing they sell is finally retired
      const oldest = models.reduce((a, b) => (a.releaseWeek <= b.releaseWeek ? a : b))
      models = models
        .filter((m) => m.id !== oldest.id)
        .map((m) => (m.id === shipped!.id ? { ...m, customers: m.customers + oldest.customers } : m))
    }
    news = `${c.icon} ${c.name} released ${shipped.name} (quality ${shipped.quality}).`
  }

  void growthMult
  return {
    competitor: {
      ...c,
      money,
      staff,
      gpus,
      researchPoints,
      researchLevel,
      training,
      followers,
      models,
    },
    news,
  }
}

export function generateCompetitorModel(competitor: Competitor, week: number): CompetitorModel {
  const suffix = MODEL_SUFFIXES[Math.floor(Math.random() * MODEL_SUFFIXES.length)]
  const name = `${competitor.name} ${suffix}`
  const types = week < 26 ? ['general', 'general', 'coding', 'image'] : ['general', 'coding', 'image', 'agent']
  const typeId = types[Math.floor(Math.random() * types.length)]
  const quality = Math.round(55 + Math.random() * 25 + Math.min(15, week / 4))
  const growthBase = 4000 + Math.random() * 8000
  return {
    id: `${competitor.id}-${week}-${Math.floor(Math.random() * 1000)}`,
    name,
    icon: '✨',
    typeId,
    quality,
    customers: 0,
    growthBase,
    releaseWeek: week,
  }
}

function model(id: string, name: string, icon: string, typeId: string, quality: number, customers: number, growthBase: number, releaseWeek: number): CompetitorModel {
  return { id, name, icon, typeId, quality, customers, growthBase, releaseWeek }
}

/**
 * The company behind the logo. Seeds carry the shape of a real lab at the start
 * of 2022: a big one has people, money and cards, a scrappy one has a few of
 * each, and from week one they all run themselves.
 */
function lab(
  base: { id: string; name: string; icon: string; followers: number; models: CompetitorModel[] },
  size: { researcher: number; engineer: number; marketer: number; lawyer: number },
  extras: { money: number; gpus: number; researchLevel: number; ambition: number; aggression: number },
): Competitor {
  return {
    ...base,
    staff: size,
    money: extras.money,
    gpus: extras.gpus,
    researchPoints: 0,
    researchLevel: extras.researchLevel,
    training: null,
    ambition: extras.ambition,
    aggression: extras.aggression,
  }
}

export const COMPETITOR_SEED: Competitor[] = [
  lab(
    {
      id: 'closedai',
      followers: 300000,
      name: 'ClosedAI',
      icon: '🔒',
      models: [
        model('chatpt', 'ChatPT', '💬', 'general', 90, 180000, 4500, 1),
        model('dolle', 'Doll-E', '🎨', 'image', 82, 70000, 3000, 1),
      ],
    },
    { researcher: 9, engineer: 11, marketer: 5, lawyer: 3 },
    { money: 14_000_000, gpus: 90, researchLevel: 6, ambition: 1.35, aggression: 0.85 },
  ),
  lab(
    {
      id: 'gargle',
      followers: 250000,
      name: 'Gargle Brain',
      icon: '🧠',
      models: [model('geminix', 'Geminix', '♊', 'general', 85, 140000, 4000, 1)],
    },
    { researcher: 11, engineer: 9, marketer: 4, lawyer: 4 },
    { money: 18_000_000, gpus: 80, researchLevel: 5, ambition: 1.4, aggression: 0.4 },
  ),
  lab(
    {
      id: 'anpolus',
      followers: 200000,
      name: 'Anpolus',
      icon: '🐝',
      models: [model('clawd', 'Clawd', '🤝', 'general', 88, 120000, 3800, 1)],
    },
    { researcher: 10, engineer: 7, marketer: 3, lawyer: 3 },
    { money: 9_000_000, gpus: 60, researchLevel: 6, ambition: 1.1, aggression: 0.25 },
  ),
  lab(
    {
      id: 'deeppeek',
      followers: 150000,
      name: 'DeepPeek',
      icon: '🔍',
      models: [
        model('deeppeekcoder', 'DeepPeek-Coder', '💻', 'coding', 80, 50000, 2600, 1),
        model('deeppeekv', 'DeepPeek-V', '🔍', 'general', 82, 40000, 2800, 1),
      ],
    },
    { researcher: 8, engineer: 8, marketer: 2, lawyer: 1 },
    { money: 5_000_000, gpus: 45, researchLevel: 4, ambition: 1.25, aggression: 0.55 },
  ),
  lab(
    {
      id: 'mistrall',
      followers: 80000,
      name: 'Mistrall',
      icon: '🌬️',
      models: [model('mistralllarge', 'Mistrall Large', '💨', 'general', 78, 30000, 2200, 1)],
    },
    { researcher: 5, engineer: 5, marketer: 2, lawyer: 1 },
    { money: 3_000_000, gpus: 26, researchLevel: 3, ambition: 1, aggression: 0.3 },
  ),
  lab(
    {
      id: 'xlab',
      followers: 60000,
      name: 'xLab',
      icon: '🚀',
      models: [model('grak', 'Grak', '🛰️', 'general', 75, 20000, 1800, 1)],
    },
    { researcher: 4, engineer: 6, marketer: 3, lawyer: 1 },
    { money: 6_000_000, gpus: 30, researchLevel: 2, ambition: 1.2, aggression: 0.9 },
  ),
]

