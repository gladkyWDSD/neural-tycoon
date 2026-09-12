/** Oblique solid faces, lit from the upper left, behind a front-facing sprite.
 * Integer scanlines keep the diagonals crisp at the game's pixel-art scale.
 * Call before drawing the front; depth extends right and up in art pixels.
 */
export function drawDepth(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number, height: number,
  depth: number, top: string, side: string, rim: string,
): void {
  const rise = Math.ceil(depth / 2)
  ctx.fillStyle = 'rgba(5,10,19,0.18)'
  for (let row = 0; row < rise + 5; row++) {
    ctx.fillRect(x + row * 2, y + height - rise + row, width + depth - row, 1)
  }
  // A full side wall with a sloping roofline and base.
  ctx.fillStyle = side
  for (let column = 0; column < depth; column++) {
    const lift = Math.ceil(column / 2)
    ctx.fillRect(x + width + column, y - lift, 1, height)
  }
  ctx.fillStyle = top
  for (let row = 1; row <= rise; row++) {
    ctx.fillRect(x + row * 2, y - row, width, 1)
  }
  ctx.fillStyle = rim
  ctx.fillRect(x + rise * 2, y - rise, width, 1)
  ctx.fillRect(x, y, width, 1)
  ctx.fillStyle = 'rgba(4,9,18,0.3)'
  ctx.fillRect(x + width, y + 1, 1, height - 1)
}
