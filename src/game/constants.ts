import type { GameDate, Nationality } from './types'

export const START_MONEY = 3_500_000
export const START_YEAR = 2022
export const WEEKS_PER_YEAR = 52

export const START_DATE: GameDate = { year: START_YEAR, week: 1 }

export const DEFAULT_COMPANY_NAMES = ['Anpolus', 'ClosedAI', 'DeepBrain', 'WhyAI']

export const DEFAULT_AI_NAMES = [
  'ChatPT',
  'Clawd',
  'Geminix',
  'Grak',
  'DeepPeek',
  'Llam',
  'Mistrall',
  'Kwen',
  'Midway',
  'Doll-E',
  'Stable Fusion',
  'CoPilo',
]

export interface NationalityInfo {
  id: Nationality
  label: string
  flag: string
  specialty: string
  // skill bias per role (0-200 scale), added on top of a base roll
  mathBias: number
  codingBias: number
  marketingBias: number
  legalBias: number
}

export const NATIONALITIES: Record<Nationality, NationalityInfo> = {
  china: {
    id: 'china',
    label: 'China',
    flag: '🇨🇳',
    specialty: 'Math',
    mathBias: 30,
    codingBias: 5,
    marketingBias: 0,
    legalBias: 0,
  },
  europe: {
    id: 'europe',
    label: 'Europe',
    flag: '🇪🇺',
    specialty: 'Programming',
    mathBias: 5,
    codingBias: 30,
    marketingBias: 0,
    legalBias: 0,
  },
  usa: {
    id: 'usa',
    label: 'USA',
    flag: '🇺🇸',
    specialty: 'Marketing & Legal',
    mathBias: 5,
    codingBias: 0,
    marketingBias: 25,
    legalBias: 25,
  },
}

export const MIN_HIRE_SCORE = 150
export const MAX_SCORE = 200
export const MIN_SCORE = 0

export const DESKS_PER_LEVEL = 6
export const OFFICE_UPGRADE_BASE_COST = 200000
export const MAX_OFFICE_LEVEL = 4

export const CAMPAIGN_DURATION = 4
export const CAMPAIGN_COOLDOWN = 10
export const CAMPAIGN_COST = 40000
