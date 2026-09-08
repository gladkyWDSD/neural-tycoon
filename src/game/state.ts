import type { AIModel, GameEvent, GameState, PostType, PricingModel, Staff } from './types'
import { DESKS_PER_LEVEL, CAMPAIGN_COOLDOWN, CAMPAIGN_COST, CAMPAIGN_DURATION, COMPETITOR_POACH_BASE_CHANCE, COMPETITOR_POACH_GRACE_WEEKS, MAX_OFFICE_LEVEL, MAX_SCORE, OFFICE_UPGRADE_BASE_COST, START_DATE, START_MONEY, START_YEAR, WEEKS_PER_YEAR } from './constants'
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
    models: [],
    followers: 0,
    posts: [],
    lastPostWeek: 0,
    trendingHashtag: pickTrendingHashtag(),
    trendingSetWeek: 0,
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
    competitors: (raw.competitors ?? base.competitors).map((c) => ({ ...c, followers: c.followers ?? 100000 })),
    events: raw.events ?? base.events,
    trendingHashtag: raw.trendingHashtag ?? base.trendingHashtag,
    trendingSetWeek: raw.trendingSetWeek ?? 0,
    rentedDatacenters: raw.rentedDatacenters ?? 0,
    ram: raw.ram ?? 0,
    ssd: raw.ssd ?? 0,
    poached: raw.poached ?? [],
    officeLevel: raw.officeLevel ?? 1,
    isPublic: raw.isPublic ?? false,
    campaignWeeksLeft: raw.campaignWeeksLeft ?? 0,
    lastCampaignWeek: raw.lastCampaignWeek ?? -CAMPAIGN_COOLDOWN,
    books: raw.books ?? [],
  }
}

function computeQuality(state: GameState, gpus: number, dataTier?: string): number {
  const avgResearcher = avgScoreByRole(state.staff, 'researcher')
  const avgEngineer = avgScoreByRole(state.staff, 'engineer')
  const factor = gpuQualityFactor(gpus)
  const techBonus = state.researched.reduce((sum, id) => sum + (RESEARCH_MAP[id]?.qualityBonus ?? 0), 0)
  const dataQuality = dataTier ? (DATA_TIER_MAP[dataTier]?.quality ?? 0) : 0
  const booksBonus = state.books.reduce((sum, id) => sum + (BOOK_MAP[id]?.quality ?? 0), 0)
  const ceiling = 40 + avgResearcher * 0.3
  const realization = 0.5 + avgEngineer / 400
  const q = ceiling * realization * factor + techBonus + dataQuality + ssdQualityBonus(state.ssd) + booksBonus
  return Math.max(0, Math.min(100, Math.round(q)))
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

  if (campaignWeeksLeft > 0) campaignWeeksLeft--

  // salaries (paid weekly)
  money -= state.staff.reduce((sum, s) => sum + s.salary, 0)

  // electricity for active GPU cards
  money -= Math.round(activeCards(state) * ELECTRICITY_PER_CARD_WEEK * (1 - companyEfficiency(state)))

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

  const week = (date.year - START_YEAR) * WEEKS_PER_YEAR + date.week

  let trendingHashtag = state.trendingHashtag
  let trendingSetWeek = state.trendingSetWeek
  if (week - trendingSetWeek >= TRENDING_ROTATE_WEEKS) {
    trendingHashtag = pickTrendingHashtag(trendingHashtag)
    trendingSetWeek = week
  }

  function playerCustomersIn(typeId: string): number {
    return state.models.reduce(
      (sum, m) => sum + (m.status === 'published' && m.typeId === typeId ? m.customers : 0),
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

  // models
  const finishedModels: string[] = []
  models = models.map((m) => {
    if (m.status === 'training') {
      const weeksRemaining = m.weeksRemaining - 1
      if (weeksRemaining <= 0) {
        finishedModels.push(m.name)
        const quality = computeQuality(state, m.gpus, m.dataTier)
        return { ...m, status: 'ready', weeksRemaining: 0, customers: 0, quality }
      }
      return { ...m, weeksRemaining }
    }
    if (m.status === 'published' && m.pricing) {
      const type = MODEL_TYPE_MAP[m.typeId]
      const pricing = PRICING_MAP[m.pricing]
      const marketers = state.staff.filter((s) => s.role === 'marketer').length
      const sat = marketSaturation(m.typeId, week, playerCustomersIn(m.typeId), state.competitors)
      const campaignMult = state.campaignWeeksLeft > 0 ? 2 : 1
      const growth = Math.round(
        type.growthBase *
          (m.quality / 100) *
          pricing.growthMultiplier *
          (1 + marketers * 0.2) *
          followerBoost(state.followers) *
          sat *
          campaignMult,
      )
      const customers = m.customers + growth
      money += customers * pricing.revPerCustomerPerWeek
      if (m.pricing === 'opensource') {
        followers += Math.round(customers * 0.005)
      }
      return { ...m, customers }
    }
    return m
  })

  // chance a competitor smears you + rental dispute news
  let events = state.events
  const newEvents: GameEvent[] = []

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

  if (disputes > 0) {
    newEvents.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: `⚡ Rental dispute! You lost ${disputes} rented datacenter${disputes > 1 ? 's' : ''}.`,
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

  if (Math.random() < 0.4) {
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

  const next = { ...state, date, money, researched, researching, models, datacenters, datacenterBuilds, rentedDatacenters, competitors, followers, campaignWeeksLeft, events, trendingHashtag, trendingSetWeek, staff }

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
      return { ...state, models: [...state.models, action.model], money: state.money - dataCost }
    }
    case 'BUY_GPU': {
      const count = Math.max(1, action.count)
      const cost = GPU_CARD_COST * count
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
    case 'SET_GPU':
      return { ...state, gpuCards: Math.max(0, action.count) }
    case 'SET_DATACENTERS':
      return { ...state, datacenters: Math.max(0, action.count) }
    case 'PUBLISH_MODEL': {
      const model = state.models.find((m) => m.id === action.id)
      const models = state.models.map((m) =>
        m.id === action.id
          ? ({ ...m, status: 'published', pricing: action.pricing } as AIModel)
          : m,
      )
      const events = model
        ? [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              text: `🚀 ${model.name} is now live! Customers are joining.`,
              week: globalWeek(state),
            },
            ...state.events,
          ].slice(0, 20)
        : state.events
      return { ...state, models, events }
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
          ? { ...m, status: 'ready' as const, weeksRemaining: 0, customers: 0, quality: computeQuality(state, m.gpus, m.dataTier) }
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
