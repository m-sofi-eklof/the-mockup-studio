import { GifWriter } from 'omggif'
import type { Decor } from './Decor'
import { layoutRow, motionFrames, petDims, rowWidth } from './motion'
import { renderDecorCanvas } from './render'

type Box = { x0: number; y0: number; x1: number; y1: number }

const union = (a: Box, b: Box): Box => ({
  x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1),
})

/**
 * Animated GIF background: the scene once, plus the pets moving like the app preview.
 * Only the strip around the pets is re-encoded per frame (GIF sub-frames), which keeps the file small.
 * Returns null if there are no pets or no animation (a PNG is enough then).
 */
export function renderDecorGif(decor: Decor, base: string, width = 1920, height = 1080): Uint8Array | null {
  if (!decor.pets.length || decor.petAnim === 'none') return null

  const bg = renderDecorCanvas(decor, base, { width, height, bakePets: false })!

  const scale = Math.max(2, Math.round(decor.petScale * (width / 820)))
  const margin = Math.round(width * 0.03)
  const rowW = rowWidth(decor.pets)
  const maxH = Math.max(...decor.pets.map((p) => petDims(p).h))
  const travel = Math.max(0, Math.floor((width - 2 * margin) / scale) - rowW)
  const frames = motionFrames(decor.petAnim, travel, { walkStep: 2, walkDelay: 80 })

  const originX =
    decor.petAnim === 'walk' ? margin : decor.petPosition === 'bottom-left' ? margin : width - margin - rowW * scale
  const top = decor.petPosition === 'perched'
  // baseline (bottom of pets) in sprite px from originY
  const originY = top ? margin + (maxH + 6) * scale : height - margin
  const baselinePx = 0

  // Draw each frame on a full-size canvas, track the dirty box.
  const work = document.createElement('canvas')
  work.width = width
  work.height = height
  const ctx = work.getContext('2d')!

  const drawFrame = (fi: number): Box => {
    const items = layoutRow(decor.pets, frames[fi], baselinePx)
    let box: Box | null = null
    for (const it of items) {
      const x0 = originX + it.x * scale
      const y0 = originY + it.y * scale
      it.grid.forEach((row, gy) =>
        row.forEach((c, gx) => {
          if (!c) return
          ctx.fillStyle = c
          ctx.fillRect(x0 + gx * scale, y0 + gy * scale, scale, scale)
        }),
      )
      const b = { x0, y0, x1: x0 + (it.grid[0]?.length ?? 0) * scale, y1: y0 + it.grid.length * scale }
      box = box ? union(box, b) : b
    }
    return box!
  }

  // Palette: every color that can appear (scene + pets). Pixel art -> few exact colors.
  const colorIndex = new Map<number, number>()
  const palette: number[] = []
  const indexOf = (rgb: number) => {
    let i = colorIndex.get(rgb)
    if (i === undefined) {
      if (palette.length >= 256) return nearest(rgb)
      i = palette.length
      palette.push(rgb)
      colorIndex.set(rgb, i)
    }
    return i
  }
  const nearest = (rgb: number) => {
    let best = 0
    let bd = Infinity
    palette.forEach((p, i) => {
      const d = ((p >> 16) - (rgb >> 16)) ** 2 + (((p >> 8) & 255) - ((rgb >> 8) & 255)) ** 2 + ((p & 255) - (rgb & 255)) ** 2
      if (d < bd) {
        bd = d
        best = i
      }
    })
    colorIndex.set(rgb, best)
    return best
  }
  const indexed = (b: Box) => {
    const w = b.x1 - b.x0
    const h = b.y1 - b.y0
    const data = ctx.getImageData(b.x0, b.y0, w, h).data
    const out = new Uint8Array(w * h)
    for (let i = 0, p = 0; i < out.length; i++, p += 4) out[i] = indexOf((data[p] << 16) | (data[p + 1] << 8) | data[p + 2])
    return out
  }
  // Pre-register pet colors so they keep exact palette slots.
  for (const p of decor.pets) for (const row of layoutRow([p], frames[0], 0)[0].grid) for (const c of row) if (c) indexOf(parseInt(c.slice(1, 7), 16))

  const clamp = (b: Box): Box => ({
    x0: Math.max(0, Math.floor(b.x0)), y0: Math.max(0, Math.floor(b.y0)),
    x1: Math.min(width, Math.ceil(b.x1)), y1: Math.min(height, Math.ceil(b.y1)),
  })

  type Out = { box: Box; pixels: Uint8Array; delay: number }
  const outFrames: Out[] = []
  let prev: Box | null = null
  frames.forEach((f, fi) => {
    ctx.drawImage(bg, 0, 0)
    const cur = drawFrame(fi)
    const box = fi === 0 ? { x0: 0, y0: 0, x1: width, y1: height } : clamp(union(prev!, cur))
    outFrames.push({ box, pixels: indexed(box), delay: Math.max(2, Math.round(f.delay / 10)) })
    prev = cur
  })

  // GIF palettes must be a power of two in length.
  let size = 2
  while (size < palette.length) size *= 2
  const gp = [...palette, ...new Array(size - palette.length).fill(0)]

  const raw = outFrames.reduce((s, f) => s + f.pixels.length, 0)
  const buf = new Uint8Array(raw * 2 + 1024 * 1024)
  const gw = new GifWriter(buf, width, height, { palette: gp, loop: 0 })
  for (const f of outFrames) {
    gw.addFrame(f.box.x0, f.box.y0, f.box.x1 - f.box.x0, f.box.y1 - f.box.y0, f.pixels as unknown as number[], { delay: f.delay, disposal: 1 })
  }
  return buf.slice(0, gw.end())
}
