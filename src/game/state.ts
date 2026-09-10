import type { AIModel, AttackKind, Contract, Difficulty, GameEvent, GameState, Pact, PendingEvent, PostType, PricingModel, PromoKind, RunStats, Staff, StaffBid, StaffCard, TradeKind, TradeOffer } from './types'
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
  FIRE_SEVERANCE_WEEKS,
  ACQUISITION_FOLLOWERS_KEPT,
  PRESIDENT_CALL_CHANCE,
  PRESIDENT_COOLDOWN,
  PRESIDENT_LINES,
  PRESIDENT_PRAISE_FOLLOWERS,
  PRESIDENT_RAGE_FOLLOWERS,
  PRESIDENT_RAGE_REGULATION_CHANCE,
  PRESIDENT_START_WEEK,
  ACQUISITION_PREMIUM,
  ACQUISITION_USER_KEPT,
  AUDIT_COOLDOWN,
  CONTRACT_BREACH_LOAD,
  CONTRACT_CLIENTS,
  CONTRACT_MAX_OFFERS,
  CONTRACT_MAX_WEEKS,
  CONTRACT_MIN_WEEKS,
  CONTRACT_OFFER_CHANCE,
  CONTRACT_OFFER_LIFE,
  CONTRACT_PENALTY_WEEKS,
  CONTRACT_REV_PER_SEAT,
  CONTRACT_START_WEEK,
  AUDIT_CUT,
  AUDIT_COST_PER_POINT,
  AUDIT_MIN_COST,
  HYPE_DRIFT,
  HYPE_GROWTH_SHARE,
  HYPE_MAX,
  HYPE_MIN,
  HYPE_SHOCK_CHANCE,
  HYPE_SHOCK_SIZE,
  HYPE_START,
  INCIDENT_CHANCE_AT_MAX,
  INCIDENT_START_WEEK,
  OVERLOAD_FOLLOWER_LOSS,
  OVERLOAD_GRACE,
  OVERLOAD_MAX_CHURN,
  PACT_BREAK_FOLLOWER_LOSS,
  PACT_WEEKS,
  POACH_BID_FEE_SHARE,
  POACH_MIN_BID_WEEKS,
  POACH_COUNTER_BONUS_WEEKS,
  POACH_COUNTER_PREMIUM,
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
  DEFAULT_DIFFICULTY,
  DIFFICULTY_MAP,
  COMPETITOR_MAX_MODELS,
  COMPETITOR_QUALITY_CREEP,
  COMPETITOR_RELEASE_CHANCE,
  IPO_RAISE_SHARE,
  IPO_VALUATION,
  VALUATION_PER_CUSTOMER,
  VALUATION_PER_FOLLOWER,
  VALUATION_PER_RESEARCH,
  VALUATION_PER_TRIAL_USER,
  VALUATION_REVENUE_MULTIPLE,
  WIN_VALUATION,
  MAX_SCORE,
  OFFICE_UPGRADE_BASE_COST,
  REGULATION_BASE_DATACENTER_SHUTDOWN_CHANCE,
  REGULATION_CHECK_CHANCE,
  REGULATION_START_WEEK,
  START_DATE,
  START_MONEY,
  START_YEAR,
  MAX_STAFF_LEVEL,
  QUALITY_CEILING_BASE,
  QUALITY_CEILING_PER_SCORE,
  QUALITY_REALIZATION_BASE,
  QUALITY_REALIZATION_PER_SCORE,
  QUALITY_SOFTNESS,
  SOTA_DECAY_CAP,
  SOTA_DRIFT_PER_POINT,
  SOTA_LEAD_BONUS,
  SUCCESSOR_MIGRATION,
  RISK_CHEAP_DATA,
  RISK_DECAY_PER_WEEK,
  RISK_DISTILLED,
  RISK_MAX,
  RISK_PER_PUBLISH,
  RISK_PER_RESEARCHER,
  RISK_RUSHED,
  RISK_RUSHED_WEEKS,
  USERS_PER_CARD,
  WEEKS_PER_YEAR,
} from './constants'
import { advanceWeek } from './date'
import {
  AMENITY_MAP,
  amenityElectricityMultiplier,
  amenityQualityBonus,
  amenityResearchSpeed,
  amenityRetention,
  amenityTrainingSpeed,
} from './amenities'
import { DATA_TIER_MAP, BOOK_MAP, MODEL_TYPE_MAP, PRICING_MAP, RESEARCH_ITEMS, RESEARCH_MAP, weeklyRevenue } from './research'
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
import { COMPETITOR_SEED, generateCompetitorModel, marketSaturation, stateOfTheArt } from './competitors'
import { pickRandomEvent } from './events'
import {
  canTrain,
  generateCandidate,
  marketSalaryFor,
  staffPower,
  trainingCostFor,
  trainingWeeksFor,
} from './hiring'
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
    difficulty: DEFAULT_DIFFICULTY,
    inRace: false,
    isPublic: false,
    won: false,
    campaignWeeksLeft: 0,
    lastCampaignWeek: -CAMPAIGN_COOLDOWN,
    books: [],
    amenities: [],
    hype: HYPE_START,
    hypeTrend: HYPE_DRIFT,
    risk: 0,
    lastAuditWeek: -AUDIT_COOLDOWN,
    contracts: [],
    contractOffers: [],
    presidentCall: null,
    lastPresidentWeek: -PRESIDENT_COOLDOWN,
    stats: freshStats(),
    competitors: COMPETITOR_SEED.map((c) => ({ ...c, models: c.models.map((m) => ({ ...m })) })),
    events: [],
    pendingEvent: null,
    activeRegulations: [],
    lobbyWeeksLeft: 0,
    pacts: [],
    lastLobbyWeek: -LOBBY_COOLDOWN,
  }
}

export type Action =
  | { type: 'NEW_GAME' }
  | { type: 'LOAD_STATE'; state: GameState }
  | { type: 'SET_COMPANY_NAME'; name: string }
  | { type: 'SET_SCREEN'; screen: GameState['screen'] }
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'START_GAME'; name: string; difficulty: Difficulty }
  | { type: 'ATTACK_PLAYER'; targetId: string; targetName: string; kind: AttackKind }
  | { type: 'CLEAR_OUTBOX' }
  | { type: 'NOTE'; text: string }
  | { type: 'SET_IN_RACE'; inRace: boolean }
  | { type: 'INCOMING_ATTACK'; kind: AttackKind; from: string }
  | { type: 'BID_FOR_STAFF'; targetId: string; targetName: string; fromId: string; fromName: string; staff: StaffCard; amount: number }
  | { type: 'INCOMING_BID'; bid: StaffBid }
  | { type: 'RESOLVE_BID'; matched: boolean }
  | {
      type: 'OFFER_TRADE'
      targetId: string
      targetName: string
      fromId: string
      fromName: string
      kind: TradeKind
      price: number
      gpus?: number
      researchId?: string
      modelId?: string
      datacenters?: number
    }
  | { type: 'INCOMING_TRADE'; offer: TradeOffer }
  | { type: 'RESOLVE_TRADE'; accepted: boolean }
  | { type: 'TRADE_RESULT'; tradeId: string; accepted: boolean }
  | { type: 'BREAK_PACT'; playerId: string; selfId: string }
  | { type: 'PACT_BROKEN'; from: string }
  | { type: 'BID_RESULT'; bidId: string; matched: boolean; staff?: Staff }
  | { type: 'TICK' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'SET_PAUSED'; paused: boolean }
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
  | { type: 'BUY_AMENITY'; id: string }
  | { type: 'RUN_SAFETY_AUDIT' }
  | { type: 'ACQUIRE_COMPETITOR'; id: string }
  | { type: 'HANG_UP' }
  | { type: 'FORCE_PRESIDENT_CALL'; mood: 'happy' | 'annoyed' | 'furious' }
  | { type: 'SIGN_CONTRACT'; id: string }
  | { type: 'DECLINE_CONTRACT'; id: string }
  | { type: 'BUY_HYPE_BOTS' }
  | { type: 'BOT_ATTACK'; competitorId: string }
  | { type: 'HIRE_HACKERS'; competitorId: string }
  | { type: 'HIRE_JOURNALISTS' }
  | { type: 'START_STAFF_TRAINING'; staffId: string }
  | { type: 'FIRE_STAFF'; staffId: string }
  | { type: 'GIVE_RAISE'; staffId: string }
  | { type: 'RAISE_INVESTMENT' }
  | { type: 'START_PROMO'; modelId: string; kind: PromoKind }
  | { type: 'EDIT_MODEL'; id: string; name?: string; pricing?: PricingModel }
  | { type: 'HIRE_LOBBYISTS' }
  | { type: 'SET_GPU'; count: number }
  | { type: 'SET_DATACENTERS'; count: number }
  | { type: 'ADVANCE_JOBS'; delta: number }
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

/** Average effective score for a role: exam score times level, so levels really do multiply output. */
export function avgScoreByRole(staff: Staff[], role: Staff['role']): number {
  const list = staff.filter((s) => s.role === role)
  if (list.length === 0) return 0
  return list.reduce((sum, s) => sum + staffPower(s), 0) / list.length
}

/** The length and difficulty preset this run is being played on. */
export function settingsOf(state: GameState) {
  return DIFFICULTY_MAP[state.difficulty] ?? DIFFICULTY_MAP[DEFAULT_DIFFICULTY]
}

export function globalWeek(state: GameState): number {
  return (state.date.year - START_DATE.year) * WEEKS_PER_YEAR + state.date.week
}

export function maxStaff(state: GameState): number {
  return state.officeLevel * DESKS_PER_LEVEL
}

