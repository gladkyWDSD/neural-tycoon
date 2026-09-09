import type { AIModel, GameEvent, GameState, PostType, PricingModel, PromoKind, Staff } from './types'
import {
  DESKS_PER_LEVEL,
  CAMPAIGN_COOLDOWN,
  DISTILL_ACCUSER_FOLLOWER_GAIN,
  CAMPAIGN_COST,
  CAMPAIGN_DURATION,
  BOT_ATTACK_BACKFIRE_CHANCE,
  BOT_ATTACK_COOLDOWN,
  BOT_ATTACK_COST,
  COMPETITOR_BOT_ATTACK_CHANCE,
  COMPETITOR_BOT_ATTACK_GRACE_WEEKS,
  COMPETITOR_BOT_CHANCE,
  COMPETITOR_BOT_MARKETER_DEFENSE,
  COMPETITOR_BOT_MIN_CHANCE,
  COMPETITOR_BOT_TRACE_CHANCE,
  COMPETITOR_POACH_BASE_CHANCE,
  COMPETITOR_POACH_GRACE_WEEKS,
  HACKER_CAUGHT_CHANCE,
  HACKER_COOLDOWN,
  HACKER_COST,
  HACKER_FINE,
  HACKER_QUALITY_DAMAGE,
  JOURNALIST_COOLDOWN,
  JOURNALIST_COST,
  DISCOUNT_CONVERSION,
  DISCOUNT_COST,
  DISCOUNT_DURATION,
  DISCOUNT_GROWTH_MULT,
  DISCOUNT_REV_MULT,
  FREE_TRIAL_CONVERSION,
  FREE_TRIAL_COST,
  FREE_TRIAL_DURATION,
  FREE_TRIAL_GROWTH_MULT,
  FREE_TRIAL_REV_MULT,
  HYPE_BOTS_BUST_CHANCE,
  HYPE_BOTS_COOLDOWN,
  HYPE_BOTS_COST,
  HYPE_BOTS_FOLLOWERS,
  INVESTMENT_COOLDOWN_WEEKS,
  LOBBY_COOLDOWN,
  LOBBY_COST,
  LOBBY_DURATION,
  LOBBY_REPEAL_CHANCE,
  LOBBY_RISK_REDUCTION,
  MAX_ACTIVE_REGULATIONS,
  MAX_OFFICE_LEVEL,
  MAX_SCORE,
  OFFICE_UPGRADE_BASE_COST,
  REGULATION_BASE_DATACENTER_SHUTDOWN_CHANCE,
  REGULATION_CHECK_CHANCE,
  REGULATION_START_WEEK,
  START_DATE,
  START_MONEY,
  START_YEAR,
  STAFF_TRAINING_COST_PER_POINT,
  STAFF_TRAINING_SCORE_GAIN,
  STAFF_TRAINING_WEEKS,
  WEEKS_PER_YEAR,
} from './constants'
import { advanceWeek } from './date'
import { DATA_TIER_MAP, BOOK_MAP, MODEL_TYPE_MAP, PRICING_MAP, RESEARCH_ITEMS, RESEARCH_MAP } from './research'
import {
  COMPETITOR_CLAPBACKS,
  COMPETITOR_REACTION_CHANCE,
  COMPETITOR_SMEAR_REACTION_CHANCE,
  POST_TYPE_MAP,
  TRENDING_BONUS_MULTIPLIER,
  TRENDING_ROTATE_WEEKS,
  followerBoost,
  followerGain,
  pickTrendingHashtag,
  usesTrendingHashtag,
} from './social'
import { DATACENTER_BUILD_WEEKS, DATACENTER_COST, ELECTRICITY_PER_CARD_WEEK, GPU_CARD_COST, RAM_COST, RENT_DISPUTE_CHANCE, RENT_WEEKLY_FEE, SSD_COST, activeCards, gpuQualityFactor, ssdQualityBonus } from './gpu'
import { COMPETITOR_SEED, generateCompetitorModel, marketSaturation } from './competitors'
import { pickRandomEvent } from './events'
import { generateCandidate, marketSalaryFor } from './hiring'
import {
  distillCaughtChance,
  distillCost,
  distillTargets,
  distillFine,
  distillFollowerLoss,
  distilledQuality,
  isDistillUnlocked,
} from './distill'
import {
  REGULATION_MAP,
  pickNewRegulation,
  regulationDatacenterShutdownChance,
  regulationElectricityMultiplier,
  regulationFineRoll,
  regulationGpuCostMultiplier,
  regulationRevenueMultiplier,
} from './regulations'

const FLAVOR_NEWS = [
  '🚀 AI hype is surging — the whole market keeps growing.',
  '💰 Venture capital pours billions into AI startups.',
  '📰 Tech press raves about the latest AI breakthroughs.',
  '🔒 ClosedAI announces a massive new datacenter.',
  '🧠 Gargle Brain hires top researchers.',
  '🐝 Anpolus claims its AI is the safest in the world.',
  '🔍 DeepPeek open-sources a small model.',
  '🌬️ Mistrall signs enterprise deals.',
  '🚀 xLab teases a new flagship model.',
  '📈 Enterprise adoption of AI accelerates.',
  '🏦 Banks start using AI for trading.',
  '🎓 Universities add AI courses.',
]

export function initialState(): GameState {
  return {
    screen: 'title',
    companyName: '',
    money: START_MONEY,
    date: { ...START_DATE },
    staff: [],
    paused: false,
    researched: [],
    researching: [],
    staffTraining: [],
    models: [],
    followers: 0,
    posts: [],
    lastPostWeek: 0,
    trendingHashtag: pickTrendingHashtag(),
    trendingSetWeek: 0,
    lastHypeBotsWeek: -HYPE_BOTS_COOLDOWN,
    lastInvestmentWeek: -INVESTMENT_COOLDOWN_WEEKS,
    lastBotAttackWeek: -BOT_ATTACK_COOLDOWN,
    lastHackerWeek: -HACKER_COOLDOWN,
    lastJournalistWeek: -JOURNALIST_COOLDOWN,
    gpuCards: 0,
    datacenters: 0,
    datacenterBuilds: [],
    rentedDatacenters: 0,
    ram: 0,
    ssd: 0,
    poached: [],
    officeLevel: 1,
    isPublic: false,
    campaignWeeksLeft: 0,
    lastCampaignWeek: -CAMPAIGN_COOLDOWN,
    books: [],
    competitors: COMPETITOR_SEED.map((c) => ({ ...c, models: c.models.map((m) => ({ ...m })) })),
    events: [],
    pendingEvent: null,
    activeRegulations: [],
    lobbyWeeksLeft: 0,
    lastLobbyWeek: -LOBBY_COOLDOWN,
  }
}

