import { canvasToPng } from '../export/download'
import type { Decor } from './Decor'
import { PETS, type PetName } from './pets'
import { drawCover, drawScene } from './scenes'

function petSize(name: PetName) {
  const { sprite } = PETS[name]
  return { w: sprite[0].length, h: sprite.length }
}

export function drawPet(ctx: CanvasRenderingContext2D, name: PetName, x: number, y: number, scale: number) {
  const { sprite, palette } = PETS[name]
  const pal = palette as Record<string, string>
  sprite.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (!pal[ch]) return
      ctx.fillStyle = pal[ch]
      ctx.fillRect(x + i * scale, y + j * scale, scale, scale)
    }),
  )
}

/** Inline SVG markup for a pet (used inside the generated VS Code webview). */
export function petSvg(name: PetName, scale: number) {
  const { sprite, palette } = PETS[name]
  const pal = palette as Record<string, string>
  const { w, h } = petSize(name)
  let rects = ''
  sprite.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (pal[ch]) rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${pal[ch]}"/>`
    }),
  )
  return `<svg width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`
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
    const sizes = decor.pets.map(petSize)
    const total = sizes.reduce((s, p) => s + p.w * scale, 0) + gap * (sizes.length - 1)
    const margin = Math.round(width * 0.03)
    let x = decor.petPosition === 'bottom-left' ? margin : width - margin - total
    const top = decor.petPosition === 'perched'
    decor.pets.forEach((p, i) => {
      const { w, h } = sizes[i]
      const y = top ? margin : height - margin - h * scale
      drawPet(ctx, p, x, y, scale)
      x += w * scale + gap
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
    const { w, h } = petSize(p)
    const c = document.createElement('canvas')
    c.width = w * 8
    c.height = h * 8
    drawPet(c.getContext('2d')!, p, 0, 0, 8)
    out[`pet-${p.toLowerCase().replace(/\s+/g, '-')}.png`] = await canvasToPng(c)
  }
  return out
}
