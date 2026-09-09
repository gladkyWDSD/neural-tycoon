import {
  DISTILL_CAUGHT_CHANCE,
  DISTILL_COST_BASE,
  DISTILL_COST_PER_QUALITY,
  DISTILL_FINE_PER_QUALITY,
  DISTILL_FOLLOWER_LOSS,
  DISTILL_LAWYER_PROTECTION,
  DISTILL_MIN_CAUGHT_CHANCE,
  DISTILL_QUALITY_TRANSFER,
  DISTILL_RESEARCH_ID,
  DISTILL_SPEED_MULT,
  DISTILL_TRANSPARENCY_RISK,
  LOBBY_RISK_REDUCTION,
} from './constants'
import type { Competitor, GameState } from './types'

export interface DistillTarget {
  modelId: string
  modelName: string
  icon: string
  typeId: string
  quality: number
  competitorId: string
  competitorName: string
  competitorIcon: string
  cost: number
}

export function isDistillUnlocked(researched: string[]): boolean {
  return researched.includes(DISTILL_RESEARCH_ID)
}

/** Querying a rival model at scale means paying for its API. Better models cost more. */
export function distillCost(teacherQuality: number): number {
  return Math.round(DISTILL_COST_BASE + teacherQuality * DISTILL_COST_PER_QUALITY)
}

/** Every rival model that has actually shipped by `week` can be used as a teacher. */
export function distillTargets(competitors: Competitor[], week: number): DistillTarget[] {
  const targets: DistillTarget[] = []
  for (const c of competitors) {
    for (const m of c.models) {
      if (m.releaseWeek > week) continue
      targets.push({
        modelId: m.id,
        modelName: m.name,
        icon: m.icon,
        typeId: m.typeId,
        quality: m.quality,
        competitorId: c.id,
        competitorName: c.name,
        competitorIcon: c.icon,
        cost: distillCost(m.quality),
      })
    }
  }
  return targets.sort((a, b) => b.quality - a.quality)
}

/**
 * Distillation closes part of the gap between what you could build alone and how
 * good the teacher is — it never drags a model below its own honest quality.
 */
export function distilledQuality(baseQuality: number, teacherQuality: number): number {
  const gap = teacherQuality - baseQuality
  if (gap <= 0) return baseQuality
  return baseQuality + gap * DISTILL_QUALITY_TRANSFER
}

/** Learning from a teacher's outputs is much faster than training from scratch. */
export function distillTrainWeeks(weeks: number): number {
  return Math.max(1, Math.ceil(weeks * DISTILL_SPEED_MULT))
}

/** Chance the rival notices when you ship a distilled model. Lawyers and lobbyists help. */
export function distillCaughtChance(state: GameState): number {
  const protection = state.staff
    .filter((s) => s.role === 'lawyer')
    .reduce((sum, s) => sum + DISTILL_LAWYER_PROTECTION * (0.5 + s.examScore / 200), 0)
  const transparency = state.activeRegulations.includes('ai-transparency-act') ? DISTILL_TRANSPARENCY_RISK : 0
  const lobbyMult = state.lobbyWeeksLeft > 0 ? LOBBY_RISK_REDUCTION : 1
  const chance = (DISTILL_CAUGHT_CHANCE + transparency - protection) * lobbyMult
  return Math.max(DISTILL_MIN_CAUGHT_CHANCE, Math.min(1, chance))
}

export function distillFine(teacherQuality: number): number {
  return Math.round(teacherQuality * DISTILL_FINE_PER_QUALITY)
}

export function distillFollowerLoss(followers: number): number {
  return Math.round(followers * DISTILL_FOLLOWER_LOSS)
}