export type Action =
  | { type: 'NEW_GAME' }
  | { type: 'LOAD_STATE'; state: GameState }
  | { type: 'SET_COMPANY_NAME'; name: string }
  | { type: 'TICK' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'HIRE_STAFF'; staff: Staff }
  | { type: 'START_RESEARCH'; id: string }
  | { type: 'START_MODEL'; model: AIModel }
  | { type: 'PUBLISH_MODEL'; id: string; pricing: PricingModel }
  | { type: 'MAKE_POST'; text: string; postType: PostType }
  | { type: 'SMEAR'; competitorId: string }
  | { type: 'RESOLVE_EVENT'; id: string; choiceIndex: number }
  | { type: 'BUY_GPU'; count: number }
  | { type: 'BUY_RAM'; count: number }
  | { type: 'BUY_SSD'; count: number }
  | { type: 'POACH'; competitorId: string }
  | { type: 'BUILD_DATACENTER' }
  | { type: 'RENT_DATACENTER' }
  | { type: 'UPGRADE_OFFICE' }
  | { type: 'IPO' }
  | { type: 'LAUNCH_CAMPAIGN' }
  | { type: 'BUY_BOOK'; id: string }
  | { type: 'BUY_HYPE_BOTS' }
  | { type: 'BOT_ATTACK'; competitorId: string }
  | { type: 'HIRE_HACKERS'; competitorId: string }
  | { type: 'HIRE_JOURNALISTS' }
  | { type: 'START_STAFF_TRAINING'; staffId: string }
  | { type: 'RAISE_INVESTMENT' }
  | { type: 'START_PROMO'; modelId: string; kind: PromoKind }
  | { type: 'EDIT_MODEL'; id: string; name?: string; pricing?: PricingModel }
  | { type: 'HIRE_LOBBYISTS' }
  | { type: 'SET_GPU'; count: number }
  | { type: 'SET_DATACENTERS'; count: number }
  | { type: 'SET_WEEK'; week: number }
  | { type: 'SET_MONEY'; money: number }
  | { type: 'ADD_MONEY'; amount: number }
  | { type: 'FINISH_ALL' }
  | { type: 'RESEARCH_ALL' }

export function isResearchAvailable(id: string, researched: string[], researching: string[]): boolean {
  const item = RESEARCH_MAP[id]
  if (!item) return false
  if (researched.includes(id) || researching.includes(id)) return false
  return item.requires.every((r) => researched.includes(r))
}

export function avgScoreByRole(staff: Staff[], role: Staff['role']): number {
  const list = staff.filter((s) => s.role === role)
  if (list.length === 0) return 0
  return list.reduce((sum, s) => sum + s.examScore, 0) / list.length
}

export function globalWeek(state: GameState): number {
  return (state.date.year - START_DATE.year) * WEEKS_PER_YEAR + state.date.week
}

export function maxStaff(state: GameState): number {
  return state.officeLevel * DESKS_PER_LEVEL
}

export function migrateState(raw: Partial<GameState>): GameState {
  const base = initialState()
  const models = (raw.models ?? []).map((m) => {
    const old = m as Partial<AIModel>
    return {
      ...m,
      gpus: old.gpus ?? 4,
      customers: old.customers ?? 0,
      freeCustomers: old.freeCustomers ?? 0,
      pricing: old.pricing,
      totalWeeks: old.totalWeeks ?? old.weeksRemaining ?? 6,
    }
  })
  const researching = (raw.researching ?? []).map((r) => ({
    ...r,
    totalWeeks: r.totalWeeks ?? r.weeksRemaining ?? 1,
  }))
  return {
    ...base,
    ...raw,
    date: raw.date ?? base.date,
    staff: raw.staff ?? base.staff,
    models,
    researching,
    staffTraining: raw.staffTraining ?? [],
    competitors: (raw.competitors ?? base.competitors).map((c) => ({ ...c, followers: c.followers ?? 100000 })),
    events: raw.events ?? base.events,
    trendingHashtag: raw.trendingHashtag ?? base.trendingHashtag,
    trendingSetWeek: raw.trendingSetWeek ?? 0,
    lastHypeBotsWeek: raw.lastHypeBotsWeek ?? -HYPE_BOTS_COOLDOWN,
    lastInvestmentWeek: raw.lastInvestmentWeek ?? -INVESTMENT_COOLDOWN_WEEKS,
    lastBotAttackWeek: raw.lastBotAttackWeek ?? -BOT_ATTACK_COOLDOWN,
    lastHackerWeek: raw.lastHackerWeek ?? -HACKER_COOLDOWN,
    lastJournalistWeek: raw.lastJournalistWeek ?? -JOURNALIST_COOLDOWN,
    rentedDatacenters: raw.rentedDatacenters ?? 0,
    ram: raw.ram ?? 0,
    ssd: raw.ssd ?? 0,
    poached: raw.poached ?? [],
    officeLevel: raw.officeLevel ?? 1,
    isPublic: raw.isPublic ?? false,
    campaignWeeksLeft: raw.campaignWeeksLeft ?? 0,
    lastCampaignWeek: raw.lastCampaignWeek ?? -CAMPAIGN_COOLDOWN,
    books: raw.books ?? [],
    activeRegulations: raw.activeRegulations ?? [],
    lobbyWeeksLeft: raw.lobbyWeeksLeft ?? 0,
    lastLobbyWeek: raw.lastLobbyWeek ?? -LOBBY_COOLDOWN,
  }
}

function computeQuality(state: GameState, gpus: number, dataTier?: string, distillQuality?: number): number {
  const avgResearcher = avgScoreByRole(state.staff, 'researcher')
  const avgEngineer = avgScoreByRole(state.staff, 'engineer')
  const factor = gpuQualityFactor(gpus)
  const techBonus = state.researched.reduce((sum, id) => sum + (RESEARCH_MAP[id]?.qualityBonus ?? 0), 0)
  const dataQuality = dataTier ? (DATA_TIER_MAP[dataTier]?.quality ?? 0) : 0
  const booksBonus = state.books.reduce((sum, id) => sum + (BOOK_MAP[id]?.quality ?? 0), 0)
  const ceiling = 40 + avgResearcher * 0.3
  const realization = 0.5 + avgEngineer / 400
  let q = ceiling * realization * factor + techBonus + dataQuality + ssdQualityBonus(state.ssd) + booksBonus
  if (distillQuality != null) q = distilledQuality(q, distillQuality)
  return Math.max(0, Math.min(100, Math.round(q)))
}

export function investmentRaiseAmount(state: GameState): number {
  const totalCustomers = state.models.reduce((sum, m) => sum + (m.status === 'published' ? m.customers : 0), 0)
  return Math.round(300000 + totalCustomers * 10 + state.followers * 20 + state.researched.length * 50000)
}

export function companyEfficiency(state: GameState): number {
  const avgEngineer = avgScoreByRole(state.staff, 'engineer')
  const researchBonus = state.researched.reduce((sum, id) => sum + (RESEARCH_MAP[id]?.efficiencyBonus ?? 0), 0)
  return Math.min(0.6, (avgEngineer > 0 ? avgEngineer * 0.001 : 0) + researchBonus)
}

function ecoProtest(state: GameState, chance: number, message: string): GameState {
  if (Math.random() >= chance) return state
  const ratio = 0.01 + Math.random() * 0.03
  let lost = 0
  const models = state.models.map((m) => {
    if (m.status !== 'published') return m
    const next = Math.round(m.customers * (1 - ratio))
    lost += m.customers - next
    return { ...m, customers: next }
  })
  if (lost === 0) return state
  const events = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: `🌱 ${message} You lost ${lost.toLocaleString()} customers.`,
      week: globalWeek(state),
    },
    ...state.events,
  ].slice(0, 20)
  return { ...state, models, events }
}

