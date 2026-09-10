import { px } from './officeArt'

// The President, drawn as chunky pixels in the same style as everything else in
// the office. Three moods, one canvas, no photographs: it is a caricature, the
// way a game draws a head of state.

export type Mood = 'happy' | 'annoyed' | 'furious'

export const PORTRAIT_W = 56
export const PORTRAIT_H = 64

const SKIN = { happy: '#e8a86a', annoyed: '#e0a065', furious: '#d98f52' }
const SKIN_DARK = { happy: '#c6884f', annoyed: '#bd7f49', furious: '#b46f3c' }
const SKIN_LIGHT = { happy: '#f5c48c', annoyed: '#eeb87f', furious: '#e5a76c' }

const HAIR = '#f2e2b4'
const HAIR_DARK = '#d6c188'
const HAIR_LIGHT = '#fdf3d6'
const SUIT = '#1c2438'
const SUIT_LIGHT = '#2b3550'
const SHIRT = '#f0f3fa'
const TIE = '#c1272d'
const TIE_DARK = '#8f1a1f'
const LINE = '#5a3a22'

function background(ctx: CanvasRenderingContext2D, mood: Mood) {
  // the flag on one side, the room on the other
  px(ctx, 0, 0, PORTRAIT_W, PORTRAIT_H, '#1a1c25')
  for (let i = 0; i < 7; i++) {
    px(ctx, 0, i * 6, 22, 6, i % 2 === 0 ? '#8e2231' : '#e8eaf2')
  }
  px(ctx, 0, 0, 12, 18, '#1f3160') // the canton
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      px(ctx, 2 + c * 4, 2 + r * 6, 1, 1, '#e8eaf2')
      px(ctx, 4 + c * 4, 5 + r * 6, 1, 1, '#e8eaf2')
    }
  }
  px(ctx, 22, 0, PORTRAIT_W - 22, PORTRAIT_H, '#3a3730') // panelled wall
  px(ctx, 22, 0, 2, PORTRAIT_H, '#4c4738')
  px(ctx, 40, 6, 12, 30, '#45412f')
  px(ctx, 41, 7, 10, 28, '#3a3730')
  if (mood === 'furious') {
    // the room goes hot when he is
    px(ctx, 22, 0, PORTRAIT_W - 22, PORTRAIT_H, '#43302c')
    px(ctx, 22, 0, 2, PORTRAIT_H, '#573a33')
  }
}

function shoulders(ctx: CanvasRenderingContext2D) {
  px(ctx, 2, 50, 52, 14, SUIT)
  px(ctx, 4, 50, 48, 2, SUIT_LIGHT)
  // collar and shirt
  px(ctx, 20, 48, 16, 8, SHIRT)
  px(ctx, 18, 48, 4, 8, SUIT)
  px(ctx, 34, 48, 4, 8, SUIT)
  px(ctx, 22, 48, 12, 2, '#d8dce8')
  // lapels
  px(ctx, 16, 50, 6, 14, SUIT_LIGHT)
  px(ctx, 34, 50, 6, 14, SUIT_LIGHT)
  px(ctx, 17, 51, 4, 12, SUIT)
  px(ctx, 35, 51, 4, 12, SUIT)
  // the tie
  px(ctx, 25, 50, 6, 4, TIE)
  px(ctx, 24, 54, 8, 10, TIE)
  px(ctx, 25, 55, 3, 8, '#d84a4f')
  px(ctx, 30, 54, 2, 10, TIE_DARK)
  // flag pin
  px(ctx, 42, 54, 4, 3, '#8e2231')
  px(ctx, 42, 54, 2, 2, '#1f3160')
}

// How far the face is inset on each row, so the head is a head and not a box.
function faceInset(row: number): number {
  if (row < 11) return 6
  if (row < 13) return 4
  if (row < 15) return 2
  if (row < 17) return 1
  if (row < 40) return 0
  if (row < 43) return 1
  if (row < 45) return 2
  if (row < 47) return 4
  return 7
}

const FACE_X = 13
const FACE_W = 30

