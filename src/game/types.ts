export type Nationality = 'china' | 'europe' | 'usa'

export type Role = 'researcher' | 'engineer' | 'marketer' | 'lawyer'

export interface Staff {
  id: string
  name: string
  nationality: Nationality
  role: Role
  examScore: number // 0-200
  salary: number // weekly $
}

export interface GameDate {
  year: number
  week: number // 1-52
}

export type Screen = 'title' | 'naming' | 'main'

export interface ResearchItem {
  id: string
  name: string
  description: string
  cost: number
  weeks: number
  requires: string[]
  qualityBonus: number
  efficiencyBonus?: number
}

export interface ResearchProgress {
  id: string
  weeksRemaining: number
  totalWeeks: number
}

export interface StaffTraining {
  staffId: string
  weeksRemaining: number
  totalWeeks: number
  scoreGain: number
}

export type PromoKind = 'discount' | 'free'

export interface ModelType {
  id: string
  name: string
  icon: string
  requires: string[]
  growthBase: number // weekly user growth at quality 100
}

export type ModelStatus = 'training' | 'ready' | 'published'

export type PricingModel = 'api' | 'subscription' | 'opensource'

export type PostType = 'announcement' | 'update' | 'hype' | 'meme' | 'devlog' | 'opensource'

export interface Post {
  id: string
  text: string
  type: PostType
  week: number
  followersGained: number
  viral?: boolean
  trending?: boolean
}

export interface AIModel {
  id: string
  name: string
  typeId: string
  quality: number
  status: ModelStatus
  weeksRemaining: number
  totalWeeks: number
  gpus: number
  customers: number
  pricing?: PricingModel
  dataTier?: string
  promo?: PromoKind
  promoWeeksLeft?: number
}

export interface CompetitorModel {
  id: string
  name: string
  icon: string
  typeId: string
  quality: number
  customers: number
  growthBase: number
  releaseWeek: number
}

export interface Competitor {
  id: string
  name: string
  icon: string
  followers: number
  models: CompetitorModel[]
}

export interface GameEvent {
  id: string
  text: string
  week: number
}

export interface EffectOp {
  money?: number
  followers?: number
  customersPct?: number
  gpus?: number
  hireRole?: Role
  loseBestEngineer?: boolean
  lawsuit?: boolean
}

export interface EventChoice {
  label: string
  hint?: string
  news: string
  effects: EffectOp
}

export interface PendingEvent {
  id: string
  icon: string
  title: string
  text: string
  choices: EventChoice[]
}

export interface GameState {
  screen: Screen
  companyName: string
  money: number
  date: GameDate
  staff: Staff[]
  paused: boolean
  researched: string[]
  researching: ResearchProgress[]
  staffTraining: StaffTraining[]
  models: AIModel[]
  followers: number
  posts: Post[]
  lastPostWeek: number
  trendingHashtag: string
  trendingSetWeek: number
  lastHypeBotsWeek: number
  lastInvestmentWeek: number
  gpuCards: number
  datacenters: number
  datacenterBuilds: number[]
  rentedDatacenters: number
  ram: number
  ssd: number
  poached: string[]
  officeLevel: number
  isPublic: boolean
  campaignWeeksLeft: number
  lastCampaignWeek: number
  books: string[]
  competitors: Competitor[]
  events: GameEvent[]
  pendingEvent: PendingEvent | null
}
