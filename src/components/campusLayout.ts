// Where every building outside stands.
//
// This is the one source of truth for the field: the view draws from it, the
// click handler hit-tests against it, and the layout test asserts that no two
// footprints ever overlap. Nothing in here imports anything, so it can be
// checked without a canvas.

export const CAMPUS_COLS = 44
export const CAMPUS_ROWS = 22

/** The road runs along the bottom three rows. */
export const ROAD_ROW = CAMPUS_ROWS - 3
/** Everything with a door stands on this line, so the doors line up. */
export const GROUND_ROW = ROAD_ROW - 1

export const MAX_HALLS_SHOWN = 8
export const MAX_FABS_SHOWN = 3
export const MAX_DISHES_SHOWN = 5

export type Place = 'office' | 'lab' | 'hall' | 'fab' | 'dish' | 'sign' | 'tree'

export interface Footprint {
  kind: Place
  /** top-left tile */
  x: number
  y: number
  cols: number
  rows: number
  /** which hall/fab/dish this is, for the ones there can be several of */
  index: number
  leased: boolean
  /** what the hover tag says */
  label: string
}

export interface CampusInput {
  officeLevel: number
  datacenters: number
  rentedDatacenters: number
  fabs: number
  dataSources: number
}

/** The office stops growing on screen here, whatever a save claims. */
export const MAX_OFFICE_DRAWN = 4

export function officeLevelShown(level: number): number {
  return Math.max(1, Math.min(MAX_OFFICE_DRAWN, Math.floor(level)))
}

/** The office grows with the upgrades, and always sits on the ground line. */
export function officeSize(level: number): { cols: number; rows: number } {
  const l = officeLevelShown(level)
  return { cols: 8 + l * 2, rows: 4 + l }
}

export const OFFICE_X = 3
export const LAB = { x: 21, y: GROUND_ROW - 4, cols: 7, rows: 4 }
const HALL_COLS_AT = [30, 37]
const HALL_ROWS_AT = [1, 5, 9, 13]
const FAB_X = [13, 19, 25]
const FAB_Y = 6
const DISH_X = 1
const DISH_Y = [6, 8, 10, 12, 14]
export const SIGN = { x: 1, y: GROUND_ROW - 2 }

/** Trees go in the gaps the buildings can never reach. */
export const TREES: [number, number][] = [
  [19, 11],
  [24, 12],
  [28, 11],
  [29, 16],
  [19, 17],
  [31, 17],
  [36, 17],
  [42, 17],
]

/**
 * Every building on the field, in draw order (back to front).
 *
 * Slots are fixed: the second hall is always in the same place whether or not
 * you own a third, so the field does not rearrange itself under the pointer.
 */
export function campusLayout(input: CampusInput): Footprint[] {
  const out: Footprint[] = []

  const built = Math.max(0, Math.min(MAX_HALLS_SHOWN, Math.floor(input.datacenters)))
  const leased = Math.max(0, Math.min(MAX_HALLS_SHOWN - built, Math.floor(input.rentedDatacenters)))
  for (let i = 0; i < built + leased; i++) {
    out.push({
      kind: 'hall',
      x: HALL_COLS_AT[i % 2],
      y: HALL_ROWS_AT[Math.floor(i / 2)],
      cols: 6,
      rows: 3,
      index: i,
      leased: i >= built,
      label: i >= built ? 'Rented hall' : 'Datacenter',
    })
  }

  const fabs = Math.max(0, Math.min(MAX_FABS_SHOWN, Math.floor(input.fabs)))
  for (let i = 0; i < fabs; i++) {
    out.push({ kind: 'fab', x: FAB_X[i], y: FAB_Y, cols: 5, rows: 4, index: i, leased: false, label: 'Fab line' })
  }

  const dishes = Math.max(0, Math.min(MAX_DISHES_SHOWN, Math.floor(input.dataSources)))
  for (let i = 0; i < dishes; i++) {
    out.push({ kind: 'dish', x: DISH_X, y: DISH_Y[i], cols: 1, rows: 2, index: i, leased: false, label: 'Data feed' })
  }

  for (const [x, y] of TREES) {
    out.push({ kind: 'tree', x, y, cols: 2, rows: 2, index: 0, leased: false, label: '' })
  }

  const office = officeSize(input.officeLevel)
  out.push({
    kind: 'office',
    x: OFFICE_X,
    y: GROUND_ROW - office.rows,
    cols: office.cols,
    rows: office.rows,
    index: 0,
    leased: false,
    label: 'Office',
  })
  out.push({ kind: 'lab', ...LAB, index: 0, leased: false, label: 'Lab' })
  out.push({ kind: 'sign', ...SIGN, cols: 1, rows: 2, index: 0, leased: false, label: 'Go inside' })

  return out
}

/** Does a tile land on this building? */
export function hits(f: Footprint, tx: number, ty: number): boolean {
  return tx >= f.x && tx < f.x + f.cols && ty >= f.y && ty < f.y + f.rows
}

/**
 * The building under the pointer, or null. Doors first: the office is the
 * biggest thing on the field and must not swallow the sign in front of it.
 */
export function buildingAt(layout: Footprint[], tx: number, ty: number): Footprint | null {
  const order: Place[] = ['sign', 'hall', 'lab', 'fab', 'dish', 'office']
  for (const kind of order) {
    const found = layout.find((f) => f.kind === kind && hits(f, tx, ty))
    if (found) return found
  }
  return null
}