function freshStats(): RunStats {
  return {
    peakCustomers: 0,
    peakValuation: 0,
    peakFollowers: 0,
    bestWeek: 0,
    worstWeek: 0,
    hires: 0,
    departures: 0,
    poachedIn: 0,
    poachedOut: 0,
    modelsShipped: 0,
    contractsSigned: 0,
    contractsBroken: 0,
    acquisitions: 0,
    presidentCalls: 0,
    pactsSigned: 0,
    pactsBroken: 0,
  }
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
    // levels arrived after launch: everyone in an older save starts at 1
    staff: (raw.staff ?? base.staff).map((s) => ({ ...s, level: s.level ?? 1 })),
    models,
    researching,
    staffTraining: (raw.staffTraining ?? []).map((t) => ({
      staffId: t.staffId,
      weeksRemaining: t.weeksRemaining,
      totalWeeks: t.totalWeeks,
      // courses that were in flight under the old points system finish as one level
      toLevel: t.toLevel ?? ((raw.staff ?? []).find((s) => s.id === t.staffId)?.level ?? 1) + 1,
    })),
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
    difficulty: raw.difficulty ?? DEFAULT_DIFFICULTY,
    // A multiplayer race lives in the connection, not on disk. Reloading a save
    // taken mid-race used to leave a ghost behind it: a bid modal from a player
    // who is no longer there, an offer that could never be answered and so
    // blocked poaching forever, and a solo game that still followed race rules.
    inRace: false,
    outbox: undefined,
    pendingBid: undefined,
    sentBid: undefined,
    // deals belong to a race too, and a pact with someone who is no longer
    // connected would quietly block your own attacks forever
    pendingTrade: undefined,
    sentTrade: undefined,
    pacts: [],
    isPublic: raw.isPublic ?? false,
    won: raw.won ?? false,
    campaignWeeksLeft: raw.campaignWeeksLeft ?? 0,
    lastCampaignWeek: raw.lastCampaignWeek ?? -CAMPAIGN_COOLDOWN,
    books: raw.books ?? [],
    amenities: raw.amenities ?? [],
    hype: raw.hype ?? HYPE_START,
    hypeTrend: raw.hypeTrend ?? HYPE_DRIFT,
    risk: raw.risk ?? 0,
    lastAuditWeek: raw.lastAuditWeek ?? -AUDIT_COOLDOWN,
    contracts: raw.contracts ?? [],
    contractOffers: raw.contractOffers ?? [],
    // a call is answered in the moment, so a save never reloads holding one
    presidentCall: null,
    lastPresidentWeek: raw.lastPresidentWeek ?? -PRESIDENT_COOLDOWN,
    stats: { ...freshStats(), ...(raw.stats ?? {}) },
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
  const ceiling = QUALITY_CEILING_BASE + avgResearcher * QUALITY_CEILING_PER_SCORE
  const realization = QUALITY_REALIZATION_BASE + avgEngineer * QUALITY_REALIZATION_PER_SCORE
  const raw =
    ceiling * realization * factor +
    techBonus +
    dataQuality +
    ssdQualityBonus(state.ssd) +
    booksBonus +
    amenityQualityBonus(state.amenities)
  // diminishing returns instead of a wall: every point past here costs more than the last
  let q = 100 * (1 - Math.exp(-Math.max(0, raw) / QUALITY_SOFTNESS))
  if (distillQuality != null) q = distilledQuality(q, distillQuality)
  return Math.max(0, Math.min(100, Math.round(q)))
}

/**
 * What the company is worth today. Annualised revenue at a growth-stage multiple
 * does most of the work; users, reach and shipped research are the premium a
 * buyer pays on top. This is the number the IPO and the win condition read, and
 * it is shown in the top bar so the player can watch it climb.
 */
/** What an audit costs right now: more debt, more work to clear it. */
export function auditCost(state: GameState): number {
  return Math.max(AUDIT_MIN_COST, Math.round(state.risk * AUDIT_COST_PER_POINT))
}

/**
 * Whether the White House thinks of you as one of theirs. There is no flag on
 * the company itself, so it is read off the people: an American company is one
 * where the Americans outnumber every other nationality.
 */
export function isAmericanCompany(state: GameState): boolean {
  if (state.staff.length === 0) return false
  const counts: Record<string, number> = {}
  for (const s of state.staff) counts[s.nationality] = (counts[s.nationality] ?? 0) + 1
  const usa = counts.usa ?? 0
  return usa > 0 && Object.entries(counts).every(([nat, n]) => nat === 'usa' || n < usa)
}

/** What the mood is called, for the readout in the Company panel. */
export function marketMood(hype: number): string {
  if (hype >= 1.45) return 'Mania'
  if (hype >= 1.15) return 'Hot'
  if (hype >= 0.9) return 'Steady'
  if (hype >= 0.72) return 'Cooling'
  return 'AI winter'
}

/** How many people your hardware can serve at once. */
export function servingCapacity(state: GameState): number {
  return activeCards(state) * USERS_PER_CARD
}

/** Everyone using your service: the public product plus enterprise seats. */
export function servedUsers(state: GameState): number {
  const users = state.models.reduce(
    (sum, m) => sum + (m.status === 'published' ? m.customers + m.freeCustomers : 0),
    0,
  )
  return users + state.contracts.reduce((sum, c) => sum + c.seats, 0)
}

/**
 * What it would take to buy a rival outright: what their users and following
 * are worth, plus the premium anyone pays to take a competitor off the board.
 * Only a public company can do this, because it is paying in stock.
 */
export function acquisitionCost(state: GameState, competitorId: string): number {
  const c = state.competitors.find((x) => x.id === competitorId)
  if (!c) return 0
  const users = c.models.reduce((sum, m) => sum + m.customers, 0)
  return Math.round(
    (users * VALUATION_PER_CUSTOMER + c.followers * VALUATION_PER_FOLLOWER) * ACQUISITION_PREMIUM,
  )
}

/** The best thing you have live, which is what enterprise clients are buying. */
export function bestPublishedQuality(state: GameState): number {
  return state.models.reduce((best, m) => (m.status === 'published' ? Math.max(best, m.quality) : best), 0)
}

/** 0 when comfortable, above 1 when the service is over its head. */
export function serviceLoad(state: GameState): number {
  const capacity = servingCapacity(state)
  if (capacity <= 0) return servedUsers(state) > 0 ? Infinity : 0
  return servedUsers(state) / capacity
}

export function companyValuation(state: GameState): number {
  let paying = 0
  let trial = 0
  let perWeek = 0
  for (const m of state.models) {
    if (m.status !== 'published') continue
    paying += m.customers
    trial += m.freeCustomers
    perWeek += weeklyRevenue(m)
  }
  // Cash is cash. Everything else is what the market thinks the company is
  // worth this week, and that moves with the mood.
  const multiples =
    perWeek * 52 * VALUATION_REVENUE_MULTIPLE +
    paying * VALUATION_PER_CUSTOMER +
    trial * VALUATION_PER_TRIAL_USER +
    state.followers * VALUATION_PER_FOLLOWER +
    state.researched.length * VALUATION_PER_RESEARCH
  return Math.round(Math.max(0, state.money) + multiples * (state.hype ?? 1))
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

/**
 * Advance everything the player is actively waiting on — research, staff
 * training, model training, datacenter construction and the timed marketing and
 * lobbying effects — by `delta` weeks, finishing whatever reaches zero.
 *
 * These run on their own fine-grained clock instead of on the weekly tick, so a
 * job that says "1 week" takes a full week from the moment it was started
 * rather than ending at whatever moment the next week boundary happens to fall
 * on. `advanceOneWeek` deliberately leaves these timers alone; the fast-forward
 * path calls this with a delta of 1 for every week it replays, so both stay in
 * sync. Any new timer the player watches count down belongs here.
 */
/** Peace runs out on the same clock as everything else the player waits on. */
function pactsAfter(state: GameState, delta: number, announce: (text: string) => void): Pact[] {
  if (state.pacts.length === 0) return state.pacts
  const kept: Pact[] = []
  for (const p of state.pacts) {
    const weeksLeft = p.weeksLeft - delta
    if (weeksLeft > 0) kept.push({ ...p, weeksLeft })
    else announce(`Your non-aggression pact with ${p.name} has run out.`)
  }
  return kept
}

function advanceJobs(state: GameState, delta: number): GameState {
  if (delta <= 0) return state
  const busy =
    state.researching.length > 0 ||
    state.staffTraining.length > 0 ||
    state.datacenterBuilds.length > 0 ||
    state.campaignWeeksLeft > 0 ||
    state.lobbyWeeksLeft > 0 ||
    state.pacts.length > 0 ||
    state.models.some((m) => m.status === 'training')
  // nothing is running, so hand back the same object and skip the re-render
  if (!busy) return state

  const week = globalWeek(state)
  const newEvents: GameEvent[] = []
  const announce = (text: string) => {
    newEvents.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text, week })
  }

  // research
  let researched = state.researched
  const researching: GameState['researching'] = []
  for (const rp of state.researching) {
    const weeksRemaining = rp.weeksRemaining - delta
    if (weeksRemaining <= 0) {
      if (!researched.includes(rp.id)) researched = [...researched, rp.id]
    } else researching.push({ ...rp, weeksRemaining })
  }

  // staff training — same shape as research, but levels up a person
  const staffTraining: GameState['staffTraining'] = []
  const trained: { staffId: string; toLevel: number }[] = []
  for (const tp of state.staffTraining) {
    const weeksRemaining = tp.weeksRemaining - delta
    if (weeksRemaining <= 0) trained.push({ staffId: tp.staffId, toLevel: tp.toLevel })
    else staffTraining.push({ ...tp, weeksRemaining })
  }
  let staff = state.staff
  if (trained.length > 0) {
    staff = staff.map((s) => {
      const t = trained.find((x) => x.staffId === s.id)
      if (!t) return s
      const level = Math.min(MAX_STAFF_LEVEL, t.toLevel)
      const leveled = { ...s, level }
      // their market rate jumps with the level, so flag it before a rival notices
      const market = marketSalaryFor(s.role, staffPower(leveled), week)
      announce(
        `🎓 ${s.name} reached level ${level} — worth ${staffPower(leveled).toLocaleString()} pts, ` +
          `and now worth $${market.toLocaleString()}/wk on the open market.`,
      )
      return leveled
    })
  }

  // model training — quality is locked in on completion, so it picks up any
  // research that finished in the same step
  const withResearch = { ...state, researched }
  const models = state.models.map((m) => {
    if (m.status !== 'training') return m
    const weeksRemaining = m.weeksRemaining - delta
    if (weeksRemaining > 0) return { ...m, weeksRemaining }
    announce(`🎉 ${m.name} finished training! Publish it to start earning.`)
    return {
      ...m,
      status: 'ready' as const,
      weeksRemaining: 0,
      customers: 0,
      freeCustomers: 0,
      quality: computeQuality(withResearch, m.gpus, m.dataTier, m.distillQuality),
    }
  })

  // datacenter construction
  let datacenters = state.datacenters
  const datacenterBuilds: number[] = []
  for (const w of state.datacenterBuilds) {
    const left = w - delta
    if (left <= 0) datacenters++
    else datacenterBuilds.push(left)
  }

  return {
    ...state,
    researched,
    researching,
    staff,
    staffTraining,
    models,
    datacenters,
    datacenterBuilds,
    campaignWeeksLeft: Math.max(0, state.campaignWeeksLeft - delta),
    lobbyWeeksLeft: Math.max(0, state.lobbyWeeksLeft - delta),
    pacts: pactsAfter(state, delta, announce),
    events: newEvents.length > 0 ? [...newEvents, ...state.events].slice(0, 20) : state.events,
  }
}

