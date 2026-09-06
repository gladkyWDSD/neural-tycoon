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
}

export interface ResearchProgress {
  id: string
  weeksRemaining: number
}

export interface ModelType {
  id: string
  name: string
  icon: string
  requires: string[]
  growthBase: number // weekly user growth at quality 100
}

export type ModelStatus = 'training' | 'ready' | 'published'

export type PricingModel = 'api' | 'subscription'

export type PostType = 'announcement' | 'update' | 'hype' | 'meme'

export interface Post {
  id: string
  text: string
  type: PostType
  week: number
  followersGained: number
}

export interface AIModel {
  id: string
  name: string
  typeId: string
  quality: number
  status: ModelStatus
  weeksRemaining: number
  gpus: number
  customers: number
  pricing?: PricingModel
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
  models: CompetitorModel[]
}

export interface GameEvent {
  id: string
  text: string
  week: number
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
  models: AIModel[]
  followers: number
  posts: Post[]
  lastPostWeek: number
  gpuCards: number
  datacenters: number
  datacenterBuilds: number[]
  rentedDatacenters: number
  officeLevel: number
  competitors: Competitor[]
  events: GameEvent[]
}
