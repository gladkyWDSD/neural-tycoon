// Things you put in the office. Each one costs money once, changes a number
// somewhere in the simulation, and shows up as furniture along the back of the
// room, so the place you look at all game finally reflects what you have spent.

export interface Amenity {
  id: string
  name: string
  cost: number
  /** the one line shown on the buy button's row */
  effect: string
  blurb: string
}

export const AMENITIES: Amenity[] = [
  {
    id: 'coffee',
    name: 'Coffee bar',
    cost: 180_000,
    effect: '+3 quality on every model you train',
    blurb: 'A proper machine and someone who knows how to use it. Sharper people, better models.',
  },
  {
    id: 'meeting',
    name: 'Meeting room',
    cost: 450_000,
    effect: 'Research finishes 20% sooner',
    blurb: 'Somewhere to argue at a whiteboard instead of over a desk. Ideas land faster.',
  },
  {
    id: 'gym',
    name: 'Gym',
    cost: 900_000,
    effect: 'Rivals poach your staff 40% less often',
    blurb: 'People who like coming in are harder to tempt away.',
  },
  {
    id: 'cooling',
    name: 'Cooling loop',
    cost: 1_400_000,
    effect: '25% off the electricity bill',
    blurb: 'Liquid cooling for the racks. The cards run cooler and the meter runs slower.',
  },
  {
    id: 'academy',
    name: 'Training room',
    cost: 2_500_000,
    effect: 'Staff courses finish 25% sooner',
    blurb: 'A room set aside for teaching, so levelling somebody up stops taking a season.',
  },
]

export const AMENITY_MAP: Record<string, Amenity> = Object.fromEntries(
  AMENITIES.map((a) => [a.id, a]),
)

const has = (owned: string[], id: string) => owned.includes(id)

/** Flat quality added to every model, the way a book does. */
export function amenityQualityBonus(owned: string[]): number {
  return has(owned, 'coffee') ? 3 : 0
}

/** Multiplier on how long a research item takes. */
export function amenityResearchSpeed(owned: string[]): number {
  return has(owned, 'meeting') ? 0.8 : 1
}

/** Multiplier on how long a staff course takes. */
export function amenityTrainingSpeed(owned: string[]): number {
  return has(owned, 'academy') ? 0.75 : 1
}

/** Multiplier on the weekly electricity bill. */
export function amenityElectricityMultiplier(owned: string[]): number {
  return has(owned, 'cooling') ? 0.75 : 1
}

/** How much of the rivals' poaching pressure the office absorbs, 0 to 1. */
export function amenityRetention(owned: string[]): number {
  return has(owned, 'gym') ? 0.4 : 0
}
