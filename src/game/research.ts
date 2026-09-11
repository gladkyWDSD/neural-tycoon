import { DISCOUNT_REV_MULT, FREE_TRIAL_REV_MULT } from './constants'
import type { AIModel, ModelType, PricingModel, ResearchItem } from './types'

export interface PricingInfo {
  id: PricingModel
  label: string
  icon: string
  description: string
  revPerCustomerPerWeek: number
  growthMultiplier: number
}

export const PRICING_MODELS: PricingInfo[] = [
  {
    id: 'subscription',
    label: 'Subscription',
    icon: '🔁',
    description: 'Monthly subs. Fast adoption, lower value per customer.',
    revPerCustomerPerWeek: 0.5,
    growthMultiplier: 1,
  },
  {
    id: 'api',
    label: 'API',
    icon: '🔌',
    description: 'Pay-per-call for developers. Slow adoption, high value per customer.',
    revPerCustomerPerWeek: 3,
    growthMultiplier: 0.5,
  },
  {
    id: 'opensource',
    label: 'Open Source',
    icon: '🐙',
    description: 'Paid, but the community builds plugins. Huge popularity.',
    revPerCustomerPerWeek: 0.35,
    growthMultiplier: 1.8,
  },
]

export const PRICING_MAP: Record<PricingModel, PricingInfo> = Object.fromEntries(
  PRICING_MODELS.map((p) => [p.id, p]),
) as Record<PricingModel, PricingInfo>

export interface DataTier {
  id: string
  label: string
  cost: number
  quality: number
  description: string
}

export const DATA_TIERS: DataTier[] = [
  { id: 'scraped', label: 'Scraped', cost: 0, quality: 0, description: 'Free web data.' },
  { id: 'public', label: 'Public', cost: 20000, quality: 5, description: 'Curated public datasets.' },
  { id: 'licensed', label: 'Licensed', cost: 80000, quality: 12, description: 'High-quality licensed data.' },
  { id: 'premium', label: 'Premium', cost: 200000, quality: 20, description: 'The best data money can buy.' },
]

export const DATA_TIER_MAP: Record<string, DataTier> = Object.fromEntries(
  DATA_TIERS.map((t) => [t.id, t]),
)

export interface Book {
  id: string
  name: string
  icon: string
  cost: number
  quality: number
  description: string
}

export const BOOKS: Book[] = [
  { id: 'deeplearning', name: 'Intro to Deep Learning', icon: '📘', cost: 1500, quality: 2, description: 'The fundamentals.' },
  { id: 'attention', name: 'Attention Is All You Need', icon: '📗', cost: 3000, quality: 3, description: 'Transformers 101.' },
  { id: 'alignment', name: 'The Alignment Handbook', icon: '📕', cost: 6000, quality: 5, description: 'Safe & helpful AI.' },
  { id: 'scaling', name: 'Scaling Laws Compendium', icon: '📙', cost: 10000, quality: 8, description: 'Bigger is better.' },
  { id: 'rlhf', name: 'The Art of RLHF', icon: '📔', cost: 18000, quality: 12, description: 'Human feedback mastery.' },
  { id: 'agi', name: 'AGI: A Complete Guide', icon: '📚', cost: 30000, quality: 18, description: 'The final frontier.' },
]

export const BOOK_MAP: Record<string, Book> = Object.fromEntries(
  BOOKS.map((b) => [b.id, b]),
)

export function weeklyRevenue(model: AIModel): number {
  if (model.status !== 'published' || !model.pricing) return 0
  const rate = PRICING_MAP[model.pricing].revPerCustomerPerWeek
  // trial users pay the promo rate — nothing at all during a free-access reset
  const trialRate = model.promo === 'discount' ? DISCOUNT_REV_MULT : model.promo === 'free' ? FREE_TRIAL_REV_MULT : 1
  return Math.round(model.customers * rate + model.freeCustomers * rate * trialRate)
}

export const RESEARCH_ITEMS: ResearchItem[] = [
  {
    id: 'llm',
    name: 'Large Language Models',
    description: 'The core transformer architecture behind chatbots & coding assistants.',
    cost: 50000,
    weeks: 2,
    requires: [],
    qualityBonus: 0,
  },
  {
    id: 'diffusion',
    name: 'Diffusion Models',
    description: 'Generative image models that turn text into pictures.',
    cost: 80000,
    weeks: 3,
    requires: [],
    qualityBonus: 0,
  },
  {
    id: 'finetune',
    name: 'Fine-Tuning & RLHF',
    description: 'Align models with human feedback. Improves all models.',
    cost: 120000,
    weeks: 4,
    requires: ['llm'],
    qualityBonus: 10,
  },
  {
    id: 'multimodal',
    name: 'Multimodal Models',
    description: 'Models that understand text, images and more together.',
    cost: 250000,
    weeks: 6,
    requires: ['llm', 'diffusion'],
    qualityBonus: 10,
  },
  {
    id: 'agents',
    name: 'AI Agents',
    description: 'Autonomous agents that plan and use tools.',
    cost: 400000,
    weeks: 8,
    requires: ['llm', 'finetune'],
    qualityBonus: 10,
  },
  {
    id: 'reasoning',
    name: 'Reasoning Models',
    description: 'Step-by-step reasoning. Major quality boost.',
    cost: 500000,
    weeks: 10,
    requires: ['llm', 'finetune'],
    qualityBonus: 20,
  },
  {
    id: 'selfimprove',
    name: 'Self-Improving AI',
    description: 'AI that programs AI. Replaces human engineers.',
    cost: 1000000,
    weeks: 14,
    requires: ['reasoning', 'agents'],
    qualityBonus: 30,
  },
  {
    id: 'distillation',
    name: 'Knowledge Distillation',
    description: "Train your models on a rival's outputs. Cheaper, faster — and legally risky.",
    cost: 100000,
    weeks: 3,
    requires: ['llm'],
    qualityBonus: 0,
  },
  {
    id: 'inference',
    name: 'Inference Optimization',
    description: 'Run models cheaper and faster. Reduces electricity costs.',
    cost: 150000,
    weeks: 4,
    requires: ['llm'],
    qualityBonus: 0,
    efficiencyBonus: 0.15,
  },
  {
    id: 'compression',
    name: 'Model Compression',
    description: 'Shrink models without losing quality. Cuts running costs.',
    cost: 300000,
    weeks: 6,
    requires: ['inference'],
    qualityBonus: 0,
    efficiencyBonus: 0.15,
  },
]

export const RESEARCH_MAP: Record<string, ResearchItem> = Object.fromEntries(
  RESEARCH_ITEMS.map((r) => [r.id, r]),
)

export const MODEL_TYPES: ModelType[] = [
  { id: 'general', name: 'General Chatbot', icon: '🤖', requires: ['llm'], growthBase: 8000 },
  { id: 'coding', name: 'Coding Assistant', icon: '💻', requires: ['llm'], growthBase: 6500 },
  { id: 'image', name: 'Image Generator', icon: '🎨', requires: ['diffusion'], growthBase: 9000 },
  { id: 'agent', name: 'AI Agent', icon: '🧠', requires: ['agents'], growthBase: 14000 },
]

export const MODEL_TYPE_MAP: Record<string, ModelType> = Object.fromEntries(
  MODEL_TYPES.map((m) => [m.id, m]),
)
