// Shared pet animation, in sprite-pixel units. Mirrors the CSS animations in index.css so the
// animated GIF background and the terminal greeting move the same way as the app preview.
import type { Decor } from './Decor'
import { petInfo, type PetName } from './pets'

export type MotionFrame = {
  /** horizontal offset of the whole pet row (walk) */
  dx: number
  /** vertical offset per pet (negative = up) */
  dy: number
  /** vertical squash factor (hop) */
  sy: number
  /** pets face the other way (walk back) */
  flip: boolean
  delay: number
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function hopAt(t: number) {
  // keyframes: 0% rest, 10% squash, 30% top of jump, 60%+ rest
  const k: [number, number, number][] = [
    [0, 0, 1],
    [0.1, 0, 0.85],
    [0.3, -4, 1.05],
    [0.6, 0, 1],
    [1, 0, 1],
  ]
  for (let i = 0; i < k.length - 1; i++) {
    const [t0, y0, s0] = k[i]
    const [t1, y1, s1] = k[i + 1]
    if (t >= t0 && t <= t1) {
      const u = (t - t0) / (t1 - t0)
      return { dy: Math.round(lerp(y0, y1, u)), sy: lerp(s0, s1, u) }
    }
  }
  return { dy: 0, sy: 1 }
}

/** Frames for one loop of the animation. `travel` = how far (sprite px) the walk goes before turning. */
export function motionFrames(anim: Decor['petAnim'], travel: number, opts: { walkStep?: number; walkDelay?: number } = {}): MotionFrame[] {
  const base = { dx: 0, dy: 0, sy: 1, flip: false }
  switch (anim) {
    case 'bob':
      return [
        { ...base, delay: 500 },
        { ...base, dy: -1, delay: 500 },
      ]
    case 'hop': {
      const out: MotionFrame[] = []
      for (let i = 0; i < 14; i++) out.push({ ...base, ...hopAt(i / 14), delay: 100 })
      return out
    }
    case 'walk': {
      const step = opts.walkStep ?? 2
      const delay = opts.walkDelay ?? 80
      const out: MotionFrame[] = []
      const n = Math.max(1, Math.floor(travel / step))
      // walking right: sprites mirrored (they're drawn facing left-ish), like the CSS scaleX(-1)
      for (let i = 0; i <= n; i++) out.push({ dx: i * step, dy: i % 2 ? -1 : 0, sy: 1, flip: true, delay })
      for (let i = n; i >= 0; i--) out.push({ dx: i * step, dy: i % 2 ? -1 : 0, sy: 1, flip: false, delay })
      return out
    }
    default:
      return [{ ...base, delay: 1000 }]
  }
}

export type PixelGrid = (string | null)[][]

/**
 * A pet as a grid of colors (null = transparent), optionally mirrored and squashed (anchored at the bottom).
 * The grid is in the hand-drawn pets' pixel size, so detailed sprites (px < 1) are sampled down to match.
 */
export function petGrid(name: PetName, flip = false, sy = 1): PixelGrid {
  const { sprite, palette } = petInfo(name)
  const w = sprite[0].length
  const h = sprite.length
  const { w: outW, h: fullH } = petDims(name)
  const outH = Math.max(1, Math.round(fullH * sy))
  const grid: PixelGrid = []
  for (let y = 0; y < outH; y++) {
    const srcY = Math.min(h - 1, Math.floor((y / outH) * h))
    const row: (string | null)[] = []
    for (let x = 0; x < outW; x++) {
      const srcX = Math.min(w - 1, Math.floor((x / outW) * w))
      const ch = sprite[srcY][flip ? w - 1 - srcX : srcX]
      row.push(palette[ch] ?? null)
    }
    grid.push(row)
  }
  return grid
}

export function petDims(name: PetName) {
  const { sprite, px = 1 } = petInfo(name)
  return { w: Math.max(1, Math.round(sprite[0].length * px)), h: Math.max(1, Math.round(sprite.length * px)) }
}

export const PET_GAP = 6

/** Width of the pet row in sprite px. */
export function rowWidth(pets: PetName[]) {
  return pets.reduce((s, p) => s + petDims(p).w, 0) + PET_GAP * Math.max(0, pets.length - 1)
}

/** Lays out the whole row for one frame: returns each pet's grid and its top-left (sprite px, relative to row origin / baseline). */
export function layoutRow(pets: PetName[], f: MotionFrame, baseline: number) {
  let x = f.dx
  return pets.map((p) => {
    const g = petGrid(p, f.flip, f.sy)
    const item = { grid: g, x, y: baseline - g.length + f.dy }
    x += petDims(p).w + PET_GAP
    return item
  })
}
