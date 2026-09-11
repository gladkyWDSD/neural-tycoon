import type { Nationality, Role, Staff } from './types'
import { STARTING_MORALE, rollTraits } from './people'
import {
  MAX_SCORE,
  MAX_STAFF_LEVEL,
  NATIONALITIES,
  STAFF_TRAINING_BASE_COST,
  STAFF_TRAINING_BASE_WEEKS,
} from './constants'

const FIRST_NAMES: Record<Nationality, string[]> = {
  china: ['Wei', 'Li', 'Zhang', 'Chen', 'Yan', 'Hao', 'Mei', 'Jing', 'Tao', 'Lin'],
  europe: ['Lukas', 'Anna', 'Marek', 'Sofia', 'Hans', 'Elena', 'Pierre', 'Ingrid', 'Viktor', 'Clara'],
  usa: ['James', 'Emily', 'Michael', 'Sarah', 'David', 'Jessica', 'Chris', 'Amanda', 'Ryan', 'Lauren'],
}

const LAST_NAMES: Record<Nationality, string[]> = {
  china: ['Wang', 'Li', 'Zhao', 'Liu', 'Sun', 'Xu', 'Wu', 'Zhou', 'Huang', 'Feng'],
  europe: ['Novak', 'Muller', 'Schmidt', 'Rossi', 'Dubois', 'Kowalski', 'Jansen', 'Weber', 'Costa', 'Nilsen'],
  usa: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor'],
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)]
}

function roleBias(nationality: Nationality, role: Role): number {
  const info = NATIONALITIES[nationality]
  switch (role) {
    case 'researcher':
      return info.mathBias
    case 'engineer':
      return info.codingBias
    case 'marketer':
      return info.marketingBias
    case 'lawyer':
      return info.legalBias
    case 'hardware':
      // chip people come out of the same pool as the coders
      return info.codingBias
  }
}

const ROLE_SALARY_BASE: Record<Role, number> = {
  researcher: 3000,
  engineer: 2750,
  marketer: 2000,
  lawyer: 2500,
  hardware: 3400,
}

function salaryFor(role: Role, score: number): number {
  const base = ROLE_SALARY_BASE[role]
  // higher score = higher weekly salary demand
  return Math.round(base * (0.7 + (score / MAX_SCORE) * 0.8) / 100) * 100
}

const SALARY_INFLATION_PER_WEEK = 0.008 // rival offers creep up ~0.8%/wk; a fixed salary falls behind over time

// what a rival would offer this staff member today — salaries are locked in at hire time,
// so the longer someone goes without a raise, the further behind the market they fall
/**
 * What this person is actually worth to the company: their exam score, multiplied
 * by their level. This is the number every other system should use — the raw exam
 * score is only the level-1 starting point.
 */
export function staffPower(s: { examScore: number; level: number }): number {
  return s.examScore * s.level
}

/** Money to go from `level` to the next one. Each level costs more than the last. */
export function trainingCostFor(level: number): number {
  return STAFF_TRAINING_BASE_COST * level
}

/** Weeks the course takes. Higher levels take longer. */
export function trainingWeeksFor(level: number): number {
  return STAFF_TRAINING_BASE_WEEKS + level - 1
}

export function canTrain(s: Staff): boolean {
  return s.level < MAX_STAFF_LEVEL
}

export function marketSalaryFor(role: Role, score: number, week: number): number {
  return Math.round(salaryFor(role, score) * (1 + Math.max(0, week) * SALARY_INFLATION_PER_WEEK))
}

// Two people generated in the same millisecond used to be able to share an id.
// Staff are looked up and removed by id, so a duplicate meant firing one person
// removed everyone who shared it. A counter makes every id unique for the session.
let idSeq = 0

function newStaffId(): string {
  idSeq += 1
  return `${Date.now().toString(36)}-${idSeq.toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Where a new hire starts: doing the obvious thing for their role. */
export function defaultAssignment(role: Role): Staff['assignment'] {
  if (role === 'researcher') return 'research'
  if (role === 'engineer') return 'training'
  if (role === 'marketer') return 'data'
  if (role === 'hardware') return 'chips'
  return 'ops'
}

export function generateCandidate(
  nationality: Nationality,
  role: Role,
  minScore: number,
  maxScore: number,
  week = 0,
): Staff {
  const bias = roleBias(nationality, role)
  const raw = rand(minScore, maxScore)
  const score = Math.min(MAX_SCORE, Math.max(0, raw + bias))
  const name = `${pick(FIRST_NAMES[nationality])} ${pick(LAST_NAMES[nationality])}`
  return {
    id: newStaffId(),
    name,
    nationality,
    assignment: defaultAssignment(role),
    role,
    examScore: score,
    level: 1,
    salary: salaryFor(role, score),
    traits: rollTraits(),
    // people arrive keen, and a little unsure
    morale: STARTING_MORALE + rand(-6, 6),
    unhappyWeeks: 0,
    noticeWeeks: null,
    lastAskWeek: week,
    joinedWeek: week,
  }
}
