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

export const COMPETITOR_POACH_GRACE_WEEKS = 4 // no poaching risk while you're still ramping up
export const COMPETITOR_POACH_BASE_CHANCE = 0.006 // per-staff weekly base, scaled by score & how underpaid they are

export const HYPE_BOTS_COST = 25000
export const HYPE_BOTS_FOLLOWERS = 1500
export const HYPE_BOTS_COOLDOWN = 3 // weeks
export const HYPE_BOTS_BUST_CHANCE = 0.25 // chance the bots get called out instead of boosting you

export const COMPETITOR_BOT_CHANCE = 0.15 // weekly chance a rival buys their own wave of hype bots

// paid influence operations (Ads panel)
export const BOT_ATTACK_COST = 30000
export const BOT_ATTACK_COOLDOWN = 4
export const BOT_ATTACK_BACKFIRE_CHANCE = 0.2

export const HACKER_COST = 120000
export const HACKER_COOLDOWN = 8
export const HACKER_CAUGHT_CHANCE = 0.25
export const HACKER_FINE = 200000
export const HACKER_QUALITY_DAMAGE = 8

export const JOURNALIST_COST = 60000
export const JOURNALIST_COOLDOWN = 6

export const STAFF_TRAINING_WEEKS = 3
export const STAFF_TRAINING_SCORE_GAIN = 8
export const STAFF_TRAINING_COST_PER_POINT = 4000

export const INVESTMENT_COOLDOWN_WEEKS = 15

export const DISCOUNT_DURATION = 3
export const DISCOUNT_COST = 5000
export const DISCOUNT_GROWTH_MULT = 1.6
export const DISCOUNT_REV_MULT = 0.6

export const FREE_TRIAL_DURATION = 2
export const FREE_TRIAL_COST = 15000
export const FREE_TRIAL_GROWTH_MULT = 2.6
export const FREE_TRIAL_REV_MULT = 0

// US regulations
export const REGULATION_START_WEEK = 10 // regulators leave you alone for the first few months
export const REGULATION_CHECK_CHANCE = 0.05 // weekly chance a new regulation is enacted
export const MAX_ACTIVE_REGULATIONS = 4
export const REGULATION_BASE_DATACENTER_SHUTDOWN_CHANCE = 0.01 // ambient compliance risk, even with no regulations active

// lobbying (Government panel)
export const LOBBY_COST = 80000
export const LOBBY_COOLDOWN = 6 // weeks
export const LOBBY_DURATION = 8 // weeks of reduced regulatory risk
export const LOBBY_RISK_REDUCTION = 0.4 // multiplier applied to regulation/shutdown/fine chance while lobbying is active
export const LOBBY_REPEAL_CHANCE = 0.35 // chance a lobbying push repeals a random active regulation instead