function head(ctx: CanvasRenderingContext2D, mood: Mood) {
  const skin = SKIN[mood]
  const dark = SKIN_DARK[mood]
  const light = SKIN_LIGHT[mood]

  // ears first, so the face sits over them
  px(ctx, 11, 25, 3, 8, dark)
  px(ctx, 12, 26, 2, 5, skin)
  px(ctx, 42, 25, 3, 8, dark)
  px(ctx, 42, 26, 2, 5, skin)

  for (let row = 9; row < 49; row++) {
    const inset = faceInset(row)
    const x = FACE_X + inset
    const w = FACE_W - inset * 2
    if (w <= 0) continue
    px(ctx, x, row, w, 1, skin)
    px(ctx, x, row, 2, 1, dark) // shading down both sides
    px(ctx, x + w - 2, row, 2, 1, dark)
  }
  px(ctx, 18, 12, 20, 5, light) // light on the forehead
  px(ctx, 20, 41, 14, 4, light) // and the chin
  px(ctx, 16, 45, 24, 2, dark) // under the jaw

  // hair: pale, swept across the forehead and back over the ears
  for (let row = 2; row < 16; row++) {
    const inset = row < 4 ? 8 : row < 6 ? 5 : row < 8 ? 3 : 1
    px(ctx, FACE_X + inset - 2, row, FACE_W - inset * 2 + 4, 1, HAIR)
  }
  px(ctx, 17, 2, 22, 3, HAIR_LIGHT)
  px(ctx, 13, 6, 30, 2, HAIR_LIGHT)
  px(ctx, 10, 10, 5, 10, HAIR) // the sides, over the ears
  px(ctx, 41, 10, 5, 10, HAIR)
  px(ctx, 10, 14, 4, 6, HAIR_DARK)
  px(ctx, 42, 14, 4, 6, HAIR_DARK)
  px(ctx, 15, 13, 26, 3, HAIR_DARK) // the parting, sweeping right
  px(ctx, 15, 12, 12, 2, HAIR)
  px(ctx, 27, 11, 14, 2, HAIR_LIGHT)
  px(ctx, 16, 16, 8, 1, HAIR) // the fringe hanging over the brow
  px(ctx, 24, 15, 16, 1, HAIR)

  // eyes
  const eyeY = 24
  const browY = mood === 'happy' ? 20 : mood === 'annoyed' ? 21 : 21
  if (mood === 'furious') {
    px(ctx, 17, browY, 4, 2, '#a98c5c') // driven down towards the nose
    px(ctx, 21, browY + 1, 5, 2, LINE)
    px(ctx, 30, browY + 1, 5, 2, LINE)
    px(ctx, 35, browY, 4, 2, '#a98c5c')
  } else {
    px(ctx, 17, browY, 9, 2, '#c9b283')
    px(ctx, 30, browY, 9, 2, '#c9b283')
    if (mood === 'annoyed') {
      px(ctx, 17, browY + 1, 9, 1, '#a98c5c')
      px(ctx, 30, browY + 1, 9, 1, '#a98c5c')
    }
  }

  if (mood === 'happy') {
    // narrowed by the grin, but open: closed eyes read as asleep
    px(ctx, 18, eyeY, 8, 3, '#f6f2ea')
    px(ctx, 30, eyeY, 8, 3, '#f6f2ea')
    px(ctx, 20, eyeY, 4, 3, '#3c6ea5')
    px(ctx, 32, eyeY, 4, 3, '#3c6ea5')
    px(ctx, 21, eyeY + 1, 2, 2, '#101c2b')
    px(ctx, 33, eyeY + 1, 2, 2, '#101c2b')
    px(ctx, 18, eyeY - 1, 8, 1, LINE) // upper lid, pushed down
    px(ctx, 30, eyeY - 1, 8, 1, LINE)
    px(ctx, 19, eyeY + 3, 7, 1, dark) // cheek pushed up underneath
    px(ctx, 30, eyeY + 3, 7, 1, dark)
    px(ctx, 15, eyeY + 1, 2, 1, dark) // crow's feet
    px(ctx, 39, eyeY + 1, 2, 1, dark)
    px(ctx, 15, eyeY + 3, 3, 1, dark)
    px(ctx, 38, eyeY + 3, 3, 1, dark)
  } else {
    px(ctx, 18, eyeY - 1, 8, 5, '#f6f2ea')
    px(ctx, 30, eyeY - 1, 8, 5, '#f6f2ea')
    px(ctx, 20, eyeY, 4, 4, '#3c6ea5')
    px(ctx, 32, eyeY, 4, 4, '#3c6ea5')
    px(ctx, 21, eyeY + 1, 2, 2, '#101c2b')
    px(ctx, 33, eyeY + 1, 2, 2, '#101c2b')
    px(ctx, 18, eyeY - 1, 8, 1, LINE) // lids
    px(ctx, 30, eyeY - 1, 8, 1, LINE)
    if (mood === 'furious') {
      px(ctx, 18, eyeY, 8, 1, LINE) // pushed down to a glare
      px(ctx, 30, eyeY, 8, 1, LINE)
    }
  }
  px(ctx, 18, eyeY + 5, 6, 1, dark) // bags
  px(ctx, 32, eyeY + 5, 6, 1, dark)

  // nose
  px(ctx, 26, 28, 4, 9, skin)
  px(ctx, 26, 28, 1, 9, light)
  px(ctx, 24, 35, 8, 2, dark)
  px(ctx, 25, 36, 1, 1, LINE)
  px(ctx, 30, 36, 1, 1, LINE)

  // mouth
  if (mood === 'happy') {
    // an arc, drawn corner by corner so it curves up at the ends
    px(ctx, 19, 38, 2, 2, dark) // corners, high
    px(ctx, 35, 38, 2, 2, dark)
    px(ctx, 21, 39, 2, 1, LINE)
    px(ctx, 23, 40, 10, 1, LINE)
    px(ctx, 33, 39, 2, 1, LINE)
    px(ctx, 22, 40, 2, 2, '#f8f5ee') // teeth, following the same curve
    px(ctx, 24, 41, 8, 2, '#f8f5ee')
    px(ctx, 32, 40, 2, 2, '#f8f5ee')
    px(ctx, 24, 42, 8, 1, '#dcd6c8')
    px(ctx, 23, 42, 2, 1, LINE) // lower lip, curving back up
    px(ctx, 25, 43, 6, 1, LINE)
    px(ctx, 31, 42, 2, 1, LINE)
    px(ctx, 17, 36, 2, 5, dark) // smile lines
    px(ctx, 37, 36, 2, 5, dark)
  } else if (mood === 'annoyed') {
    px(ctx, 22, 41, 12, 2, LINE)
    px(ctx, 21, 40, 2, 2, dark)
    px(ctx, 33, 40, 2, 2, dark)
    px(ctx, 24, 43, 8, 1, dark)
  } else {
    px(ctx, 22, 40, 3, 2, dark) // pursed, corners driven down
    px(ctx, 31, 40, 3, 2, dark)
    px(ctx, 23, 41, 10, 3, LINE)
    px(ctx, 24, 44, 8, 1, dark)
    px(ctx, 25, 38, 6, 1, dark)
    px(ctx, 18, 36, 2, 8, dark) // deep lines either side
    px(ctx, 36, 36, 2, 8, dark)
  }

  if (mood === 'furious') {
    px(ctx, 15, 33, 6, 5, '#c96a4a') // colour up in the cheeks
    px(ctx, 35, 33, 6, 5, '#c96a4a')
  }
}

