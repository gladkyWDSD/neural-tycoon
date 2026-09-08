import type { Nationality, Role, Staff } from './types'
import { MAX_SCORE, NATIONALITIES } from './constants'

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
  }
}

const ROLE_SALARY_BASE: Record<Role, number> = {
  researcher: 3000,
  engineer: 2750,
  marketer: 2000,
  lawyer: 2500,
}

function salaryFor(role: Role, score: number): number {
  const base = ROLE_SALARY_BASE[role]
  // higher score = higher weekly salary demand
  return Math.round(base * (0.7 + (score / MAX_SCORE) * 0.8) / 100) * 100
}

const SALARY_INFLATION_PER_WEEK = 0.008 // rival offers creep up ~0.8%/wk; a fixed salary falls behind over time

// what a rival would offer this staff member today — salaries are locked in at hire time,
// so the longer someone goes without a raise, the further behind the market they fall
export function marketSalaryFor(role: Role, score: number, week: number): number {
  return Math.round(salaryFor(role, score) * (1 + Math.max(0, week) * SALARY_INFLATION_PER_WEEK))
}

export function generateCandidate(nationality: Nationality, role: Role, minScore: number, maxScore: number): Staff {
  const bias = roleBias(nationality, role)
  const raw = rand(minScore, maxScore)
  const score = Math.min(MAX_SCORE, Math.max(0, raw + bias))
  const name = `${pick(FIRST_NAMES[nationality])} ${pick(LAST_NAMES[nationality])}`
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    nationality,
    role,
    examScore: score,
    salary: salaryFor(role, score),
  }
}