function advanceOneWeek(state: GameState): GameState {
  const tuning = settingsOf(state)
  const date = advanceWeek(state.date)
  let money = state.money
  let models = state.models
  let datacenters = state.datacenters
  let followers = state.followers
  let staff = state.staff
  let activeRegulations = state.activeRegulations
  // the countdowns themselves live in advanceJobs; this only reads them
  const lobbyActive = state.lobbyWeeksLeft > 0

  // salaries (paid weekly)
  money -= state.staff.reduce((sum, s) => sum + s.salary, 0)

  // electricity for active GPU cards
  money -= Math.round(
    activeCards(state) *
      ELECTRICITY_PER_CARD_WEEK *
      (1 - companyEfficiency(state)) *
      amenityElectricityMultiplier(state.amenities) *
      regulationElectricityMultiplier(activeRegulations),
  )

  // rental fees
  money -= state.rentedDatacenters * RENT_WEEKLY_FEE

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
      const growth = Math.round(cm.growthBase * (cm.quality / 100) * sat * followerFactor * tuning.competitorGrowth)
      return {
        ...cm,
        customers: cm.customers + growth,
        quality: Math.min(99, cm.quality + COMPETITOR_QUALITY_CREEP),
      }
    }),
  }))

  // competitors occasionally release new models
  let releaseEvent: string | null = null
  if (Math.random() < COMPETITOR_RELEASE_CHANCE) {
    const idx = Math.floor(Math.random() * state.competitors.length)
    const c = competitors[idx]
    const newModel = generateCompetitorModel(c, week)
    let kept = c.models
    if (kept.length >= COMPETITOR_MAX_MODELS) {
      // the successor replaces their oldest product and inherits its users
      const oldest = kept.reduce((a, b) => (a.releaseWeek <= b.releaseWeek ? a : b))
      newModel.customers += oldest.customers
      kept = kept.filter((m) => m.id !== oldest.id)
    }
    competitors = competitors.map((cc, i) => (i === idx ? { ...cc, models: [...kept, newModel] } : cc))
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

  // models — training countdowns are handled by advanceJobs
  const promoEndedModels: { name: string; converted: number; churned: number }[] = []
  // the bar the rest of the world has set this week
  const sota = stateOfTheArt(state.competitors, week)
  const fadedModels: { name: string; lost: number }[] = []
  models = models.map((m) => {
    if (m.status === 'training') return m
    if (m.status === 'published' && m.pricing) {
      const type = MODEL_TYPE_MAP[m.typeId]
      const pricing = PRICING_MAP[m.pricing]
      const marketers = state.staff.filter((s) => s.role === 'marketer').length
      const sat = marketSaturation(m.typeId, week, playerCustomersIn(m.typeId), state.competitors)
      const campaignMult = state.campaignWeeksLeft > 0 ? 2 : 1
      const promoGrowthMult = m.promo === 'discount' ? DISCOUNT_GROWTH_MULT : m.promo === 'free' ? FREE_TRIAL_GROWTH_MULT : 1
      // how this model stands against the best in the world right now
      const edge = m.quality - sota
      const leadBonus = edge > 0 ? 1 + edge * SOTA_LEAD_BONUS : 1
      const growth = Math.round(
        type.growthBase *
          (m.quality / 100) *
          pricing.growthMultiplier *
          (1 + marketers * 0.2) *
          followerBoost(state.followers) *
          sat *
          campaignMult *
          promoGrowthMult *
          leadBonus *
          // strangers try things when the world is excited, and not when it is not
          (1 + (state.hype - 1) * HYPE_GROWTH_SHARE) *
          tuning.playerGrowth,
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
      // how far the world has moved on since this model shipped; a fresh one has drifted nothing
      const drift = sota - (m.sotaAtPublish ?? sota)
      if (drift > 0) {
        const rate = Math.min(SOTA_DECAY_CAP, drift * SOTA_DRIFT_PER_POINT)
        const lostPaying = Math.round(customers * rate)
        const lostTrial = Math.round(freeCustomers * rate)
        customers -= lostPaying
        freeCustomers -= lostTrial
        if (lostPaying + lostTrial > 0) fadedModels.push({ name: m.name, lost: lostPaying + lostTrial })
      }

      return { ...m, customers, freeCustomers, promo, promoWeeksLeft }
    }
    return m
  })

  // Safety debt. It falls a little on its own each week, faster with researchers
  // on staff, and every week it is also the chance that something goes wrong in
  // public. A lawyer is who you want when it does.
  let risk = Math.max(
    0,
    state.risk - RISK_DECAY_PER_WEEK - state.staff.filter((p) => p.role === 'researcher').length * RISK_PER_RESEARCHER,
  )
  let incident: { text: string } | null = null
  if (week > INCIDENT_START_WEEK && risk > 0 && models.some((m) => m.status === 'published')) {
    const chance = (risk / RISK_MAX) * INCIDENT_CHANCE_AT_MAX
    if (Math.random() < chance) {
      const lawyers = state.staff.filter((p) => p.role === 'lawyer').length
      // lawyers do not stop it happening, they stop it costing everything
      const shield = Math.min(0.7, lawyers * 0.22)
      const severity = (0.35 + Math.random() * 0.65) * (risk / RISK_MAX) * (1 - shield)
      const kind = Math.floor(Math.random() * 3)
      const fine = Math.round(severity * 2_000_000)
      const userRate = severity * 0.18
      const followerRate = severity * 0.25
      let lostUsers = 0
      models = models.map((m) => {
        if (m.status !== 'published') return m
        const goPaying = Math.round(m.customers * userRate)
        const goTrial = Math.round(m.freeCustomers * userRate)
        lostUsers += goPaying + goTrial
        return { ...m, customers: m.customers - goPaying, freeCustomers: m.freeCustomers - goTrial }
      })
      const lostFollowers = Math.round(followers * followerRate)
      followers = Math.max(0, followers - lostFollowers)
      money -= fine
      risk = Math.max(0, risk - 12) // the reckoning clears some of the debt
      const what =
        kind === 0
          ? 'Someone jailbroke your model and posted the transcript'
          : kind === 1
            ? 'Your model gave a confidently wrong answer that made the news'
            : 'A regulator opened a case into how your model was trained'
      incident = {
        text:
          `${what}. ${lostUsers.toLocaleString()} users and ${lostFollowers.toLocaleString()} followers gone, ` +
          `$${fine.toLocaleString()} in costs` +
          (lawyers > 0 ? `, and your ${lawyers === 1 ? 'lawyer' : 'lawyers'} kept it from being worse.` : '. Hire a lawyer.'),
      }
    }
  }

  // The mood of the whole market. It wanders, occasionally gets shoved, and
  // turns around when it hits the ends of its range, so a run has a boom in it
  // somewhere and a winter somewhere else.
  let hype = state.hype
  let hypeTrend = state.hypeTrend
  let moodNews: string | null = null
  {
    if (Math.random() < HYPE_SHOCK_CHANCE) {
      const shock = (Math.random() - 0.5) * 2 * HYPE_SHOCK_SIZE
      hype += shock
      hypeTrend = shock > 0 ? HYPE_DRIFT : -HYPE_DRIFT
    }
    hype += hypeTrend * (0.4 + Math.random() * 1.2)
    if (hype >= HYPE_MAX) {
      hype = HYPE_MAX
      hypeTrend = -HYPE_DRIFT
    } else if (hype <= HYPE_MIN) {
      hype = HYPE_MIN
      hypeTrend = HYPE_DRIFT
    } else if (Math.random() < 0.04) {
      hypeTrend = -hypeTrend // the mood turns on its own now and then
    }
    const wasHot = state.hype >= 1.4
    const wasCold = state.hype <= 0.75
    if (!wasHot && hype >= 1.4) {
      moodNews =
        'The market has gone mad for AI. Valuations are running hot and everyone wants to try what you have built.'
    } else if (!wasCold && hype <= 0.75) {
      moodNews =
        'The mood has turned. Talk of an AI winter is everywhere, valuations are down and signups have gone quiet.'
    }
  }

  // Enterprise contracts. They pay several times what the public product does,
  // and they hold you to a quality floor and to keeping the service up.
  let contracts = state.contracts
  let contractOffers = state.contractOffers
  const contractNews: string[] = []
  let brokenThisWeek = 0
  {
    const bestQuality = models.reduce((best, m) => (m.status === 'published' ? Math.max(best, m.quality) : best), 0)
    const capacityNow = activeCards(state) * USERS_PER_CARD
    const servedNow =
      models.reduce((sum, m) => sum + (m.status === 'published' ? m.customers + m.freeCustomers : 0), 0) +
      contracts.reduce((sum, c) => sum + c.seats, 0)
    const loadNow = capacityNow > 0 ? servedNow / capacityNow : servedNow > 0 ? Infinity : 0

    const kept: Contract[] = []
    let contractsBroken = 0
    for (const c of contracts) {
      if (bestQuality < c.minQuality) {
        money -= c.penalty
        followers = Math.max(0, followers - Math.round(followers * 0.05))
        contractNews.push(
          `${c.client} ended their contract: your best model is quality ${Math.round(bestQuality)} and they were promised ${c.minQuality}. Penalty $${c.penalty.toLocaleString()}.`,
        )
        contractsBroken++
        continue
      }
      if (loadNow > CONTRACT_BREACH_LOAD) {
        money -= c.penalty
        contractNews.push(
          `${c.client} walked over reliability. Their seats kept hitting errors. Penalty $${c.penalty.toLocaleString()}.`,
        )
        contractsBroken++
        continue
      }
      money += c.weeklyFee
      const weeksLeft = c.weeksLeft - 1
      if (weeksLeft <= 0) {
        followers += Math.round(c.seats * 0.05)
        contractNews.push(`You saw out the ${c.client} contract in full. They are telling people.`)
        continue
      }
      kept.push({ ...c, weeksLeft })
    }
    contracts = kept
    if (contractsBroken > 0) {
      brokenThisWeek = contractsBroken
    }

    // offers on the table go stale if you leave them
    contractOffers = contractOffers
      .map((o) => ({ ...o, expiresIn: o.expiresIn - 1 }))
      .filter((o) => o.expiresIn > 0)

    if (
      week >= CONTRACT_START_WEEK &&
      bestQuality > 0 &&
      contractOffers.length < CONTRACT_MAX_OFFERS &&
      Math.random() < CONTRACT_OFFER_CHANCE
    ) {
      const client = CONTRACT_CLIENTS[Math.floor(Math.random() * CONTRACT_CLIENTS.length)]
      if (!contracts.some((c) => c.client === client) && !contractOffers.some((o) => o.client === client)) {
        // what they ask for is just inside what you can already do
        const minQuality = Math.max(10, Math.round(bestQuality - 4 - Math.random() * 8))
        const seats = Math.round((4_000 + Math.random() * 40_000) * (0.5 + bestQuality / 100))
        const weeklyFee = Math.round(seats * CONTRACT_REV_PER_SEAT * (0.8 + Math.random() * 0.5))
        const weeks = Math.round(CONTRACT_MIN_WEEKS + Math.random() * (CONTRACT_MAX_WEEKS - CONTRACT_MIN_WEEKS))
        contractOffers = [
          ...contractOffers,
          {
            id: `contract-${week}-${Math.random().toString(36).slice(2, 8)}`,
            client,
            seats,
            weeklyFee,
            minQuality,
            weeksLeft: weeks,
            penalty: weeklyFee * CONTRACT_PENALTY_WEEKS,
            expiresIn: CONTRACT_OFFER_LIFE,
          },
        ]
        contractNews.push(
          `${client} wants ${seats.toLocaleString()} seats for $${weeklyFee.toLocaleString()} a week, on quality ${minQuality} for ${weeks} weeks. See the Company panel.`,
        )
      }
    }
  }

  // Running over capacity. Serving people costs hardware the same way training
  // does, and a service that cannot keep up sheds users and goodwill until you
  // buy your way out of it.
  let overload: { load: number; lost: number; followersLost: number } | null = null
  {
    const capacity = activeCards(state) * USERS_PER_CARD
    const served =
      models.reduce((sum, m) => sum + (m.status === 'published' ? m.customers + m.freeCustomers : 0), 0) +
      contracts.reduce((sum, c) => sum + c.seats, 0)
    const load = capacity > 0 ? served / capacity : served > 0 ? Infinity : 0
    if (served > 0 && load > OVERLOAD_GRACE) {
      // how far past the line you are, capped so it is a squeeze and not a cliff
      const over = Math.min(1, (load - OVERLOAD_GRACE) / OVERLOAD_GRACE)
      const rate = OVERLOAD_MAX_CHURN * over
      let lost = 0
      models = models.map((m) => {
        if (m.status !== 'published') return m
        const goPaying = Math.round(m.customers * rate)
        const goTrial = Math.round(m.freeCustomers * rate)
        lost += goPaying + goTrial
        return { ...m, customers: m.customers - goPaying, freeCustomers: m.freeCustomers - goTrial }
      })
      const followersLost = Math.round(followers * OVERLOAD_FOLLOWER_LOSS * over)
      followers = Math.max(0, followers - followersLost)
      if (lost > 0 || followersLost > 0) overload = { load, lost, followersLost }
    }
  }

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

  // rival companies come for your underpaid staff — the longer a salary goes without a raise,
  // the further it falls behind the market and the more tempting a rival's offer becomes.
  // Nobody walks out on their own: this raises a decision and the player answers it.
  let poachOffer: PendingEvent | null = null
  if (week > COMPETITOR_POACH_GRACE_WEEKS && staff.length > 0 && state.competitors.length > 0) {
    const risk = staff.map((s) => {
      const market = marketSalaryFor(s.role, staffPower(s), week)
      const underpaid = Math.min(3, Math.max(1, market / s.salary))
      // a levelled-up person is as desirable as talent gets
      const desirability = Math.min(1, staffPower(s) / MAX_SCORE)
      return { s, chance: COMPETITOR_POACH_BASE_CHANCE * desirability * underpaid }
    })
    const totalChance =
      Math.min(0.6, risk.reduce((sum, r) => sum + r.chance, 0)) * (1 - amenityRetention(state.amenities))
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
      const roleLabel = target.role.charAt(0).toUpperCase() + target.role.slice(1)
      const offer = Math.round(marketSalaryFor(target.role, staffPower(target), week) * POACH_COUNTER_PREMIUM)
      const bonus = offer * POACH_COUNTER_BONUS_WEEKS
      poachOffer = {
        id: `poach-${target.id}-${week}`,
        icon: attacker.icon,
        title: 'Poaching attempt',
        text:
          `${attacker.name} offered your ${roleLabel} ${target.name} (level ${target.level}, ${staffPower(target).toLocaleString()} pts) ` +
          `$${offer.toLocaleString()}/wk. You pay $${target.salary.toLocaleString()}/wk. Match it?`,
        choices: [
          {
            label: `Match the offer — $${bonus.toLocaleString()} now`,
            hint:
              money >= bonus
                ? `${target.name} stays, and their salary rises to $${offer.toLocaleString()}/wk — back at market rate, so rivals stop circling.`
                : money > 0
                  ? `You only have $${Math.round(money).toLocaleString()}.`
                  : 'You have no cash to spare.',
            news: `${target.name} turned down ${attacker.name} after you matched the offer.`,
            effects: { money: -bonus, keepStaffId: target.id, keepStaffSalary: offer },
            disabled: money < bonus,
          },
          {
            label: 'Let them go',
            hint: `You lose ${target.name}, and all ${staffPower(target).toLocaleString()} pts go with them.`,
            news: `${attacker.name} poached your ${roleLabel} ${target.name} (level ${target.level}, ${staffPower(target).toLocaleString()} pts).`,
            effects: { loseStaffId: target.id },
          },
        ],
      }
    }
  }

  for (const text of contractNews) {
    newEvents.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-c`, text, week })
  }

  if (incident) {
    newEvents.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text: incident.text, week })
  }

  if (moodNews) {
    newEvents.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text: moodNews, week })
  }

  if (overload) {
    newEvents.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text:
        `Your service is over capacity at ${Math.round(overload.load * 100)}% of what your cards can serve. ` +
        `${overload.lost.toLocaleString()} users hit errors and left` +
        (overload.followersLost > 0 ? `, and ${overload.followersLost.toLocaleString()} followers went with them.` : '.') +
        ' Buy GPUs and somewhere to put them.',
      week,
    })
  }

  const fadedTotal = fadedModels.reduce((sum, f) => sum + f.lost, 0)
  if (fadedTotal >= 500) {
    const worst = fadedModels.reduce((a, b) => (a.lost >= b.lost ? a : b))
    newEvents.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: `📉 Better models are out there. You lost ${fadedTotal.toLocaleString()} users this week, most of them from ${worst.name}. Time to ship something newer.`,
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
    models,
    datacenters,
    rentedDatacenters,
    competitors,
    followers,
    hype,
    hypeTrend,
    risk,
    contracts,
    contractOffers,
    events,
    trendingHashtag,
    trendingSetWeek,
    staff,
    activeRegulations,
  }

  // The White House calls, if you are an American company and there is a reason
  // to. Which of the three moods depends entirely on how you have been running
  // the place: shipping the best model in the world, or a pile of safety debt.
  if (
    week >= PRESIDENT_START_WEEK &&
    week - next.lastPresidentWeek >= PRESIDENT_COOLDOWN &&
    isAmericanCompany(next) &&
    next.models.some((m) => m.status === 'published') &&
    Math.random() < PRESIDENT_CALL_CHANCE
  ) {
    const sotaNow = stateOfTheArt(next.competitors, week)
    const bestQuality = next.models.reduce(
      (best, m) => (m.status === 'published' ? Math.max(best, m.quality) : best),
      0,
    )
    const caught = next.models.some((m) => m.status === 'published' && m.distillCaught)
    let mood: 'happy' | 'annoyed' | 'furious' | null = null
    if (next.risk >= 70 || next.activeRegulations.length >= 2 || (incident && next.risk >= 45)) {
      mood = 'furious'
    } else if (next.risk >= 35 || next.activeRegulations.length >= 1 || caught || incident) {
      mood = 'annoyed'
    } else if (bestQuality >= sotaNow || companyValuation(next) >= 1e9 || next.contracts.length > 0) {
      mood = 'happy'
    }
    if (mood) {
      const lines = PRESIDENT_LINES[mood]
      next.presidentCall = { mood, line: lines[Math.floor(Math.random() * lines.length)], week }
      next.lastPresidentWeek = week
      next.stats = { ...next.stats, presidentCalls: next.stats.presidentCalls + 1 }
      if (mood === 'happy') {
        next.followers += Math.round(next.followers * PRESIDENT_PRAISE_FOLLOWERS) + 250
      } else if (mood === 'furious') {
        next.followers = Math.max(0, next.followers - Math.round(next.followers * PRESIDENT_RAGE_FOLLOWERS))
        if (Math.random() < PRESIDENT_RAGE_REGULATION_CHANCE) {
          const rule = pickNewRegulation(next.activeRegulations)
          if (rule) {
            next.activeRegulations = [...next.activeRegulations, rule.id]
            next.events = [
              {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                text: `${rule.icon} Washington moved on you the same week: ${rule.name} is now in force.`,
                week,
              },
              ...next.events,
            ].slice(0, 20)
          }
        }
      }
    }
  }

  // the high-water marks and the week's swing, for the report at the end
  const weekCustomers = next.models.reduce((sum, m) => sum + m.customers + m.freeCustomers, 0)
  const weekSwing = Math.round(next.money - state.money)
  next.stats = {
    ...next.stats,
    contractsBroken: next.stats.contractsBroken + brokenThisWeek,
    peakCustomers: Math.max(next.stats.peakCustomers, weekCustomers),
    peakValuation: Math.max(next.stats.peakValuation, companyValuation(next)),
    peakFollowers: Math.max(next.stats.peakFollowers, next.followers),
    bestWeek: Math.max(next.stats.bestWeek, weekSwing),
    worstWeek: Math.min(next.stats.worstWeek, weekSwing),
  }

  // a hundred billion dollars is the end of the run
  if (!next.won) {
    const valuation = companyValuation(next)
    if (valuation >= WIN_VALUATION) {
      next.won = true
      next.paused = true // the run is over; the player can unpause to keep going
      next.events = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `🏆 ${next.companyName} is worth $${(valuation / 1e9).toFixed(1)}B. You won the AI race!`,
          week,
        },
        ...next.events,
      ].slice(0, 20)
      return next
    }
  }

  // a poaching decision is waiting on the player, so it takes the slot
  if (poachOffer) {
    next.pendingEvent = poachOffer
  } else if (!next.pendingEvent && Math.random() < 0.25) {
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
    case 'ATTACK_PLAYER': {
      // Aimed at a real person rather than an AI rival. The cost, cooldown and
      // risk of being traced are the same as the single-player versions; what is
      // different is that the damage has to travel to their machine, so a paid-for
      // attack is parked in the outbox for App to send.
      // A pact is a promise the rules keep for you: break it in the Trading tab
      // first if you want to aim something at them.
      if (state.pacts.some((p) => p.playerId === action.targetId)) return state
      const week = globalWeek(state)
      const news: GameEvent[] = []
      const add = (text: string) => news.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text, week })

      if (action.kind === 'bots') {
        if (week - state.lastBotAttackWeek < BOT_ATTACK_COOLDOWN) return state
        if (state.money < BOT_ATTACK_COST) return state
        const money = state.money - BOT_ATTACK_COST
        if (Math.random() < BOT_ATTACK_BACKFIRE_CHANCE) {
          const lost = Math.round(state.followers * 0.1) + 200
          add(`🕵️ Your bot army was traced back to you! ${action.targetName} called you out, and you lost ${lost.toLocaleString()} followers.`)
          return {
            ...state,
            money,
            followers: Math.max(0, state.followers - lost),
            lastBotAttackWeek: week,
            events: [...news, ...state.events].slice(0, 20),
          }
        }
        add(`🤖 You unleashed a bot army on ${action.targetName}.`)
        return {
          ...state,
          money,
          lastBotAttackWeek: week,
          outbox: { t: 'attack', id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, targetId: action.targetId, targetName: action.targetName, kind: 'bots' },
          events: [...news, ...state.events].slice(0, 20),
        }
      }

      if (week - state.lastHackerWeek < HACKER_COOLDOWN) return state
      if (state.money < HACKER_COST) return state
      let money = state.money - HACKER_COST
      if (Math.random() < HACKER_CAUGHT_CHANCE) {
        money -= HACKER_FINE
        const lostFollowers = Math.round(state.followers * 0.15)
        add(`🚨 Your hackers got caught breaking into ${action.targetName}! A $${HACKER_FINE.toLocaleString()} fine and ${lostFollowers.toLocaleString()} followers gone.`)
        return {
          ...state,
          money,
          followers: Math.max(0, state.followers - lostFollowers),
          lastHackerWeek: week,
          events: [...news, ...state.events].slice(0, 20),
        }
      }
      add(`💻 Your hackers slipped into ${action.targetName}.`)
      return {
        ...state,
        money,
        lastHackerWeek: week,
        outbox: { t: 'attack', id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, targetId: action.targetId, targetName: action.targetName, kind: 'hackers' },
        events: [...news, ...state.events].slice(0, 20),
      }
    }
    case 'BID_FOR_STAFF': {
      // A headhunter takes their cut whether or not the offer is accepted.
      const week = globalWeek(state)
      const minimum = action.staff.salary * POACH_MIN_BID_WEEKS
      if (action.amount < minimum) return state
      const fee = Math.round(action.amount * POACH_BID_FEE_SHARE)
      if (state.money < fee) return state
      if (state.sentBid) return state // one offer at a time
      const bidId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const bid: StaffBid = {
        bidId,
        fromId: action.fromId,
        fromName: action.fromName,
        staff: action.staff,
        amount: action.amount,
      }
      return {
        ...state,
        money: state.money - fee,
        sentBid: { bidId, amount: action.amount, staffName: action.staff.name, targetName: action.targetName },
        outbox: { t: 'bid', id: bidId, targetId: action.targetId, bid },
        events: [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: `🎯 You offered ${action.staff.name} $${action.amount.toLocaleString()} to leave ${action.targetName}. The headhunter took $${fee.toLocaleString()}.`,
            week,
          },
          ...state.events,
        ].slice(0, 20),
      }
    }
    case 'INCOMING_BID': {
      // already answering one offer, so this one is refused on the spot
      if (state.pendingBid) {
        return {
          ...state,
          outbox: {
            t: 'bidResult',
            id: action.bid.bidId,
            targetId: action.bid.fromId,
            bidId: action.bid.bidId,
            matched: true,
          },
        }
      }
      // the person has to still work here
      if (!state.staff.some((s) => s.id === action.bid.staff.id)) {
        return {
          ...state,
          outbox: { t: 'bidResult', id: action.bid.bidId, targetId: action.bid.fromId, bidId: action.bid.bidId, matched: true },
        }
      }
      return { ...state, pendingBid: action.bid }
    }
    case 'RESOLVE_BID': {
      const bid = state.pendingBid
      if (!bid) return state
      const week = globalWeek(state)
      const person = state.staff.find((s) => s.id === bid.staff.id)
      if (!person) {
        return {
          ...state,
          pendingBid: undefined,
          outbox: { t: 'bidResult', id: bid.bidId, targetId: bid.fromId, bidId: bid.bidId, matched: true },
        }
      }
      if (action.matched) {
        if (state.money < bid.amount) return state
        // they now know exactly what they are worth, so their pay goes to market
        const market = Math.max(person.salary, marketSalaryFor(person.role, staffPower(person), week))
        return {
          ...state,
          money: state.money - bid.amount,
          staff: state.staff.map((s) => (s.id === person.id ? { ...s, salary: market } : s)),
          pendingBid: undefined,
          outbox: { t: 'bidResult', id: bid.bidId, targetId: bid.fromId, bidId: bid.bidId, matched: true },
          events: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              text: `🤝 You matched ${bid.fromName}'s $${bid.amount.toLocaleString()} offer. ${person.name} stays, now on $${market.toLocaleString()}/wk.`,
              week,
            },
            ...state.events,
          ].slice(0, 20),
        }
      }
      return {
        ...state,
        staff: state.staff.filter((s) => s.id !== person.id),
        staffTraining: state.staffTraining.filter((t) => t.staffId !== person.id),
        pendingBid: undefined,
        stats: {
          ...state.stats,
          departures: state.stats.departures + 1,
          poachedOut: state.stats.poachedOut + 1,
        },
        outbox: { t: 'bidResult', id: bid.bidId, targetId: bid.fromId, bidId: bid.bidId, matched: false, staff: person },
        events: [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: `💼 ${person.name} took ${bid.fromName}'s offer and walked out.`,
            week,
          },
          ...state.events,
        ].slice(0, 20),
      }
    }
    case 'BID_RESULT': {
      const sent = state.sentBid
      if (!sent || sent.bidId !== action.bidId) return state
      const week = globalWeek(state)
      const news: GameEvent[] = []
      const add = (text: string) =>
        news.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text, week })

      if (action.matched || !action.staff) {
        add(`🛡️ ${sent.targetName} matched your offer. ${sent.staffName} is staying put.`)
        return { ...state, sentBid: undefined, events: [...news, ...state.events].slice(0, 20) }
      }

      const hire = action.staff
      let staff = state.staff
      // no desk free, so the newest arrival pushes out your weakest of that role
      if (staff.length >= maxStaff(state)) {
        const sameRole = staff.filter((s) => s.role === hire.role)
        const pool = sameRole.length > 0 ? sameRole : staff
        const weakest = pool.reduce((a, b) => (staffPower(a) <= staffPower(b) ? a : b))
        staff = staff.filter((s) => s.id !== weakest.id)
        add(`📦 No desk free, so ${weakest.name} was let go to make room for ${hire.name}.`)
      }
      add(
        `🎉 ${hire.name} joined you from ${sent.targetName} for $${sent.amount.toLocaleString()}. Level ${hire.level}, ${staffPower(hire).toLocaleString()} pts.`,
      )
      return {
        ...state,
        money: state.money - sent.amount,
        staff: [...staff, hire],
        sentBid: undefined,
        stats: { ...state.stats, hires: state.stats.hires + 1, poachedIn: state.stats.poachedIn + 1 },
        events: [...news, ...state.events].slice(0, 20),
      }
    }
    case 'OFFER_TRADE': {
      // One deal in flight at a time, the same rule the poaching offers follow.
      if (state.sentTrade) return state
      if (action.targetId === action.fromId) return state
      const week = globalWeek(state)
      const price = Math.max(0, Math.round(action.price))
      const tradeId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const offer: TradeOffer = { tradeId, fromId: action.fromId, fromName: action.fromName, kind: action.kind, price }
      const sent = { offer, targetId: action.targetId, targetName: action.targetName }
      const note = (text: string): GameEvent[] =>
        [{ id: `${tradeId}-n`, text, week }, ...state.events].slice(0, 20)

      if (action.kind === 'compute') {
        const gpus = Math.floor(action.gpus ?? 0)
        if (gpus < 1 || gpus > state.gpuCards) return state
        offer.gpus = gpus
        // the cards go into escrow now, so the same ones cannot be sold twice
        return {
          ...state,
          gpuCards: state.gpuCards - gpus,
          sentTrade: sent,
          outbox: { t: 'trade', id: tradeId, targetId: action.targetId, offer },
          events: note(
            `You offered ${action.targetName} ${gpus} GPU${gpus > 1 ? 's' : ''} for $${price.toLocaleString()}. The cards are held until they answer.`,
          ),
        }
      }

      if (action.kind === 'datacenter') {
        const halls = Math.floor(action.datacenters ?? 0)
        if (halls < 1 || halls > state.datacenters) return state
        offer.datacenters = halls
        return {
          ...state,
          datacenters: state.datacenters - halls,
          sentTrade: sent,
          outbox: { t: 'trade', id: tradeId, targetId: action.targetId, offer },
          events: note(
            `You offered ${action.targetName} ${halls} datacenter${halls > 1 ? 's' : ''} for $${price.toLocaleString()}.`,
          ),
        }
      }

      if (action.kind === 'model') {
        const model = state.models.find((m) => m.id === action.modelId && m.status === 'published')
        if (!model) return state
        offer.model = model
        // the model goes with its users, so it leaves your books now
        return {
          ...state,
          models: state.models.filter((m) => m.id !== model.id),
          sentTrade: sent,
          outbox: { t: 'trade', id: tradeId, targetId: action.targetId, offer },
          events: note(
            `You offered ${action.targetName} ${model.name} and its ${(model.customers + model.freeCustomers).toLocaleString()} users for $${price.toLocaleString()}.`,
          ),
        }
      }

      if (action.kind === 'research') {
        const id = action.researchId ?? ''
        if (!state.researched.includes(id)) return state
        offer.researchId = id
        return {
          ...state,
          sentTrade: sent,
          outbox: { t: 'trade', id: tradeId, targetId: action.targetId, offer },
          events: note(
            `You offered ${action.targetName} your ${RESEARCH_MAP[id]?.name ?? 'research'} findings for $${price.toLocaleString()}.`,
          ),
        }
      }

      // a pact: no money changes hands, only a promise
      if (state.pacts.some((p) => p.playerId === action.targetId)) return state
      offer.price = 0
      offer.weeks = PACT_WEEKS
      return {
        ...state,
        sentTrade: sent,
        outbox: { t: 'trade', id: tradeId, targetId: action.targetId, offer },
        events: note(`You proposed a ${PACT_WEEKS}-week non-aggression pact to ${action.targetName}.`),
      }
    }
    case 'INCOMING_TRADE': {
      // busy with another offer, so this one is turned down rather than queued
      if (state.pendingTrade) {
        return {
          ...state,
          outbox: {
            t: 'tradeResult',
            id: action.offer.tradeId,
            targetId: action.offer.fromId,
            tradeId: action.offer.tradeId,
            accepted: false,
          },
        }
      }
      return { ...state, pendingTrade: action.offer }
    }
    case 'RESOLVE_TRADE': {
      const offer = state.pendingTrade
      if (!offer) return state
      const week = globalWeek(state)
      const decline = (text: string): GameState => ({
        ...state,
        pendingTrade: undefined,
        outbox: { t: 'tradeResult', id: offer.tradeId, targetId: offer.fromId, tradeId: offer.tradeId, accepted: false },
        events: [{ id: `${offer.tradeId}-d`, text, week }, ...state.events].slice(0, 20),
      })
      if (!action.accepted) return decline(`You turned down ${offer.fromName}'s offer.`)
      if (state.money < offer.price) return decline(`You could not afford ${offer.fromName}'s offer.`)

      const accepted = {
        ...state,
        money: state.money - offer.price,
        pendingTrade: undefined,
        outbox: {
          t: 'tradeResult' as const,
          id: offer.tradeId,
          targetId: offer.fromId,
          tradeId: offer.tradeId,
          accepted: true,
        },
      }
      const note = (text: string): GameEvent[] =>
        [{ id: `${offer.tradeId}-a`, text, week }, ...state.events].slice(0, 20)

      if (offer.kind === 'compute') {
        const gpus = offer.gpus ?? 0
        return {
          ...accepted,
          gpuCards: state.gpuCards + gpus,
          events: note(
            `You bought ${gpus} GPU${gpus > 1 ? 's' : ''} from ${offer.fromName} for $${offer.price.toLocaleString()}.`,
          ),
        }
      }
      if (offer.kind === 'datacenter') {
        const halls = offer.datacenters ?? 0
        return {
          ...accepted,
          datacenters: state.datacenters + halls,
          events: note(
            `You bought ${halls} datacenter${halls > 1 ? 's' : ''} from ${offer.fromName} for $${offer.price.toLocaleString()}.`,
          ),
        }
      }
      if (offer.kind === 'model') {
        const model = offer.model
        if (!model) return decline(`${offer.fromName}'s offer arrived broken.`)
        // it keeps its users, but it is yours now, under a new id
        const mine = { ...model, id: `traded-${offer.tradeId}` }
        return {
          ...accepted,
          models: [...state.models, mine],
          events: note(
            `You bought ${model.name} from ${offer.fromName} for $${offer.price.toLocaleString()}, with ${(model.customers + model.freeCustomers).toLocaleString()} users.`,
          ),
        }
      }
      if (offer.kind === 'research') {
        const id = offer.researchId ?? ''
        const name = RESEARCH_MAP[id]?.name ?? 'their findings'
        if (state.researched.includes(id)) {
          return decline(`You already know ${name}, so ${offer.fromName}'s offer was no use to you.`)
        }
        return {
          ...accepted,
          researched: [...state.researched, id],
          researching: state.researching.filter((r) => r.id !== id),
          events: note(`You licensed ${name} from ${offer.fromName} for $${offer.price.toLocaleString()}.`),
        }
      }
      return {
        ...accepted,
        pacts: [
          ...state.pacts.filter((p) => p.playerId !== offer.fromId),
          { playerId: offer.fromId, name: offer.fromName, weeksLeft: offer.weeks ?? PACT_WEEKS },
        ],
        stats: { ...state.stats, pactsSigned: state.stats.pactsSigned + 1 },
        events: note(`You signed a non-aggression pact with ${offer.fromName}.`),
      }
    }
    case 'TRADE_RESULT': {
      const sent = state.sentTrade
      if (!sent || sent.offer.tradeId !== action.tradeId) return state
      const offer = sent.offer
      const week = globalWeek(state)
      const note = (text: string): GameEvent[] =>
        [{ id: `${offer.tradeId}-r`, text, week }, ...state.events].slice(0, 20)

      if (!action.accepted) {
        return {
          ...state,
          // whatever was held for the deal comes back
          gpuCards: offer.kind === 'compute' ? state.gpuCards + (offer.gpus ?? 0) : state.gpuCards,
          datacenters: offer.kind === 'datacenter' ? state.datacenters + (offer.datacenters ?? 0) : state.datacenters,
          models: offer.kind === 'model' && offer.model ? [...state.models, offer.model] : state.models,
          sentTrade: undefined,
          events: note(`${sent.targetName} turned your offer down.`),
        }
      }
      if (offer.kind === 'pact') {
        return {
          ...state,
          sentTrade: undefined,
          pacts: [
            ...state.pacts.filter((p) => p.playerId !== sent.targetId),
            { playerId: sent.targetId, name: sent.targetName, weeksLeft: offer.weeks ?? PACT_WEEKS },
          ],
          stats: { ...state.stats, pactsSigned: state.stats.pactsSigned + 1 },
          events: note(`${sent.targetName} signed your non-aggression pact.`),
        }
      }
      const what =
        offer.kind === 'compute'
          ? `${offer.gpus} GPU${(offer.gpus ?? 0) > 1 ? 's' : ''}`
          : offer.kind === 'datacenter'
            ? `${offer.datacenters} datacenter${(offer.datacenters ?? 0) > 1 ? 's' : ''}`
            : offer.kind === 'model'
              ? (offer.model?.name ?? 'your model')
              : (RESEARCH_MAP[offer.researchId ?? '']?.name ?? 'your research')
      return {
        ...state,
        money: state.money + offer.price,
        sentTrade: undefined,
        events: note(`${sent.targetName} bought ${what} for $${offer.price.toLocaleString()}.`),
      }
    }
    case 'BREAK_PACT': {
      const pact = state.pacts.find((p) => p.playerId === action.playerId)
      if (!pact) return state
      const lost = Math.round(state.followers * PACT_BREAK_FOLLOWER_LOSS)
      return {
        ...state,
        followers: Math.max(0, state.followers - lost),
        pacts: state.pacts.filter((p) => p.playerId !== action.playerId),
        stats: { ...state.stats, pactsBroken: state.stats.pactsBroken + 1 },
        outbox: {
          t: 'pactBroken',
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          targetId: action.playerId,
          // how they address you, so their copy of the pact can be found
          from: action.selfId,
        },
        events: [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: `You tore up your pact with ${pact.name}. Word got round and you lost ${lost.toLocaleString()} followers.`,
            week: globalWeek(state),
          },
          ...state.events,
        ].slice(0, 20),
      }
    }
    case 'PACT_BROKEN': {
      const pact = state.pacts.find((p) => p.playerId === action.from || p.name === action.from)
      if (!pact) return state
      return {
        ...state,
        pacts: state.pacts.filter((p) => p.playerId !== pact.playerId),
        stats: { ...state.stats, pactsBroken: state.stats.pactsBroken + 1 },
        events: [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: `${pact.name} tore up your non-aggression pact. Watch your back.`,
            week: globalWeek(state),
          },
          ...state.events,
        ].slice(0, 20),
      }
    }
    case 'SET_IN_RACE':
      // kept in step with the connection: once a race ends, is left, or the player
      // is kicked out of it, the game goes back to solo rules
      return state.inRace === action.inRace ? state : { ...state, inRace: action.inRace }
    case 'NOTE':
      return {
        ...state,
        events: [
          { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text: action.text, week: globalWeek(state) },
          ...state.events,
        ].slice(0, 20),
      }
    case 'CLEAR_OUTBOX':
      return state.outbox ? { ...state, outbox: undefined } : state
    case 'INCOMING_ATTACK': {
      const week = globalWeek(state)
      const news: GameEvent[] = []
      const add = (text: string) => news.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text, week })

      if (action.kind === 'bots') {
        const ratio = 0.05 + Math.random() * 0.07
        const followersLost = Math.round(state.followers * ratio)
        let customersLost = 0
        const models = state.models.map((m) => {
          if (m.status !== 'published') return m
          const next = Math.round(m.customers * (1 - ratio * 0.5))
          customersLost += m.customers - next
          return { ...m, customers: next }
        })
        add(`🤖 ${action.from} unleashed a bot army on you! You lost ${followersLost.toLocaleString()} followers and ${customersLost.toLocaleString()} customers.`)
        return {
          ...state,
          models,
          followers: Math.max(0, state.followers - followersLost),
          events: [...news, ...state.events].slice(0, 20),
        }
      }

      let hit = 0
      const models = state.models.map((m) => {
        if (m.status !== 'published') return m
        const quality = Math.max(1, m.quality - HACKER_QUALITY_DAMAGE)
        if (quality < m.quality) hit++
        return { ...m, quality }
      })
      add(
        hit > 0
          ? `💻 ${action.from} hacked your labs! ${hit} of your models lost ${HACKER_QUALITY_DAMAGE} quality.`
          : `💻 ${action.from} tried to hack your labs, but you had nothing published to steal.`,
      )
      return { ...state, models, events: [...news, ...state.events].slice(0, 20) }
    }
    case 'SET_SCREEN':
      return { ...state, screen: action.screen }
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.difficulty }
    case 'START_GAME':
      // a fresh company on the agreed settings, used when a lobby starts a race
      return { ...initialState(), companyName: action.name, difficulty: action.difficulty, inRace: true, screen: 'main' }
    case 'TOGGLE_PAUSE':
      return { ...state, paused: !state.paused }
    case 'SET_PAUSED':
      return state.paused === action.paused ? state : { ...state, paused: action.paused }
    case 'BUY_AMENITY': {
      const item = AMENITY_MAP[action.id]
      if (!item || state.amenities.includes(item.id) || state.money < item.cost) return state
      return {
        ...state,
        money: state.money - item.cost,
        amenities: [...state.amenities, item.id],
        events: [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: `The ${item.name.toLowerCase()} is in. ${item.effect}.`,
            week: globalWeek(state),
          },
          ...state.events,
        ].slice(0, 20),
      }
    }
    case 'ACQUIRE_COMPETITOR': {
      // Buying a rival is a late-game move: you need the stock of a public
      // company behind you, and it takes their users off the board for good.
      if (!state.isPublic) return state
      const target = state.competitors.find((c) => c.id === action.id)
      if (!target) return state
      const cost = acquisitionCost(state, action.id)
      if (state.money < cost) return state
      const week = globalWeek(state)
      const users = target.models.reduce((sum, m) => sum + m.customers, 0)
      const arriving = Math.round(users * ACQUISITION_USER_KEPT)
      const live = state.models.filter((m) => m.status === 'published')
      const best = live.length > 0 ? live.reduce((a, b) => (b.quality > a.quality ? b : a)) : null
      const models = best
        ? state.models.map((m) => (m.id === best.id ? { ...m, customers: m.customers + arriving } : m))
        : state.models
      return {
        ...state,
        money: state.money - cost,
        competitors: state.competitors.filter((c) => c.id !== action.id),
        models,
        followers: state.followers + Math.round(target.followers * ACQUISITION_FOLLOWERS_KEPT),
        stats: { ...state.stats, acquisitions: state.stats.acquisitions + 1 },
        events: [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: best
              ? `You bought ${target.name} for $${cost.toLocaleString()}. ${arriving.toLocaleString()} of their users moved across to ${best.name}.`
              : `You bought ${target.name} for $${cost.toLocaleString()}, but you have nothing live for their users to move to.`,
            week,
          },
          ...state.events,
        ].slice(0, 20),
      }
    }
    case 'SIGN_CONTRACT': {
      const offer = state.contractOffers.find((o) => o.id === action.id)
      if (!offer) return state
      const { expiresIn: _drop, ...contract } = offer
      void _drop
      return {
        ...state,
        contracts: [...state.contracts, contract],
        contractOffers: state.contractOffers.filter((o) => o.id !== action.id),
        stats: { ...state.stats, contractsSigned: state.stats.contractsSigned + 1 },
        events: [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: `Signed with ${contract.client}: ${contract.seats.toLocaleString()} seats at $${contract.weeklyFee.toLocaleString()} a week for ${contract.weeksLeft} weeks.`,
            week: globalWeek(state),
          },
          ...state.events,
        ].slice(0, 20),
      }
    }
    case 'DECLINE_CONTRACT':
      return state.contractOffers.some((o) => o.id === action.id)
        ? { ...state, contractOffers: state.contractOffers.filter((o) => o.id !== action.id) }
        : state
    case 'RUN_SAFETY_AUDIT': {
      const week = globalWeek(state)
      if (week - state.lastAuditWeek < AUDIT_COOLDOWN) return state
      const cost = auditCost(state)
      if (state.money < cost || state.risk <= 0) return state
      const cut = Math.min(state.risk, AUDIT_CUT)
      return {
        ...state,
        money: state.money - cost,
        risk: state.risk - cut,
        lastAuditWeek: week,
        events: [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: `A safety audit went through everything you have shipped. ${Math.round(cut)} points of risk dealt with, $${cost.toLocaleString()} spent.`,
            week,
          },
          ...state.events,
        ].slice(0, 20),
      }
    }
    case 'HANG_UP':
      return state.presidentCall ? { ...state, presidentCall: null } : state
    case 'FORCE_PRESIDENT_CALL': {
      // a cheat, so the call can be looked at without waiting for the week it lands
      const lines = PRESIDENT_LINES[action.mood]
      return {
        ...state,
        presidentCall: {
          mood: action.mood,
          line: lines[Math.floor(Math.random() * lines.length)],
          week: globalWeek(state),
        },
      }
    }
    case 'HIRE_STAFF': {
      // Nobody can be hired twice. Staff are found and removed by id, so letting a
      // duplicate in would mean firing one of them removed every copy at once.
      if (state.staff.some((s) => s.id === action.staff.id)) return state
      if (state.staff.length >= maxStaff(state)) return state
      if (state.money < action.staff.salary) return state
      return {
        ...state,
        staff: [...state.staff, action.staff],
        money: state.money - action.staff.salary,
        stats: { ...state.stats, hires: state.stats.hires + 1 },
      }
    }
    case 'START_RESEARCH': {
      const item = RESEARCH_MAP[action.id]
      if (!item || state.money < item.cost) return state
      // The panel only offers what is available, but the rule belongs here. Without
      // it the same research could be bought over and over, and every copy counted
      // its quality bonus and its slice of the valuation again.
      if (!isResearchAvailable(item.id, state.researched, state.researching.map((r) => r.id))) return state
      const researchers = state.staff.filter((s) => s.role === 'researcher').length
      if (researchers < 1) return state
      // The office bonus is applied after the rounding, not before it, or a 20%
      // cut would vanish on any job short enough to round back up. Job timers are
      // fractional anyway; only the display rounds.
      const duration = Math.max(1, Math.ceil(item.weeks / researchers) * amenityResearchSpeed(state.amenities))
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
      // you float once the market values the company at a billion
      const valuation = companyValuation(state)
      if (valuation < IPO_VALUATION) return state
      const payout = Math.round(valuation * IPO_RAISE_SHARE)
      const events = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `📈 ${state.companyName} went public at a $${(valuation / 1e9).toFixed(2)}B valuation! You raised $${payout.toLocaleString()}.`,
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
      if (!s || !canTrain(s)) return state
      if (state.staffTraining.some((t) => t.staffId === action.staffId)) return state
      const cost = trainingCostFor(s.level)
      if (state.money < cost) return state
      const weeks = Math.max(1, trainingWeeksFor(s.level) * amenityTrainingSpeed(state.amenities))
      return {
        ...state,
        money: state.money - cost,
        staffTraining: [
          ...state.staffTraining,
          { staffId: s.id, weeksRemaining: weeks, totalWeeks: weeks, toLevel: s.level + 1 },
        ],
      }
    }
    case 'FIRE_STAFF': {
      const s = state.staff.find((x) => x.id === action.staffId)
      if (!s) return state
      // counted for the end-of-run report, where leaving is leaving
      // you owe them notice pay, so you cannot fire your way out of being broke
      const severance = s.salary * FIRE_SEVERANCE_WEEKS
      if (state.money < severance) return state
      const news = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: `📦 You let ${s.name} go. Severance cost $${severance.toLocaleString()}.`,
        week: globalWeek(state),
      }
      return {
        ...state,
        money: state.money - severance,
        staff: state.staff.filter((x) => x.id !== action.staffId),
        // any course they were part-way through goes with them
        staffTraining: state.staffTraining.filter((t) => t.staffId !== action.staffId),
        stats: { ...state.stats, departures: state.stats.departures + 1 },
        events: [news, ...state.events].slice(0, 20),
      }
    }
    case 'GIVE_RAISE': {
      const s = state.staff.find((x) => x.id === action.staffId)
      if (!s) return state
      const market = marketSalaryFor(s.role, staffPower(s), globalWeek(state))
      // a raise only ever moves someone up to today's market rate
      if (market <= s.salary) return state
      const news = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: `💰 You raised ${s.name} from $${s.salary.toLocaleString()}/wk to $${market.toLocaleString()}/wk.`,
        week: globalWeek(state),
      }
      return {
        ...state,
        staff: state.staff.map((x) => (x.id === action.staffId ? { ...x, salary: market } : x)),
        events: [news, ...state.events].slice(0, 20),
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
      let followerGain = 0
      let published = models
      if (model) {
        // the public benchmark: where this model lands against everything already released
        const field = state.competitors.flatMap((c) => c.models.filter((cm) => cm.releaseWeek <= week))
        const better = field.filter((cm) => cm.quality > model.quality).length
        const rank = better + 1
        const total = field.length + 1

        // users of your own older models of the same kind upgrade to the new one
        let inheritedPaying = 0
        let inheritedTrial = 0
        published = published.map((m) => {
          if (m.id === action.id || m.status !== 'published' || m.typeId !== model.typeId) return m
          const moving = Math.round((m.customers + m.freeCustomers) * SUCCESSOR_MIGRATION)
          if (moving <= 0) return m
          const fromPaying = Math.min(m.customers, Math.round(m.customers * SUCCESSOR_MIGRATION))
          const fromTrial = Math.min(m.freeCustomers, Math.round(m.freeCustomers * SUCCESSOR_MIGRATION))
          inheritedPaying += fromPaying
          inheritedTrial += fromTrial
          return { ...m, customers: m.customers - fromPaying, freeCustomers: m.freeCustomers - fromTrial }
        })
        published = published.map((m) =>
          m.id === action.id
            ? ({
                ...m,
                customers: m.customers + inheritedPaying,
                freeCustomers: m.freeCustomers + inheritedTrial,
                publishedWeek: week,
                sotaAtPublish: stateOfTheArt(state.competitors, week),
                benchmarkRank: rank,
                benchmarkField: total,
              } as AIModel)
            : m,
        )

        launchEvents.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text:
            rank === 1
              ? `🏅 ${model.name} scored ${model.quality} and tops the public benchmark. The best model in the world right now.`
              : `📊 ${model.name} scored ${model.quality} on the public benchmark: #${rank} of ${total} models in the world.`,
          week,
        })
        // Topping the benchmark is only news when it is your own best work too.
        // Otherwise re-shipping the same model over and over would farm followers.
        const myBest = state.models.reduce(
          (best, m) => (m.status === 'published' && m.quality > best ? m.quality : best),
          0,
        )
        if (rank === 1 && model.quality > myBest) {
          followerGain = Math.round(15000 + Math.min(60000, state.followers * 0.02))
        }
        const inherited = inheritedPaying + inheritedTrial
        if (inherited > 0) {
          launchEvents.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: `🔁 ${inherited.toLocaleString()} users upgraded from your older ${MODEL_TYPE_MAP[model.typeId]?.name ?? 'models'} to ${model.name}.`,
            week,
          })
        }
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

      // Shipping adds safety debt, and how it was built decides how much: cheap
      // data, a distilled teacher and a rushed training run all add to it.
      let riskAdded = RISK_PER_PUBLISH
      if (model) {
        if (!model.dataTier || model.dataTier === 'scraped') riskAdded += RISK_CHEAP_DATA
        if (model.distilledFrom) riskAdded += RISK_DISTILLED
        if ((model.totalWeeks ?? 0) > 0 && model.totalWeeks < RISK_RUSHED_WEEKS) riskAdded += RISK_RUSHED
      }

      const newEvents = [...scandalEvents, ...launchEvents]
      const events = newEvents.length > 0 ? [...newEvents, ...state.events].slice(0, 20) : state.events
      return {
        ...state,
        models: published,
        events,
        money,
        followers: followers + followerGain,
        competitors,
        risk: Math.min(RISK_MAX, state.risk + riskAdded),
        stats: { ...state.stats, modelsShipped: state.stats.modelsShipped + 1 },
      }
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
      if (!choice || choice.disabled) return state
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

      // Anyone who leaves takes their half-finished course with them, or the
      // company keeps paying for training nobody is attending.
      let staffTraining = state.staffTraining
      const dropTraining = (id: string) => {
        staffTraining = staffTraining.filter((t) => t.staffId !== id)
      }

      let departures = 0
      let poachedOut = 0
      if (e.loseStaffId) {
        staff = staff.filter((s) => s.id !== e.loseStaffId)
        dropTraining(e.loseStaffId)
        departures++
        // the only event that takes someone by offering them more is a poaching one
        if (ev.id.startsWith('poach-')) poachedOut++
      }

      if (e.keepStaffId && e.keepStaffSalary) {
        const salary = e.keepStaffSalary
        staff = staff.map((s) => (s.id === e.keepStaffId ? { ...s, salary } : s))
      }

      if (e.loseBestEngineer) {
        const engineers = staff.filter((s) => s.role === 'engineer')
        if (engineers.length > 0) {
          const best = engineers.reduce((a, b) => (staffPower(a) > staffPower(b) ? a : b))
          staff = staff.filter((s) => s.id !== best.id)
          dropTraining(best.id)
          departures++
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
        staffTraining,
        models,
        pendingEvent: null,
        stats: {
          ...state.stats,
          departures: state.stats.departures + departures,
          poachedOut: state.stats.poachedOut + poachedOut,
        },
        events: [newsEvent, ...state.events].slice(0, 20),
      }
    }
    case 'TICK': {
      // In a race the world does not wait while you read a modal. Everyone is on
      // one clock, so a decision you take slowly costs you weeks rather than
      // quietly putting your whole game behind everyone else's.
      if (state.paused) return state
      if (state.pendingEvent && !state.inRace) return state
      return advanceOneWeek(state)
    }
    case 'ADVANCE_JOBS': {
      if (state.paused) return state
      if (state.pendingEvent && !state.inRace) return state
      return advanceJobs(state, action.delta)
    }
    case 'SET_WEEK': {
      const current = globalWeek(state)
      const target = Math.max(1, action.week)
      if (target <= current) return state
      let next = state
      // fast-forward replays both clocks so jobs land exactly where real time would put them
      for (let i = current; i < target; i++) next = advanceJobs(advanceOneWeek(next), 1)
      return next
    }
    case 'SET_MONEY':
      return { ...state, money: action.money }
    case 'ADD_MONEY':
      return { ...state, money: state.money + action.amount }
    case 'FINISH_ALL': {
      const researched = [...new Set([...state.researched, ...state.researching.map((r) => r.id)])]
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
