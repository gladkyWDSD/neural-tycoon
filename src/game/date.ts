import type { GameDate } from './types'
import { WEEKS_PER_YEAR } from './constants'

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function advanceWeek(date: GameDate): GameDate {
  if (date.week >= WEEKS_PER_YEAR) {
    return { year: date.year + 1, week: 1 }
  }
  return { year: date.year, week: date.week + 1 }
}

export function monthOf(date: GameDate): number {
  return Math.min(11, Math.floor((date.week - 1) / (WEEKS_PER_YEAR / 12)))
}

export function formatDate(date: GameDate): string {
  return `${MONTHS[monthOf(date)]} ${date.year}`
}

export function totalWeeksElapsed(date: GameDate, start: GameDate): number {
  return (date.year - start.year) * WEEKS_PER_YEAR + (date.week - start.week)
}