/** A raised finger, for the moods that come with one. */
function pointingHand(ctx: CanvasRenderingContext2D, mood: Mood) {
  const x = 41
  const y = 50
  const skin = SKIN[mood]
  const light = SKIN_LIGHT[mood]
  const dark = SKIN_DARK[mood]
  px(ctx, x, y + 6, 14, 8, SUIT_LIGHT) // cuff and sleeve
  px(ctx, x + 1, y + 7, 12, 6, SUIT)
  px(ctx, x + 1, y + 5, 10, 2, '#e8ecf6') // shirt cuff
  px(ctx, x, y - 1, 10, 7, dark) // the fist, outlined
  px(ctx, x + 1, y, 8, 5, skin)
  px(ctx, x + 2, y + 1, 6, 1, light)
  // folded fingers, so it is a pointing hand and not a thumbs up
  px(ctx, x + 2, y + 2, 6, 1, dark)
  px(ctx, x + 2, y + 4, 6, 1, dark)
  px(ctx, x + 4, y - 8, 4, 8, dark) // the index finger, straight up from the top
  px(ctx, x + 5, y - 7, 2, 7, skin)
  px(ctx, x + 5, y - 8, 2, 2, light)
}

export function drawPresident(ctx: CanvasRenderingContext2D, mood: Mood) {
  background(ctx, mood)
  shoulders(ctx)
  head(ctx, mood)
  if (mood !== 'happy') pointingHand(ctx, mood)
  // a hard frame, so the portrait reads as a picture on a call
  px(ctx, 0, 0, PORTRAIT_W, 1, '#0b0c11')
  px(ctx, 0, PORTRAIT_H - 1, PORTRAIT_W, 1, '#0b0c11')
  px(ctx, 0, 0, 1, PORTRAIT_H, '#0b0c11')
  px(ctx, PORTRAIT_W - 1, 0, 1, PORTRAIT_H, '#0b0c11')
}
