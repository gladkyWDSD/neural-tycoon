/** Painted depth for the 2D canvas. All objects share an upper-left key light. */
export function drawContactShadow(
  ctx: CanvasRenderingContext2D, x: number, y: number, width: number, depth: number,
): void {
  ctx.save()
  ctx.translate(x + width / 2, y)
  ctx.scale(width / 2 + depth, depth)
  const shadow = ctx.createRadialGradient(0, 0, 0.15, 0, 0, 1)
  shadow.addColorStop(0, 'rgba(3,8,17,0.48)')
  shadow.addColorStop(0.5, 'rgba(3,8,17,0.24)')
  shadow.addColorStop(1, 'rgba(3,8,17,0)')
  ctx.fillStyle = shadow
  ctx.fillRect(-1, -1, 2, 2)
  ctx.restore()
}

/** Draw behind a front-facing sprite; the shallow extrusion goes right/up. */
export function drawDepth(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number, height: number,
  depth: number, top: string, side: string, rim: string,
): void {
  const rise = depth / 2
  ctx.save()
  drawContactShadow(ctx, x, y + height, width + depth, Math.max(4, depth * 0.7))
  const cast = ctx.createLinearGradient(x, y + height, x, y + height + depth)
  cast.addColorStop(0, 'rgba(3,8,17,0.25)')
  cast.addColorStop(1, 'rgba(3,8,17,0)')
  ctx.fillStyle = cast
  ctx.beginPath()
  ctx.moveTo(x, y + height)
  ctx.lineTo(x + width + depth, y + height - rise)
  ctx.lineTo(x + width + depth * 2, y + height + rise)
  ctx.lineTo(x + depth, y + height + depth)
  ctx.closePath()
  ctx.fill()
  const sideLight = ctx.createLinearGradient(x + width, y, x + width + depth, y + height)
  sideLight.addColorStop(0, side)
  sideLight.addColorStop(1, '#101a28')
  ctx.fillStyle = sideLight
  ctx.beginPath()
  ctx.moveTo(x + width, y)
  ctx.lineTo(x + width + depth, y - rise)
  ctx.lineTo(x + width + depth, y + height - rise)
  ctx.lineTo(x + width, y + height)
  ctx.closePath()
  ctx.fill()
  const roofLight = ctx.createLinearGradient(x, y - rise, x + width, y)
  roofLight.addColorStop(0, rim)
  roofLight.addColorStop(0.3, top)
  roofLight.addColorStop(1, side)
  ctx.fillStyle = roofLight
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + depth, y - rise)
  ctx.lineTo(x + width + depth, y - rise)
  ctx.lineTo(x + width, y)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = rim
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x + 0.5, y)
  ctx.lineTo(x + depth, y - rise + 0.5)
  ctx.lineTo(x + width + depth, y - rise + 0.5)
  ctx.stroke()
  ctx.fillStyle = 'rgba(3,8,17,0.36)'
  ctx.fillRect(x + width, y + 1, 1, height - 1)
  ctx.restore()
}

/** Broad material shading over existing details, confined to the front face. */
export function drawSurfaceLight(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  material: 'matte' | 'metal' | 'glass' = 'matte',
): void {
  ctx.save()
  const light = ctx.createLinearGradient(x, y, x + w, y + h * 0.35)
  light.addColorStop(0, 'rgba(220,239,255,0.18)')
  light.addColorStop(0.28, 'rgba(220,239,255,0.06)')
  light.addColorStop(0.65, 'rgba(8,17,32,0.06)')
  light.addColorStop(1, 'rgba(4,10,24,0.32)')
  ctx.fillStyle = light
  ctx.fillRect(x, y, w, h)
  const base = ctx.createLinearGradient(x, y + h * 0.65, x, y + h)
  base.addColorStop(0, 'rgba(3,8,17,0)')
  base.addColorStop(1, 'rgba(3,8,17,0.2)')
  ctx.fillStyle = base
  ctx.fillRect(x, y + h * 0.65, w, h * 0.35)
  if (material !== 'matte') {
    const sheen = ctx.createLinearGradient(x, y, x + w, y + h * 0.15)
    sheen.addColorStop(0, 'rgba(210,239,255,0)')
    sheen.addColorStop(0.16, 'rgba(210,239,255,0.03)')
    sheen.addColorStop(0.22, `rgba(210,239,255,${material === 'glass' ? 0.28 : 0.12})`)
    sheen.addColorStop(0.34, 'rgba(210,239,255,0.02)')
    sheen.addColorStop(1, 'rgba(210,239,255,0)')
    ctx.fillStyle = sheen
    ctx.fillRect(x, y, w, h)
  }
  ctx.fillStyle = 'rgba(220,239,255,0.23)'
  ctx.fillRect(x, y, w, 1)
  ctx.fillRect(x, y, 1, h)
  ctx.restore()
}

/** Light the floor before props, with wall contact shade and a daylight pool. */
export function drawRoomLight(ctx: CanvasRenderingContext2D, w: number, h: number, wall: number): void {
  ctx.save()
  const light = ctx.createRadialGradient(w * 0.25, h * 0.2, 0, w * 0.25, h * 0.2, w * 0.8)
  light.addColorStop(0, 'rgba(155,199,225,0.12)')
  light.addColorStop(0.65, 'rgba(19,32,52,0)')
  light.addColorStop(1, 'rgba(3,8,18,0.23)')
  ctx.fillStyle = light
  ctx.fillRect(wall, wall, w - wall * 2, h - wall * 2)
  const shade = ctx.createLinearGradient(0, wall, 0, wall * 2.3)
  shade.addColorStop(0, 'rgba(3,8,17,0.38)')
  shade.addColorStop(1, 'rgba(3,8,17,0)')
  ctx.fillStyle = shade
  ctx.fillRect(wall, wall, w - wall * 2, wall * 1.3)
  ctx.restore()
}
