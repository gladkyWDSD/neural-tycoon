export interface RegulationEffects {
  revenueMultiplier?: number // applied to weekly revenue from published models
  electricityMultiplier?: number // applied to weekly electricity cost
  gpuCostMultiplier?: number // applied to the price of GPU cards
  datacenterShutdownChance?: number // added to the weekly chance a single owned datacenter is shut down
  fineChance?: number // weekly chance of getting fined for non-compliance
  fineMin?: number
  fineMax?: number
}

export interface Regulation {
  id: string
  name: string
  icon: string
  description: string
  effects: RegulationEffects
}

export const REGULATIONS: Regulation[] = [
  {
    id: 'ai-transparency-act',
    name: 'AI Transparency Act',
    icon: '📜',
    description: 'Mandatory disclosure of training data & model cards.',
    effects: { revenueMultiplier: 0.96 },
  },
  {
    id: 'chip-export-controls',
    name: 'Chip Export Controls',
    icon: '🔌',
    description: 'Export restrictions on advanced chips drive up GPU prices.',
    effects: { gpuCostMultiplier: 1.3 },
  },
  {
    id: 'energy-grid-oversight',
    name: 'Energy Grid Oversight',
    icon: '⚡',
    description: 'Datacenters face strict energy audits — some get shut down.',
    effects: { electricityMultiplier: 1.35, datacenterShutdownChance: 0.03 },
  },
  {
    id: 'data-privacy-act',
    name: 'Data Privacy Act',
    icon: '🔒',
    description: 'Non-compliant data handling risks steep fines.',
    effects: { fineChance: 0.06, fineMin: 40000, fineMax: 150000 },
  },
  {
    id: 'antitrust-probe',
    name: 'Antitrust Investigation',
    icon: '🕵️',
    description: 'Regulators scrutinize your market dominance.',
    effects: { revenueMultiplier: 0.93 },
  },
  {
    id: 'ai-safety-licensing',
    name: 'AI Safety Licensing',
    icon: '🪪',
    description: 'Models require government safety certification before release.',
    effects: { revenueMultiplier: 0.97, gpuCostMultiplier: 1.1 },
  },
]

export const REGULATION_MAP: Record<string, Regulation> = Object.fromEntries(
  REGULATIONS.map((r) => [r.id, r]),
)

export function pickNewRegulation(active: string[]): Regulation | null {
  const available = REGULATIONS.filter((r) => !active.includes(r.id))
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}

export function regulationRevenueMultiplier(active: string[]): number {
  return active.reduce((mult, id) => mult * (REGULATION_MAP[id]?.effects.revenueMultiplier ?? 1), 1)
}

export function regulationElectricityMultiplier(active: string[]): number {
  return active.reduce((mult, id) => mult * (REGULATION_MAP[id]?.effects.electricityMultiplier ?? 1), 1)
}

export function regulationGpuCostMultiplier(active: string[]): number {
  return active.reduce((mult, id) => mult * (REGULATION_MAP[id]?.effects.gpuCostMultiplier ?? 1), 1)
}

export function regulationDatacenterShutdownChance(active: string[]): number {
  return active.reduce((sum, id) => sum + (REGULATION_MAP[id]?.effects.datacenterShutdownChance ?? 0), 0)
}

export function regulationFineRoll(active: string[]): { fine: number; source: Regulation } | null {
  for (const id of active) {
    const reg = REGULATION_MAP[id]
    if (!reg?.effects.fineChance) continue
    if (Math.random() < reg.effects.fineChance) {
      const min = reg.effects.fineMin ?? 0
      const max = reg.effects.fineMax ?? min
      const fine = Math.round(min + Math.random() * (max - min))
      return { fine, source: reg }
    }
  }
  return null
}

export function regulationEffectSummary(reg: Regulation): string[] {
  const parts: string[] = []
  const e = reg.effects
  if (e.revenueMultiplier) parts.push(`${Math.round((1 - e.revenueMultiplier) * 100)}% revenue`)
  if (e.electricityMultiplier) parts.push(`+${Math.round((e.electricityMultiplier - 1) * 100)}% electricity`)
  if (e.gpuCostMultiplier) parts.push(`+${Math.round((e.gpuCostMultiplier - 1) * 100)}% GPU cost`)
  if (e.datacenterShutdownChance) parts.push(`+${Math.round(e.datacenterShutdownChance * 100)}%/wk shutdown risk`)
  if (e.fineChance) parts.push(`${Math.round(e.fineChance * 100)}%/wk fine risk ($${(e.fineMin ?? 0) / 1000}k–${(e.fineMax ?? 0) / 1000}k)`)
  return parts
}
