export type Nationality = 'china' | 'europe' | 'usa'

export type Role = 'researcher' | 'engineer' | 'marketer' | 'lawyer'

export interface Staff {
  id: string
  name: string
  nationality: Nationality
  role: Role
  examScore: number // 0-200, fixed at hiring: the quality they start with
  /** 1..MAX_STAFF_LEVEL. Everything they contribute is multiplied by this, so
   *  level 10 is worth ten of themselves at level 1. Raised by training. */
  level: number
  salary: number // weekly $
}

export interface GameDate {
  year: number
  week: number // 1-52
}

export type Screen = 'title' | 'naming' | 'lobby' | 'main'

/** How long a run is meant to take, and how hard the race is. */
export type Difficulty = 'easy' | 'medium' | 'long'

/** Dirty tricks one real player can aim at another in a multiplayer race. */
export type AttackKind = 'bots' | 'hackers'

/** What another player can see of your staff, so they can bid for one of them. */
export interface StaffCard {
  id: string
  name: string
  role: Role
  examScore: number
  level: number
  salary: number
}

/** An offer one player has made for another player's employee. */
export interface StaffBid {
  bidId: string
  /** the player who wants them */
  fromId: string
  fromName: string
  /** the employee, as their current owner sees them */
  staff: StaffCard
  amount: number
}

/** Something the local game has decided and now needs to send over the wire. */
export type Outbound =
  | { t: 'attack'; id: string; targetId: string; targetName: string; kind: AttackKind }
  | { t: 'bid'; id: string; targetId: string; bid: StaffBid }
  | { t: 'bidResult'; id: string; targetId: string; bidId: string; matched: boolean; staff?: Staff }

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
  /** the level they reach when the course lands */
  toLevel: number
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
  freeCustomers: number // trial users signed up during a promo; they convert or churn when it ends
  pricing?: PricingModel
  dataTier?: string
  promo?: PromoKind
  promoWeeksLeft?: number
  distilledFrom?: string // competitor model id used as the teacher
  distilledFromName?: string // display snapshot, e.g. "ClosedAI ChatPT"
  distillQuality?: number // teacher quality at the time training started
  distillCaught?: boolean // whether the theft was already exposed
  publishedWeek?: number // when it went live, so its age can be shown
  sotaAtPublish?: number // the best model in the world on the day it shipped
  benchmarkRank?: number // where it placed against the world when it shipped
  benchmarkField?: number // how many models it was ranked against
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
  /** this exact person leaves the company */
  loseStaffId?: string
  /** this exact person stays, on the new weekly salary in keepStaffSalary */
  keepStaffId?: string
  keepStaffSalary?: number
}

export interface EventChoice {
  label: string
  hint?: string
  news: string
  effects: EffectOp
  /** shown but not clickable, e.g. a counter-offer you cannot afford */
  disabled?: boolean
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
  lastBotAttackWeek: number
  lastHackerWeek: number
  lastJournalistWeek: number
  gpuCards: number
  datacenters: number
  datacenterBuilds: number[]
  rentedDatacenters: number
  ram: number
  ssd: number
  poached: string[]
  officeLevel: number
  difficulty: Difficulty
  /** this run is a multiplayer race, so the clock is shared and never waits for you */
  inRace: boolean
  /** set when something has been decided locally and needs sending to another player */
  outbox?: Outbound
  /** another player is bidding for one of your staff and you must answer */
  pendingBid?: StaffBid
  /** an offer you have made and are waiting on */
  sentBid?: { bidId: string; amount: number; staffName: string; targetName: string }
  isPublic: boolean
  /** set once the company is worth WIN_VALUATION: the run is won */
  won: boolean
  campaignWeeksLeft: number
  lastCampaignWeek: number
  books: string[]
  competitors: Competitor[]
  events: GameEvent[]
  pendingEvent: PendingEvent | null
  activeRegulations: string[]
  lobbyWeeksLeft: number
  lastLobbyWeek: number
}
