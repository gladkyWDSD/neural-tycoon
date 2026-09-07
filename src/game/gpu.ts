import type { GameState } from './types'

export const GPU_CARD_COST = 5000
export const DATACENTER_COST = 100000
export const DATACENTER_CAPACITY = 10
export const DATACENTER_BUILD_WEEKS = 2
export const ELECTRICITY_PER_CARD_WEEK = 500
export const TRAIN_GPU_WEEKS = 24
export const RENT_WEEKLY_FEE = 10000
export const RENT_DISPUTE_CHANCE = 0.06
export const RAM_COST = 2000
export const SSD_COST = 3000

export function activeCards(state: GameState): number {
  return Math.min(state.gpuCards, (state.datacenters + state.rentedDatacenters) * DATACENTER_CAPACITY)
}

export function trainDuration(gpus: number, engineerCount: number, ram: number): number {
  const speed = Math.max(0.5, 0.5 + engineerCount * 0.5)
  const ramSpeed = 1 + ram * 0.05
  return Math.max(1, Math.ceil(TRAIN_GPU_WEEKS / (gpus * speed * ramSpeed)))
}

export function gpuQualityFactor(gpus: number): number {
  return 0.7 + Math.min(gpus, 12) * 0.05
}

export function ssdQualityBonus(ssd: number): number {
  return Math.min(10, ssd * 0.5)
}