function advanceOneWeek(state: GameState): GameState {
  const date = advanceWeek(state.date)
  let money = state.money
  let researched = state.researched
  let researching = state.researching
  let models = state.models
  let datacenters = state.datacenters
  let datacenterBuilds = state.datacenterBuilds
  let followers = state.followers
  let campaignWeeksLeft = state.campaignWeeksLeft
  let staff = state.staff
  let activeRegulations = state.activeRegulations
  let lobbyWeeksLeft = state.lobbyWeeksLeft
  const lobbyActive = lobbyWeeksLeft > 0
  if (lobbyWeeksLeft > 0) lobbyWeeksLeft--

  if (campaignWeeksLeft > 0) campaignWeeksLeft--

  // salaries (paid weekly)
  money -= state.staff.reduce((sum, s) => sum + s.salary, 0)

  // electricity for active GPU cards
  money -= Math.round(
    activeCards(state) *
      ELECTRICITY_PER_CARD_WEEK *
      (1 - companyEfficiency(state)) *
      regulationElectricityMultiplier(activeRegulations),
  )

  // rental fees
  money -= state.rentedDatacenters * RENT_WEEKLY_FEE

  // datacenter construction progress
  let completed = 0
  datacenterBuilds = datacenterBuilds
    .map((w) => w - 1)
    .filter((w) => {
      if (w <= 0) {
        completed++
        return false
      }
      return true
    })
  datacenters += completed

  // rental disputes (risk of losing rented datacenters)
  let rentedDatacenters = state.rentedDatacenters
  let disputes = 0
  for (let j = 0; j < rentedDatacenters; j++) {
    if (Math.random() < RENT_DISPUTE_CHANCE) disputes++
  }
  rentedDatacenters -= disputes

  // US regulators periodically enact new AI regulations — lobbying suppresses this
  const globalWeekNow = (date.year - START_YEAR) * WEEKS_PER_YEAR + date.week
  let newRegulation: (typeof REGULATION_MAP)[string] | null = null
  if (
    globalWeekNow >= REGULATION_START_WEEK &&
    activeRegulations.length < MAX_ACTIVE_REGULATIONS &&
    Math.random() < REGULATION_CHECK_CHANCE * (lobbyActive ? LOBBY_RISK_REDUCTION : 1)
  ) {
    newRegulation = pickNewRegulation(activeRegulations)
    if (newRegulation) activeRegulations = [...activeRegulations, newRegulation.id]
  }

  // regulatory fines for non-compliance
  const fineRoll = regulationFineRoll(activeRegulations)
  if (fineRoll) money -= fineRoll.fine

  // regulators can shut down owned datacenters over compliance violations
  const shutdownChance =
    (REGULATION_BASE_DATACENTER_SHUTDOWN_CHANCE + regulationDatacenterShutdownChance(activeRegulations)) *
    (lobbyActive ? LOBBY_RISK_REDUCTION : 1)
  let regulatoryShutdowns = 0
  for (let j = 0; j < datacenters; j++) {
    if (Math.random() < shutdownChance) regulatoryShutdowns++
  }
  datacenters -= regulatoryShutdowns

  // research progress
  const stillResearching: typeof researching = []
  for (const rp of researching) {
    const next = { ...rp, weeksRemaining: rp.weeksRemaining - 1 }
    if (next.weeksRemaining <= 0) {
      researched = [...researched, rp.id]
    } else {
      stillResearching.push(next)
    }
  }
  researching = stillResearching

  // staff training progress — same shape as research, but levels up a person instead of the company
  let staffTraining = state.staffTraining
  const stillTraining: typeof staffTraining = []
  const trainedNow: { staffId: string; scoreGain: number }[] = []
  for (const tp of staffTraining) {
    const next = { ...tp, weeksRemaining: tp.weeksRemaining - 1 }
    if (next.weeksRemaining <= 0) {
      trainedNow.push({ staffId: tp.staffId, scoreGain: tp.scoreGain })
    } else {
      stillTraining.push(next)
    }
  }
  staffTraining = stillTraining
  const trainedDescriptions: string[] = []
  if (trainedNow.length > 0) {
    staff = staff.map((s) => {
      const t = trainedNow.find((x) => x.staffId === s.id)
      if (!t) return s
      const newScore = Math.min(MAX_SCORE, s.examScore + t.scoreGain)
      trainedDescriptions.push(`${s.name} (now ${newScore})`)
      return { ...s, examScore: newScore }
    })
  }

  const week = (date.year - START_YEAR) * WEEKS_PER_YEAR + date.week

  let trendingHashtag = state.trendingHashtag
  let trendingSetWeek = state.trendingSetWeek
  if (week - trendingSetWeek >= TRENDING_ROTATE_WEEKS) {
    trendingHashtag = pickTrendingHashtag(trendingHashtag)
    trendingSetWeek = week
  }

  function playerCustomersIn(typeId: string): number {
    return state.models.reduce(
      (sum, m) => sum + (m.status === 'published' && m.typeId === typeId ? m.customers + m.freeCustomers : 0),
      0,
    )
  }

  // competitors grow their own models + improve quality + gain followers
  let competitors = state.competitors.map((c) => ({
    ...c,
    followers: c.followers + Math.round(c.followers * 0.0015),
    models: c.models.map((cm) => {
      if (cm.releaseWeek > week) return cm
      const sat = marketSaturation(cm.typeId, week, playerCustomersIn(cm.typeId), state.competitors)
      const followerFactor = 1 + c.followers / 2000000
      const growth = Math.round(cm.growthBase * (cm.quality / 100) * sat * followerFactor)
      return { ...cm, customers: cm.customers + growth, quality: Math.min(99, cm.quality + 0.2) }
    }),
  }))

  // competitors occasionally release new models
  let releaseEvent: string | null = null
  if (Math.random() < 0.18) {
    const idx = Math.floor(Math.random() * state.competitors.length)
    const c = competitors[idx]
    const newModel = generateCompetitorModel(c, week)
    competitors = competitors.map((cc, i) =>
      i === idx ? { ...cc, models: [...cc.models, newModel] } : cc,
    )
    releaseEvent = `${c.icon} ${c.name} released a new model: ${newModel.name} (quality ${newModel.quality})!`
  }

  // competitors occasionally buy their own wave of hype bots
  let competitorBotEvent: string | null = null
  if (Math.random() < COMPETITOR_BOT_CHANCE) {
    const idx = Math.floor(Math.random() * competitors.length)
    const c = competitors[idx]
    const gained = Math.round(c.followers * (0.02 + Math.random() * 0.04)) + 500
    competitors = competitors.map((cc, i) => (i === idx ? { ...cc, followers: cc.followers + gained } : cc))
    competitorBotEvent = `${c.icon} ${c.name} bought a wave of hype bots! +${gained.toLocaleString()} followers.`
  }

  // models
  const finishedModels: string[] = []
  const promoEndedModels: { name: string; converted: number; churned: number }[] = []
  models = models.map((m) => {
    if (m.status === 'training') {
      const weeksRemaining = m.weeksRemaining - 1
      if (weeksRemaining <= 0) {
        finishedModels.push(m.name)
        const quality = computeQuality(state, m.gpus, m.dataTier, m.distillQuality)
        return { ...m, status: 'ready', weeksRemaining: 0, customers: 0, freeCustomers: 0, quality }
      }
      return { ...m, weeksRemaining }
    }
    if (m.status === 'published' && m.pricing) {
      const type = MODEL_TYPE_MAP[m.typeId]
      const pricing = PRICING_MAP[m.pricing]
      const marketers = state.staff.filter((s) => s.role === 'marketer').length
      const sat = marketSaturation(m.typeId, week, playerCustomersIn(m.typeId), state.competitors)
      const campaignMult = state.campaignWeeksLeft > 0 ? 2 : 1
      const promoGrowthMult = m.promo === 'discount' ? DISCOUNT_GROWTH_MULT : m.promo === 'free' ? FREE_TRIAL_GROWTH_MULT : 1
      const growth = Math.round(
        type.growthBase *
          (m.quality / 100) *
          pricing.growthMultiplier *
          (1 + marketers * 0.2) *
          followerBoost(state.followers) *
          sat *
          campaignMult *
          promoGrowthMult,
      )
      // signups made during a promo are trial users — they sit apart until the promo ends
      let customers = m.customers
      let freeCustomers = m.freeCustomers
      if (m.promo) freeCustomers += growth
      else customers += growth

      const revMult = regulationRevenueMultiplier(activeRegulations)
      // customers who already pay full price keep paying it right through the promo
      money += customers * pricing.revPerCustomerPerWeek * revMult
      // trial users pay the promo rate instead — nothing at all on a free-access reset
      const trialRate = m.promo === 'discount' ? DISCOUNT_REV_MULT : m.promo === 'free' ? FREE_TRIAL_REV_MULT : 1
      money += freeCustomers * pricing.revPerCustomerPerWeek * trialRate * revMult

      if (m.pricing === 'opensource') {
        followers += Math.round((customers + freeCustomers) * 0.005)
      }
      let promo = m.promo
      let promoWeeksLeft = m.promoWeeksLeft
      if (promo && promoWeeksLeft != null) {
        promoWeeksLeft -= 1
        if (promoWeeksLeft <= 0) {
          // the promo is over: part of the trial crowd starts paying, the rest walks away
          const conversion = promo === 'discount' ? DISCOUNT_CONVERSION : FREE_TRIAL_CONVERSION
          const converted = Math.round(freeCustomers * conversion)
          promoEndedModels.push({ name: m.name, converted, churned: freeCustomers - converted })
          customers += converted
          freeCustomers = 0
          promo = undefined
          promoWeeksLeft = undefined
        }
      }
      return { ...m, customers, freeCustomers, promo, promoWeeksLeft }
    }
    return m
  })

  // rival bot armies swarm you too — the mirror of your own BOT_ATTACK
  let botSwarm: { attacker: string; followersLost: number; customersLost: number } | null = null
  let botSwarmTraced: { attacker: string; theirLoss: number; ourGain: number } | null = null
  const marketerCount = staff.filter((s) => s.role === 'marketer').length
  const swarmChance = Math.max(
    COMPETITOR_BOT_MIN_CHANCE,
    COMPETITOR_BOT_ATTACK_CHANCE - marketerCount * COMPETITOR_BOT_MARKETER_DEFENSE,
  )
  const worthSwarming = followers > 0 || models.some((m) => m.status === 'published')
  if (
    week > COMPETITOR_BOT_ATTACK_GRACE_WEEKS &&
    worthSwarming &&
    competitors.length > 0 &&
    Math.random() < swarmChance
  ) {
    const idx = Math.floor(Math.random() * competitors.length)
    const attacker = competitors[idx]
    const label = `${attacker.icon} ${attacker.name}`
    if (Math.random() < COMPETITOR_BOT_TRACE_CHANCE) {
      // their swarm gets traced back to them, and the backlash sends followers your way
      const theirLoss = Math.round(attacker.followers * (0.04 + Math.random() * 0.06))
      const ourGain = Math.round(theirLoss * 0.3)
      competitors = competitors.map((c, i) =>
        i === idx ? { ...c, followers: Math.max(0, c.followers - theirLoss) } : c,
      )
      followers += ourGain
      botSwarmTraced = { attacker: label, theirLoss, ourGain }
    } else {
      const ratio = 0.04 + Math.random() * 0.06
      const followersLost = Math.round(followers * ratio)
      let customersLost = 0
      models = models.map((m) => {
        if (m.status !== 'published') return m
        const customers = Math.round(m.customers * (1 - ratio * 0.5))
        const freeCustomers = Math.round(m.freeCustomers * (1 - ratio * 0.5))
        customersLost += m.customers - customers + (m.freeCustomers - freeCustomers)
        return { ...m, customers, freeCustomers }
      })
      followers = Math.max(0, followers - followersLost)
      botSwarm = { attacker: label, followersLost, customersLost }
    }
  }

  // chance a competitor smears you + rental dispute news
  let events = state.events
  const newEvents: GameEvent[] = []

  if (botSwarm) {
    newEvents.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: `🤖 ${botSwarm.attacker} unleashed a bot army on you! You lost ${botSwarm.followersLost.toLocaleString()} followers and ${botSwarm.customersLost.toLocaleString()} customers.`,
      week,
    })
  }

  if (botSwarmTraced) {
    newEvents.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: `🕵️ A bot army aimed at you was traced back to ${botSwarmTraced.attacker}! They lost ${botSwarmTraced.theirLoss.toLocaleString()} followers and you gained ${botSwarmTraced.ourGain.toLocaleString()}.`,
      week,
    })
  }

  // rival companies poach your underpaid staff — the longer a salary goes without a raise,
  // the further it falls behind the market and the more tempting a rival's offer becomes
  if (week > COMPETITOR_POACH_GRACE_WEEKS && staff.length > 0 && state.competitors.length > 0) {
    const risk = staff.map((s) => {
      const market = marketSalaryFor(s.role, s.examScore, week)
      const underpaid = Math.min(3, Math.max(1, market / s.salary))
      return { s, chance: COMPETITOR_POACH_BASE_CHANCE * (s.examScore / MAX_SCORE) * underpaid }
    })
    const totalChance = Math.min(0.6, risk.reduce((sum, r) => sum + r.chance, 0))
    if (Math.random() < totalChance) {
      let roll = Math.random() * risk.reduce((sum, r) => sum + r.chance, 0)
      let target = risk[0].s
      for (const r of risk) {
        roll -= r.chance
        if (roll <= 0) {
          target = r.s
          break
        }
      }
      const attacker = state.competitors[Math.floor(Math.random() * state.competitors.length)]
      staff = staff.filter((s) => s.id !== target.id)
      const roleLabel = target.role.charAt(0).toUpperCase() + target.role.slice(1)
      newEvents.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: `${attacker.icon} ${attacker.name} poached your ${roleLabel} ${target.name} (score ${target.examScore}) with a bigger paycheck!`,
        week,
      })
    }
  }

  for (const name of finishedModels) {
    newEvents.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: `🎉 ${name} finished training! Publish it to start earning.`,
      week,
    })
  }

  for (const desc of trainedDescriptions) {
    newEvents.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: `🎓 Training complete: ${desc}!`,
      week,
    })
  }

  for (const p of promoEndedModels) {
    const text =
      p.converted + p.churned > 0
        ? `⏳ The promo for ${p.name} ended — ${p.converted.toLocaleString()} trial users converted to paying customers, ${p.churned.toLocaleString()} left.`
        : `⏳ The promo for ${p.name} has ended — pricing is back to normal.`
    newEvents.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      week,
    })
  }

  if (disputes > 0) {
    newEvents.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: `⚡ Rental dispute! You lost ${disputes} rented datacenter${disputes > 1 ? 's' : ''}.`,
      week,
    })
  }

  if (newRegulation) {
    newEvents.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: `🏛️ New US regulation: ${newRegulation.icon} ${newRegulation.name} — ${newRegulation.description}`,
      week,
    })
  }

  if (fineRoll) {
    newEvents.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: `🏛️ Regulators fined you $${fineRoll.fine.toLocaleString()} for violating the ${fineRoll.source.name}!`,
      week,
    })
  }

  if (regulatoryShutdowns > 0) {
    newEvents.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: `🏛️ Regulators shut down ${regulatoryShutdowns} of your datacenter${regulatoryShutdowns > 1 ? 's' : ''} over compliance violations!`,
      week,
    })
  }

  if (releaseEvent) {
    newEvents.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: releaseEvent,
      week,
    })
  }

  if (competitorBotEvent) {
    newEvents.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: competitorBotEvent,
      week,
    })
  }

  // always show at least one bit of flavor news each week, even if nothing else happened
  if (Math.random() < 0.4 || newEvents.length === 0) {
    newEvents.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: FLAVOR_NEWS[Math.floor(Math.random() * FLAVOR_NEWS.length)],
      week,
    })
  }

  if (Math.random() < 0.2) {
    const attacker = state.competitors[Math.floor(Math.random() * state.competitors.length)]
    const ratio = 0.02 + Math.random() * 0.04
    let lost = 0
    models = models.map((m) => {
      if (m.status !== 'published') return m
      const next = Math.round(m.customers * (1 - ratio))
      lost += m.customers - next
      return { ...m, customers: next }
    })
    if (lost > 0 && attacker) {
      newEvents.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: `${attacker.icon} ${attacker.name} posted negative things about your AI! You lost ${lost.toLocaleString()} customers.`,
        week,
      })
    }
  }

  if (newEvents.length > 0) {
    events = [...newEvents, ...state.events].slice(0, 20)
  }

  const next = {
    ...state,
    date,
    money,
    researched,
    researching,
    staffTraining,
    models,
    datacenters,
    datacenterBuilds,
    rentedDatacenters,
    competitors,
    followers,
    campaignWeeksLeft,
    events,
    trendingHashtag,
    trendingSetWeek,
    staff,
    activeRegulations,
    lobbyWeeksLeft,
  }

  if (!next.pendingEvent && Math.random() < 0.25) {
    next.pendingEvent = pickRandomEvent(next)
  }

  return next
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return { ...initialState(), screen: 'naming' }
    case 'LOAD_STATE':
      return migrateState(action.state)
    case 'SET_COMPANY_NAME':
      return { ...state, companyName: action.name, screen: 'main' }
    case 'TOGGLE_PAUSE':
      return { ...state, paused: !state.paused }
    case 'HIRE_STAFF':
      return {
        ...state,
        staff: [...state.staff, action.staff],
        money: state.money - action.staff.salary,
      }
    case 'START_RESEARCH': {
      const item = RESEARCH_MAP[action.id]
      if (!item || state.money < item.cost) return state
      const researchers = state.staff.filter((s) => s.role === 'researcher').length
      if (researchers < 1) return state
      const duration = Math.max(1, Math.ceil(item.weeks / researchers))
      return {
        ...state,
        money: state.money - item.cost,
        researching: [...state.researching, { id: item.id, weeksRemaining: duration, totalWeeks: duration }],
      }
    }
    case 'START_MODEL': {
      const dataCost = action.model.dataTier ? (DATA_TIER_MAP[action.model.dataTier]?.cost ?? 0) : 0
      let teacherCost = 0
      if (action.model.distilledFrom) {
        if (!isDistillUnlocked(state.researched)) return state
        teacherCost = distillCost(action.model.distillQuality ?? 0)
      }
      const cost = dataCost + teacherCost
      if (cost > 0 && state.money < cost) return state
      return { ...state, models: [...state.models, action.model], money: state.money - cost }
    }
    case 'BUY_GPU': {
      const count = Math.max(1, action.count)
      const cost = Math.round(GPU_CARD_COST * count * regulationGpuCostMultiplier(state.activeRegulations))
      if (state.money < cost) return state
      const next = { ...state, money: state.money - cost, gpuCards: state.gpuCards + count }
      return ecoProtest(next, 0.1, 'Eco activists criticized your GPU purchase!')
    }
    case 'BUY_RAM': {
      const count = Math.max(1, action.count)
      const cost = RAM_COST * count
      if (state.money < cost) return state
      return { ...state, money: state.money - cost, ram: state.ram + count }
    }
    case 'BUY_SSD': {
      const count = Math.max(1, action.count)
      const cost = SSD_COST * count
      if (state.money < cost) return state
      return { ...state, money: state.money - cost, ssd: state.ssd + count }
    }
    case 'POACH': {
      if (state.poached.includes(action.competitorId)) return state
      const cost = 200000
      if (state.money < cost) return state
      if (state.staff.length >= maxStaff(state)) return state
      const role: Staff['role'] = Math.random() < 0.5 ? 'researcher' : 'engineer'
      const nat = role === 'researcher' ? 'china' : 'europe'
      const hire = generateCandidate(nat, role, 190, 200)
      const competitors = state.competitors.map((c) => {
        if (c.id !== action.competitorId) return c
        return {
          ...c,
          models: c.models.map((m) => ({ ...m, quality: Math.max(50, m.quality - 5) })),
        }
      })
      const target = state.competitors.find((c) => c.id === action.competitorId)
      const events = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `🤝 You poached a top ${role} from ${target?.icon ?? ''} ${target?.name ?? ''}! (score ${hire.examScore})`,
          week: globalWeek(state),
        },
        ...state.events,
      ].slice(0, 20)
      return {
        ...state,
        money: state.money - cost,
        staff: [...state.staff, hire],
        poached: [...state.poached, action.competitorId],
        competitors,
        events,
      }
    }
    case 'BUILD_DATACENTER': {
      if (state.money < DATACENTER_COST) return state
      const next = {
        ...state,
        money: state.money - DATACENTER_COST,
        datacenterBuilds: [...state.datacenterBuilds, DATACENTER_BUILD_WEEKS],
      }
      return ecoProtest(next, 0.4, 'Eco activists are protesting your new datacenter!')
    }
    case 'RENT_DATACENTER':
      return { ...state, rentedDatacenters: state.rentedDatacenters + 1 }
    case 'UPGRADE_OFFICE': {
      if (state.officeLevel >= MAX_OFFICE_LEVEL) return state
      const cost = OFFICE_UPGRADE_BASE_COST * state.officeLevel
      if (state.money < cost) return state
      return { ...state, money: state.money - cost, officeLevel: state.officeLevel + 1 }
    }
    case 'IPO': {
      if (state.isPublic) return state
      const totalCustomers = state.models.reduce((sum, m) => sum + (m.status === 'published' ? m.customers : 0), 0)
      if (totalCustomers < 250000) return state
      const payout = totalCustomers * 15
      const events = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `📈 ${state.companyName} went public! You raised $${payout.toLocaleString()}.`,
          week: globalWeek(state),
        },
        ...state.events,
      ].slice(0, 20)
      return {
        ...state,
        isPublic: true,
        money: state.money + payout,
        followers: state.followers + 50000,
        events,
      }
    }
    case 'LAUNCH_CAMPAIGN': {
      if (state.campaignWeeksLeft > 0) return state
      if (state.money < CAMPAIGN_COST) return state
      if (!state.staff.some((s) => s.role === 'marketer')) return state
      const week = globalWeek(state)
      if (week - state.lastCampaignWeek < CAMPAIGN_COOLDOWN) return state
      const events = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `📣 Marketing campaign launched! 2x customers for ${CAMPAIGN_DURATION} weeks.`,
          week,
        },
        ...state.events,
      ].slice(0, 20)
      return {
        ...state,
        money: state.money - CAMPAIGN_COST,
        campaignWeeksLeft: CAMPAIGN_DURATION,
        lastCampaignWeek: week,
        events,
      }
    }
    case 'BUY_BOOK': {
      const book = BOOK_MAP[action.id]
      if (!book || state.books.includes(action.id)) return state
      if (state.money < book.cost) return state
      return { ...state, money: state.money - book.cost, books: [...state.books, action.id] }
    }
    case 'BUY_HYPE_BOTS': {
      const week = globalWeek(state)
      if (week - state.lastHypeBotsWeek < HYPE_BOTS_COOLDOWN) return state
      if (state.money < HYPE_BOTS_COST) return state
      const busted = Math.random() < HYPE_BOTS_BUST_CHANCE
      let followers = state.followers
      let text: string
      if (busted) {
        const lost = Math.round(HYPE_BOTS_FOLLOWERS * 0.4)
        followers = Math.max(0, followers - lost)
        text = `🤖 Your bot army got called out! You lost ${lost.toLocaleString()} followers.`
      } else {
        const gained = Math.round(HYPE_BOTS_FOLLOWERS * (0.8 + Math.random() * 0.4))
        followers += gained
        text = `🤖 Bought a wave of hype bots! +${gained.toLocaleString()} followers.`
      }
      const events = [
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text, week },
        ...state.events,
      ].slice(0, 20)
      return { ...state, money: state.money - HYPE_BOTS_COST, followers, lastHypeBotsWeek: week, events }
    }
    case 'BOT_ATTACK': {
      const week = globalWeek(state)
      if (week - state.lastBotAttackWeek < BOT_ATTACK_COOLDOWN) return state
      if (state.money < BOT_ATTACK_COST) return state
      const target = state.competitors.find((c) => c.id === action.competitorId)
      if (!target) return state
      const money = state.money - BOT_ATTACK_COST

      if (Math.random() < BOT_ATTACK_BACKFIRE_CHANCE) {
        const lost = Math.round(state.followers * 0.1) + 200
        const events = [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: `🕵️ Your bot army was traced back to you! ${target.name} called you out — you lost ${lost.toLocaleString()} followers.`,
            week,
          },
          ...state.events,
        ].slice(0, 20)
        return { ...state, money, followers: Math.max(0, state.followers - lost), lastBotAttackWeek: week, events }
      }

      const ratio = 0.05 + Math.random() * 0.07
      const followersLost = Math.round(target.followers * ratio)
      let customersLost = 0
      const competitors = state.competitors.map((c) => {
        if (c.id !== action.competitorId) return c
        return {
          ...c,
          followers: Math.max(0, c.followers - followersLost),
          models: c.models.map((m) => {
            const next = Math.round(m.customers * (1 - ratio * 0.5))
            customersLost += m.customers - next
            return { ...m, customers: next }
          }),
        }
      })
      const events = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `🤖 Your bot army swarmed ${target.icon} ${target.name}! They lost ${followersLost.toLocaleString()} followers and ${customersLost.toLocaleString()} customers.`,
          week,
        },
        ...state.events,
      ].slice(0, 20)
      return { ...state, money, competitors, lastBotAttackWeek: week, events }
    }
    case 'HIRE_HACKERS': {
      const week = globalWeek(state)
      if (week - state.lastHackerWeek < HACKER_COOLDOWN) return state
      if (state.money < HACKER_COST) return state
      const target = state.competitors.find((c) => c.id === action.competitorId)
      if (!target) return state
      let money = state.money - HACKER_COST

      if (Math.random() < HACKER_CAUGHT_CHANCE) {
        money -= HACKER_FINE
        const lostFollowers = Math.round(state.followers * 0.15)
        let lostCustomers = 0
        const models = state.models.map((m) => {
          if (m.status !== 'published') return m
          const next = Math.round(m.customers * 0.92)
          lostCustomers += m.customers - next
          return { ...m, customers: next }
        })
        const events = [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: `🚨 Your hackers got caught breaking into ${target.name}! $${HACKER_FINE.toLocaleString()} fine, ${lostFollowers.toLocaleString()} followers and ${lostCustomers.toLocaleString()} customers gone.`,
            week,
          },
          ...state.events,
        ].slice(0, 20)
        return {
          ...state,
          money,
          models,
          followers: Math.max(0, state.followers - lostFollowers),
          lastHackerWeek: week,
          events,
        }
      }

      const ratio = 0.08 + Math.random() * 0.07
      let customersLost = 0
      const competitors = state.competitors.map((c) => {
        if (c.id !== action.competitorId) return c
        return {
          ...c,
          models: c.models.map((m) => {
            const next = Math.round(m.customers * (1 - ratio))
            customersLost += m.customers - next
            return { ...m, customers: next, quality: Math.max(40, m.quality - HACKER_QUALITY_DAMAGE) }
          }),
        }
      })
      const events = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `💀 Your hackers breached ${target.icon} ${target.name}! Their models lost quality and ${customersLost.toLocaleString()} customers.`,
          week,
        },
        ...state.events,
      ].slice(0, 20)
      return { ...state, money, competitors, lastHackerWeek: week, events }
    }
    case 'HIRE_JOURNALISTS': {
      const week = globalWeek(state)
      if (week - state.lastJournalistWeek < JOURNALIST_COOLDOWN) return state
      if (state.money < JOURNALIST_COST) return state
      const gainedFollowers = Math.round(3000 + state.followers * 0.15)
      const pct = 4 + Math.random() * 4
      let gainedCustomers = 0
      const models = state.models.map((m) => {
        if (m.status !== 'published') return m
        const next = Math.round(m.customers * (1 + pct / 100))
        gainedCustomers += next - m.customers
        return { ...m, customers: next }
      })
      const events = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `📰 Paid journalists ran glowing stories about ${state.companyName}! +${gainedFollowers.toLocaleString()} followers, +${gainedCustomers.toLocaleString()} customers.`,
          week,
        },
        ...state.events,
      ].slice(0, 20)
      return {
        ...state,
        money: state.money - JOURNALIST_COST,
        followers: state.followers + gainedFollowers,
        models,
        lastJournalistWeek: week,
        events,
      }
    }
    case 'START_STAFF_TRAINING': {
      const s = state.staff.find((x) => x.id === action.staffId)
      if (!s || s.examScore >= MAX_SCORE) return state
      if (state.staffTraining.some((t) => t.staffId === action.staffId)) return state
      const cost = STAFF_TRAINING_SCORE_GAIN * STAFF_TRAINING_COST_PER_POINT
      if (state.money < cost) return state
      return {
        ...state,
        money: state.money - cost,
        staffTraining: [
          ...state.staffTraining,
          {
            staffId: s.id,
            weeksRemaining: STAFF_TRAINING_WEEKS,
            totalWeeks: STAFF_TRAINING_WEEKS,
            scoreGain: Math.min(STAFF_TRAINING_SCORE_GAIN, MAX_SCORE - s.examScore),
          },
        ],
      }
    }
    case 'RAISE_INVESTMENT': {
      const week = globalWeek(state)
      if (week - state.lastInvestmentWeek < INVESTMENT_COOLDOWN_WEEKS) return state
      const raise = investmentRaiseAmount(state)
      const events = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `💰 Closed a funding round: +$${raise.toLocaleString()}.`,
          week,
        },
        ...state.events,
      ].slice(0, 20)
      return { ...state, money: state.money + raise, lastInvestmentWeek: week, events }
    }
    case 'START_PROMO': {
      const model = state.models.find((m) => m.id === action.modelId)
      if (!model || model.status !== 'published' || model.promo) return state
      const cost = action.kind === 'discount' ? DISCOUNT_COST : FREE_TRIAL_COST
      if (state.money < cost) return state
      const duration = action.kind === 'discount' ? DISCOUNT_DURATION : FREE_TRIAL_DURATION
      const models = state.models.map((m) =>
        m.id === action.modelId ? { ...m, promo: action.kind, promoWeeksLeft: duration } : m,
      )
      const label = action.kind === 'discount' ? 'a discount' : 'a free-access reset'
      const events = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `${action.kind === 'discount' ? '🏷️' : '🎁'} Launched ${label} for ${model.name}!`,
          week: globalWeek(state),
        },
        ...state.events,
      ].slice(0, 20)
      return { ...state, money: state.money - cost, models, events }
    }
    case 'EDIT_MODEL': {
      const model = state.models.find((m) => m.id === action.id)
      if (!model) return state
      const name = action.name?.trim()
      const models = state.models.map((m) => {
        if (m.id !== action.id) return m
        const next = { ...m }
        if (name) next.name = name
        if (action.pricing && m.status === 'published') next.pricing = action.pricing
        return next
      })
      return { ...state, models }
    }
    case 'HIRE_LOBBYISTS': {
      const week = globalWeek(state)
      if (week - state.lastLobbyWeek < LOBBY_COOLDOWN) return state
      if (state.money < LOBBY_COST) return state
      let activeRegulations = state.activeRegulations
      let text = `🤝 You hired lobbyists — regulatory risk is reduced for ${LOBBY_DURATION}wk.`
      if (activeRegulations.length > 0 && Math.random() < LOBBY_REPEAL_CHANCE) {
        const idx = Math.floor(Math.random() * activeRegulations.length)
        const repealed = REGULATION_MAP[activeRegulations[idx]]
        activeRegulations = activeRegulations.filter((_, i) => i !== idx)
        text = `🤝 Your lobbyists got "${repealed?.name ?? 'a regulation'}" repealed!`
      }
      const events = [
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text, week },
        ...state.events,
      ].slice(0, 20)
      return {
        ...state,
        money: state.money - LOBBY_COST,
        activeRegulations,
        lobbyWeeksLeft: LOBBY_DURATION,
        lastLobbyWeek: week,
        events,
      }
    }
    case 'SET_GPU':
      return { ...state, gpuCards: Math.max(0, action.count) }
    case 'SET_DATACENTERS':
      return { ...state, datacenters: Math.max(0, action.count) }
    case 'PUBLISH_MODEL': {
      const model = state.models.find((m) => m.id === action.id)
      const week = globalWeek(state)
      // shipping a distilled model is the moment the rival can spot its own fingerprints
      const caught = Boolean(model?.distilledFrom) && Math.random() < distillCaughtChance(state)
      const models = state.models.map((m) =>
        m.id === action.id
          ? ({ ...m, status: 'published', pricing: action.pricing, distillCaught: caught || m.distillCaught } as AIModel)
          : m,
      )
      const launchEvents: GameEvent[] = []
      if (model) {
        launchEvents.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `🚀 ${model.name} is now live! Customers are joining.`,
          week,
        })
      }
      // the feed is newest-first, so the scandal is prepended ahead of the launch note
      const scandalEvents: GameEvent[] = []

      let money = state.money
      let followers = state.followers
      let competitors = state.competitors
      if (model && caught) {
        const teacher = distillTargets(state.competitors, week).find((t) => t.modelId === model.distilledFrom)
        const fine = distillFine(model.distillQuality ?? 0)
        const lostFollowers = distillFollowerLoss(state.followers)
        money -= fine
        followers = Math.max(0, followers - lostFollowers)
        const accuser = teacher?.competitorName ?? 'A rival lab'
        if (teacher) {
          competitors = competitors.map((c) =>
            c.id === teacher.competitorId
              ? { ...c, followers: c.followers + Math.round(c.followers * DISTILL_ACCUSER_FOLLOWER_GAIN) }
              : c,
          )
        }
        scandalEvents.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `⚖️ ${accuser} proved ${model.name} was distilled from ${model.distilledFromName ?? 'their model'}! Fined $${fine.toLocaleString()} and lost ${lostFollowers.toLocaleString()} followers.`,
          week,
        })
      } else if (model?.distilledFrom) {
        scandalEvents.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `🧪 Nobody noticed that ${model.name} was distilled from ${model.distilledFromName ?? 'a rival model'}.`,
          week,
        })
      }

      const newEvents = [...scandalEvents, ...launchEvents]
      const events = newEvents.length > 0 ? [...newEvents, ...state.events].slice(0, 20) : state.events
      return { ...state, models, events, money, followers, competitors }
    }
    case 'MAKE_POST': {
      const currentWeek = globalWeek(state)
      if (currentWeek <= state.lastPostWeek) return state
      const info = POST_TYPE_MAP[action.postType]
      if (!info) return state
      const totalCustomers = state.models.reduce((sum, m) => sum + m.customers, 0)
      let gained = followerGain(info, state.followers, totalCustomers)
      const viral = Math.random() < 0.15
      if (viral) gained = Math.round(gained * 3)
      const trending = usesTrendingHashtag(action.text, state.trendingHashtag)
      if (trending) gained = Math.round(gained * TRENDING_BONUS_MULTIPLIER)

      const newEvents: GameEvent[] = []
      if (viral) {
        newEvents.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `🔥 Your post went viral! +${gained.toLocaleString()} followers.`,
          week: currentWeek,
        })
      }
      if (trending) {
        newEvents.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `📈 You rode the ${state.trendingHashtag} wave! Bonus followers.`,
          week: currentWeek,
        })
      }
      if (Math.random() < COMPETITOR_REACTION_CHANCE && state.competitors.length > 0) {
        const c = state.competitors[Math.floor(Math.random() * state.competitors.length)]
        const reduction = 0.2 + Math.random() * 0.2
        const before = gained
        gained = Math.round(gained * (1 - reduction))
        const line = COMPETITOR_CLAPBACKS[Math.floor(Math.random() * COMPETITOR_CLAPBACKS.length)]
        newEvents.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `${c.icon} ${c.name} claps back: "${line}" (−${(before - gained).toLocaleString()} followers)`,
          week: currentWeek,
        })
      }

      const post = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: action.text.trim(),
        type: action.postType,
        week: currentWeek,
        followersGained: gained,
        viral,
        trending,
      }
      const events = newEvents.length > 0 ? [...newEvents, ...state.events].slice(0, 20) : state.events
      return {
        ...state,
        followers: state.followers + gained,
        posts: [post, ...state.posts],
        lastPostWeek: currentWeek,
        events,
      }
    }
    case 'SMEAR': {
      const currentWeek = globalWeek(state)
      if (currentWeek <= state.lastPostWeek) return state
      const target = state.competitors.find((c) => c.id === action.competitorId)
      if (!target) return state
      const ratio = Math.min(0.15, 0.03 * (1 + state.followers / 50000))
      let lost = 0
      const lossByModel: Record<string, number> = {}
      let competitors = state.competitors.map((c) => {
        if (c.id !== action.competitorId) return c
        return {
          ...c,
          models: c.models.map((m) => {
            const next = Math.round(m.customers * (1 - ratio))
            const modelLoss = m.customers - next
            lost += modelLoss
            lossByModel[m.id] = modelLoss
            return { ...m, customers: next }
          }),
        }
      })

      let gainedFollowers = Math.round(200 * (1 + state.followers / 20000))
      let clapbackText: string | null = null
      if (lost > 0 && Math.random() < COMPETITOR_SMEAR_REACTION_CHANCE) {
        const recoverRatio = 0.2 + Math.random() * 0.25
        const reduceRatio = 0.3 + Math.random() * 0.2
        gainedFollowers = Math.round(gainedFollowers * (1 - reduceRatio))
        let recovered = 0
        competitors = competitors.map((c) => {
          if (c.id !== action.competitorId) return c
          return {
            ...c,
            models: c.models.map((m) => {
              const back = Math.round((lossByModel[m.id] ?? 0) * recoverRatio)
              recovered += back
              return { ...m, customers: m.customers + back }
            }),
          }
        })
        const line = COMPETITOR_CLAPBACKS[Math.floor(Math.random() * COMPETITOR_CLAPBACKS.length)]
        clapbackText = `${target.icon} ${target.name} claps back: "${line}" — wins back ${recovered.toLocaleString()} customers.`
      }

      const events = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `You smeared ${target.name}! They lost ${lost.toLocaleString()} customers. You gained ${gainedFollowers.toLocaleString()} followers.`,
          week: currentWeek,
        },
        ...(clapbackText
          ? [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-cb`, text: clapbackText, week: currentWeek }]
          : []),
        ...state.events,
      ].slice(0, 20)
      return {
        ...state,
        competitors,
        followers: state.followers + gainedFollowers,
        lastPostWeek: currentWeek,
        events,
      }
    }
    case 'RESOLVE_EVENT': {
      const ev = state.pendingEvent
      if (!ev || ev.id !== action.id) return state
      const choice = ev.choices[action.choiceIndex]
      if (!choice) return state
      const e = choice.effects

      let money = state.money + (e.money ?? 0)
      let followers = state.followers + (e.followers ?? 0)
      let gpuCards = state.gpuCards + (e.gpus ?? 0)
      let staff = state.staff
      let models = state.models
      let customersPct = e.customersPct ?? 0

      if (e.lawsuit) {
        const lawyers = state.staff.filter((s) => s.role === 'lawyer').length
        if (lawyers >= 1) {
          money -= 40000
        } else {
          money -= 150000
          customersPct -= 10
        }
      }

      if (e.loseBestEngineer) {
        const engineers = staff.filter((s) => s.role === 'engineer')
        if (engineers.length > 0) {
          const best = engineers.reduce((a, b) => (a.examScore > b.examScore ? a : b))
          staff = staff.filter((s) => s.id !== best.id)
        }
      }

      if (e.hireRole) {
        if (staff.length < maxStaff(state)) {
          const nat = e.hireRole === 'researcher' ? 'china' : e.hireRole === 'engineer' ? 'europe' : 'usa'
          staff = [...staff, generateCandidate(nat, e.hireRole, 195, 200)]
        }
      }

      if (customersPct !== 0) {
        const factor = 1 + customersPct / 100
        models = models.map((m) =>
          m.status === 'published' ? { ...m, customers: Math.round(m.customers * factor) } : m,
        )
      }

      const newsEvent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: `${ev.icon} ${choice.news}`,
        week: globalWeek(state),
      }

      return {
        ...state,
        money,
        followers,
        gpuCards,
        staff,
        models,
        pendingEvent: null,
        events: [newsEvent, ...state.events].slice(0, 20),
      }
    }
    case 'TICK': {
      if (state.paused || state.pendingEvent) return state
      return advanceOneWeek(state)
    }
    case 'SET_WEEK': {
      const current = globalWeek(state)
      const target = Math.max(1, action.week)
      if (target <= current) return state
      let next = state
      for (let i = current; i < target; i++) next = advanceOneWeek(next)
      return next
    }
    case 'SET_MONEY':
      return { ...state, money: action.money }
    case 'ADD_MONEY':
      return { ...state, money: state.money + action.amount }
    case 'FINISH_ALL': {
      const researched = [...state.researched, ...state.researching.map((r) => r.id)]
      const models = state.models.map((m) =>
        m.status === 'training'
          ? { ...m, status: 'ready' as const, weeksRemaining: 0, customers: 0, freeCustomers: 0, quality: computeQuality(state, m.gpus, m.dataTier, m.distillQuality) }
          : m,
      )
      return { ...state, researched, researching: [], models }
    }
    case 'RESEARCH_ALL': {
      const researched = RESEARCH_ITEMS.map((r) => r.id)
      return { ...state, researched, researching: [] }
    }
    default:
      return state
  }
}
