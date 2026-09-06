import type { AIModel, GameEvent, GameState, PostType, PricingModel, Staff } from './types'
import { DESKS_PER_LEVEL, MAX_OFFICE_LEVEL, OFFICE_UPGRADE_BASE_COST, START_DATE, START_MONEY, START_YEAR, WEEKS_PER_YEAR } from './constants'
import { advanceWeek } from './date'
import { MODEL_TYPE_MAP, PRICING_MAP, RESEARCH_ITEMS, RESEARCH_MAP } from './research'
import { POST_TYPE_MAP, followerBoost, followerGain } from './social'
import { DATACENTER_BUILD_WEEKS, DATACENTER_COST, ELECTRICITY_PER_CARD_WEEK, GPU_CARD_COST, RENT_DISPUTE_CHANCE, RENT_WEEKLY_FEE, activeCards, gpuQualityFactor } from './gpu'
import { COMPETITOR_SEED, generateCompetitorModel, marketSaturation } from './competitors'

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
    gpuCards: 0,
    datacenters: 0,
    datacenterBuilds: [],
    rentedDatacenters: 0,
    officeLevel: 1,
    competitors: COMPETITOR_SEED.map((c) => ({ ...c, models: c.models.map((m) => ({ ...m })) })),
    events: [],
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
  | { type: 'BUY_GPU'; count: number }
  | { type: 'BUILD_DATACENTER' }
  | { type: 'RENT_DATACENTER' }
  | { type: 'UPGRADE_OFFICE' }
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
    }
  })
  return {
    ...base,
    ...raw,
    date: raw.date ?? base.date,
    staff: raw.staff ?? base.staff,
    models,
    competitors: raw.competitors ?? base.competitors,
    events: raw.events ?? base.events,
    rentedDatacenters: raw.rentedDatacenters ?? 0,
    officeLevel: raw.officeLevel ?? 1,
  }
}

function computeQuality(state: GameState, gpus: number): number {
  const avgResearcher = avgScoreByRole(state.staff, 'researcher')
  const avgEngineer = avgScoreByRole(state.staff, 'engineer')
  const factor = gpuQualityFactor(gpus)
  const techBonus = state.researched.reduce((sum, id) => sum + (RESEARCH_MAP[id]?.qualityBonus ?? 0), 0)
  const ceiling = 40 + avgResearcher * 0.3
  const realization = 0.5 + avgEngineer / 400
  const q = ceiling * realization * factor + techBonus
  return Math.max(0, Math.min(100, Math.round(q)))
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

  // salaries (paid weekly)
  money -= state.staff.reduce((sum, s) => sum + s.salary, 0)

  // electricity for active GPU cards
  money -= activeCards(state) * ELECTRICITY_PER_CARD_WEEK

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

  function playerCustomersIn(typeId: string): number {
    return state.models.reduce(
      (sum, m) => sum + (m.status === 'published' && m.typeId === typeId ? m.customers : 0),
      0,
    )
  }

  // competitors grow their own models + improve quality
  let competitors = state.competitors.map((c) => ({
    ...c,
    models: c.models.map((cm) => {
      if (cm.releaseWeek > week) return cm
      const sat = marketSaturation(cm.typeId, week, playerCustomersIn(cm.typeId), state.competitors)
      const growth = Math.round(cm.growthBase * (cm.quality / 100) * sat)
      return { ...cm, customers: cm.customers + growth, quality: Math.min(99, cm.quality + 0.15) }
    }),
  }))

  // competitors occasionally release new models
  let releaseEvent: string | null = null
  if (Math.random() < 0.12) {
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
        const quality = computeQuality(state, m.gpus)
        return { ...m, status: 'ready', weeksRemaining: 0, customers: 0, quality }
      }
      return { ...m, weeksRemaining }
    }
    if (m.status === 'published' && m.pricing) {
      const type = MODEL_TYPE_MAP[m.typeId]
      const pricing = PRICING_MAP[m.pricing]
      const marketers = state.staff.filter((s) => s.role === 'marketer').length
      const sat = marketSaturation(m.typeId, week, playerCustomersIn(m.typeId), state.competitors)
      const growth = Math.round(
        type.growthBase *
          (m.quality / 100) *
          pricing.growthMultiplier *
          (1 + marketers * 0.2) *
          followerBoost(state.followers) *
          sat,
      )
      const customers = m.customers + growth
      money += customers * pricing.revPerCustomerPerWeek
      return { ...m, customers }
    }
    return m
  })

  // chance a competitor smears you + rental dispute news
  let events = state.events
  const newEvents: GameEvent[] = []

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

  return { ...state, date, money, researched, researching, models, datacenters, datacenterBuilds, rentedDatacenters, competitors, events }
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
        researching: [...state.researching, { id: item.id, weeksRemaining: duration }],
      }
    }
    case 'START_MODEL':
      return { ...state, models: [...state.models, action.model] }
    case 'BUY_GPU': {
      const count = Math.max(1, action.count)
      const cost = GPU_CARD_COST * count
      if (state.money < cost) return state
      const next = { ...state, money: state.money - cost, gpuCards: state.gpuCards + count }
      return ecoProtest(next, 0.1, 'Eco activists criticized your GPU purchase!')
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
      const gained = followerGain(info, state.followers, totalCustomers)
      const post = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: action.text.trim(),
        type: action.postType,
        week: currentWeek,
        followersGained: gained,
      }
      return {
        ...state,
        followers: state.followers + gained,
        posts: [post, ...state.posts],
        lastPostWeek: currentWeek,
      }
    }
    case 'SMEAR': {
      const currentWeek = globalWeek(state)
      if (currentWeek <= state.lastPostWeek) return state
      const target = state.competitors.find((c) => c.id === action.competitorId)
      if (!target) return state
      const ratio = Math.min(0.15, 0.03 * (1 + state.followers / 50000))
      let lost = 0
      const competitors = state.competitors.map((c) => {
        if (c.id !== action.competitorId) return c
        return {
          ...c,
          models: c.models.map((m) => {
            const next = Math.round(m.customers * (1 - ratio))
            lost += m.customers - next
            return { ...m, customers: next }
          }),
        }
      })
      const gainedFollowers = Math.round(200 * (1 + state.followers / 20000))
      const events = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `You smeared ${target.name}! They lost ${lost.toLocaleString()} customers. You gained ${gainedFollowers.toLocaleString()} followers.`,
          week: currentWeek,
        },
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
    case 'TICK': {
      if (state.paused) return state
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
          ? { ...m, status: 'ready' as const, weeksRemaining: 0, customers: 0, quality: computeQuality(state, m.gpus) }
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
