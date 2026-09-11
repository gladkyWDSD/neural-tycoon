import type { GameState } from './types'
import { CURATION_MAX, CURATION_PER_HEAD } from './constants'

/**
 * Where a lab's training data comes from. A source is bought once and then
 * costs money every week it runs, and what it produces is a stock you draw
 * down when you train. Better sources produce more and cleaner.
 */
export interface DataSource {
  id: string
  name: string
  description: string
  /** what it costs to set up, and to keep running every week */
  cost: number
  upkeep: number
  /** terabytes a week, before curation */
  yield: number
  /** how much it lifts the quality of anything trained on it */
  quality: number
}

export const DATA_SOURCES: DataSource[] = [
  {
    id: 'scraped',
    name: 'Web crawler',
    description: 'Free, filthy, and endless. Everyone starts here.',
    cost: 0,
    upkeep: 2_000,
    yield: 8,
    quality: 0,
  },
  {
    id: 'public',
    name: 'Public datasets',
    description: 'Curated corpora anyone can download, if you do the work.',
    cost: 60_000,
    upkeep: 6_000,
    yield: 12,
    quality: 5,
  },
  {
    id: 'licensed',
    name: 'Licensed archives',
    description: 'Newspapers, journals and back catalogues, paid for properly.',
    cost: 400_000,
    upkeep: 30_000,
    yield: 17,
    quality: 12,
  },
  {
    id: 'human',
    name: 'Human annotators',
    description: 'People writing and rating answers. Slow, expensive, the best there is.',
    cost: 1_200_000,
    upkeep: 90_000,
    yield: 9,
    quality: 22,
  },
  {
    id: 'synthetic',
    name: 'Synthetic pipeline',
    description: 'Your own models generating and filtering their own training data.',
    cost: 2_500_000,
    upkeep: 60_000,
    yield: 34,
    quality: 9,
  },
]

export const DATA_SOURCE_MAP: Record<string, DataSource> = Object.fromEntries(
  DATA_SOURCES.map((d) => [d.id, d]),
)

/** People put on curation clean the pipeline faster than it fills. */
export function curationFactor(state: GameState): number {
  const heads = state.staff.filter((s) => s.assignment === 'data').length
  return Math.min(CURATION_MAX, 1 + heads * CURATION_PER_HEAD)
}

/** Terabytes a week, after the people on it. */
export function dataInflow(state: GameState): number {
  const raw = state.dataSources.reduce((sum, id) => sum + (DATA_SOURCE_MAP[id]?.yield ?? 0), 0)
  return raw * curationFactor(state)
}

/** What the sources you run cost you every week. */
export function dataUpkeep(state: GameState): number {
  return state.dataSources.reduce((sum, id) => sum + (DATA_SOURCE_MAP[id]?.upkeep ?? 0), 0)
}

/**
 * How good the pile is. Sources average out by what they produce, so a big
 * dirty crawler drags down a small clean archive unless you keep feeding it.
 */
export function dataQualityOf(sources: string[]): number {
  let weight = 0
  let total = 0
  for (const id of sources) {
    const src = DATA_SOURCE_MAP[id]
    if (!src) continue
    weight += src.yield
    total += src.yield * src.quality
  }
  return weight > 0 ? total / weight : 0
}
