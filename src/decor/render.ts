import { canvasToPng } from '../export/download'
import type { Decor } from './Decor'
import { petInfo, type PetName } from './pets'
import { drawCover, drawScene } from './scenes'

/** Sprite size in its own pixels, plus px: how big one of those is compared with the hand-drawn pets' pixels. */
function petSize(name: PetName) {
  const { sprite, px = 1 } = petInfo(name)
  return { w: sprite[0].length, h: sprite.length, px }
}

/** Draws a pet with scale canvas pixels per hand-drawn-pet pixel (detailed sprites come out proportionally finer). */
export function drawPet(ctx: CanvasRenderingContext2D, name: PetName, x: number, y: number, scale: number) {
  const { sprite, palette, px = 1 } = petInfo(name)
  const s = scale * px
  // Round each edge, so fractional pixel sizes still tile without gaps.
  const at = (o: number, i: number) => Math.round(o + i * s)
  sprite.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (!palette[ch]) return
      ctx.fillStyle = palette[ch]
      ctx.fillRect(at(x, i), at(y, j), at(x, i + 1) - at(x, i), at(y, j + 1) - at(y, j))
    }),
  )
}

/** Inline SVG markup for a pet (used inside the generated VS Code webview). */
export function petSvg(name: PetName, scale: number) {
  const { sprite, palette } = petInfo(name)
  const { w, h, px } = petSize(name)
  let rects = ''
  sprite.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (palette[ch]) rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${palette[ch]}"/>`
    }),
  )
  return `<svg width="${Math.round(w * scale * px)}" height="${Math.round(h * scale * px)}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`
}

/**
 * Renders the scene (in tones of `base`) at full size, optionally with the selected pets stamped in.
 * Returns null when there's nothing to draw.
 */
export function renderDecorCanvas(decor: Decor, base: string, opts: { width?: number; height?: number; bakePets?: boolean } = {}) {
  const { width = 1920, height = 1080, bakePets = true } = opts
  const hasScene = decor.scene !== 'none'
  const hasPets = bakePets && decor.pets.length > 0
  if (!hasScene && !hasPets) return null

  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = base
  ctx.fillRect(0, 0, width, height)
  if (hasScene) {
    drawCover(ctx, drawScene(decor.scene as Exclude<Decor['scene'], 'none'>, base))
  }
  if (hasPets) {
    const scale = Math.max(2, Math.round(decor.petScale * (width / 820)))
    const gap = 6 * scale
    const sizes = decor.pets.map(petSize).map((p) => ({ w: Math.round(p.w * p.px * scale), h: Math.round(p.h * p.px * scale) }))
    const total = sizes.reduce((s, p) => s + p.w, 0) + gap * (sizes.length - 1)
    const margin = Math.round(width * 0.03)
    let x = decor.petPosition === 'bottom-left' ? margin : width - margin - total
    const top = decor.petPosition === 'perched'
    decor.pets.forEach((p, i) => {
      const { w, h } = sizes[i]
      const y = top ? margin : height - margin - h
      drawPet(ctx, p, x, y, scale)
      x += w + gap
    })
  }
  return c
}

export async function renderDecorPng(decor: Decor, base: string, opts?: Parameters<typeof renderDecorCanvas>[2]) {
  const c = renderDecorCanvas(decor, base, opts)
  return c ? canvasToPng(c) : null
}

/** One transparent PNG per selected pet at 8× (for the AI prompt assets). */
export async function petPngs(decor: Decor) {
  const out: Record<string, Uint8Array> = {}
  for (const p of decor.pets) {
    const { w, h, px } = petSize(p)
    const c = document.createElement('canvas')
    c.width = w * 8
    c.height = h * 8
    drawPet(c.getContext('2d')!, p, 0, 0, 8 / px)
    out[`pet-${p.toLowerCase().replace(/\s+/g, '-')}.png`] = await canvasToPng(c)
  }
  return out
}
