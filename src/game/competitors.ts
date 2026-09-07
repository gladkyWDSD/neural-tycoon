import type { Competitor, CompetitorModel } from './types'

export const MARKET_CAP_BASE: Record<string, number> = {
  general: 2_000_000,
  coding: 1_000_000,
  image: 1_500_000,
  agent: 800_000,
}

export function marketCap(typeId: string, week: number): number {
  const base = MARKET_CAP_BASE[typeId] ?? 1_000_000
  return Math.round(base * (1 + week * 0.04))
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

export function marketSaturation(typeId: string, week: number, playerCustomers: number, competitors: Competitor[]): number {
  const total = playerCustomers + competitorCustomers(competitors, typeId, week)
  const cap = marketCap(typeId, week)
  return Math.max(0.05, Math.min(1, 1 - total / cap))
}

const MODEL_SUFFIXES = ['Pro', 'Ultra', 'Max', '2', 'X', 'Turbo', '+', 'Neo']

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

export const COMPETITOR_SEED: Competitor[] = [
  {
    id: 'closedai',
    followers: 300000,
    name: 'ClosedAI',
    icon: '🔒',
    models: [
      model('chatpt', 'ChatPT', '💬', 'general', 90, 180000, 12000, 1),
      model('dolle', 'Doll-E', '🎨', 'image', 82, 70000, 8000, 1),
      model('chatpt5', 'ChatPT 5', '💬', 'general', 96, 0, 15000, 40),
    ],
  },
  {
    id: 'gargle',
    followers: 250000,
    name: 'Gargle Brain',
    icon: '🧠',
    models: [
      model('geminix', 'Geminix', '♊', 'general', 85, 140000, 10000, 1),
      model('geminixpro', 'Geminix Pro', '♊', 'general', 93, 0, 13000, 30),
    ],
  },
  {
    id: 'anpolus',
    followers: 200000,
    name: 'Anpolus',
    icon: '🐝',
    models: [
      model('clawd', 'Clawd', '🤝', 'general', 88, 120000, 9000, 1),
      model('clawd2', 'Clawd 2', '🤝', 'general', 95, 0, 14000, 45),
    ],
  },
  {
    id: 'deeppeek',
    followers: 150000,
    name: 'DeepPeek',
    icon: '🔍',
    models: [
      model('deeppeekcoder', 'DeepPeek-Coder', '💻', 'coding', 80, 50000, 7000, 1),
      model('deeppeekv', 'DeepPeek-V', '🔍', 'general', 82, 40000, 8000, 1),
      model('deeppeekr', 'DeepPeek-R', '🔍', 'general', 90, 0, 12000, 35),
    ],
  },
  {
    id: 'mistrall',
    followers: 80000,
    name: 'Mistrall',
    icon: '🌬️',
    models: [
      model('mistralllarge', 'Mistrall Large', '💨', 'general', 78, 30000, 6000, 1),
    ],
  },
  {
    id: 'xlab',
    followers: 60000,
    name: 'xLab',
    icon: '🚀',
    models: [
      model('grak', 'Grak', '🛰️', 'general', 75, 20000, 5000, 1),
    ],
  },
]
