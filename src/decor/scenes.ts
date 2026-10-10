import { unzlibSync } from 'fflate'
import { shift } from '../utils/color'
import { IMAGE_SCENES, IMAGE_SCENE_H, IMAGE_SCENE_LEVELS, IMAGE_SCENE_W, type ImageSceneName } from './imageScenes'

// Procedural pixel-art scenes drawn on a tiny canvas, then scaled up with `image-rendering: pixelated`.
// Every scene is monochrome: it only uses tones of one base color (the selected background),
// so depth comes from light/dark steps of that color. tone(0) = base, higher = further from base.
export const SCENE_W = 96
export const SCENE_H = 54

type Ctx = CanvasRenderingContext2D
type Tone = (level: number) => string

const STEP = 9

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

function circle(ctx: Ctx, cx: number, cy: number, r: number, c: string) {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) rect(ctx, cx + x, cy + y, 1, 1, c)
}

function ring(ctx: Ctx, cx: number, cy: number, r: number, c: string) {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++) {
      const d = x * x + y * y
      if (d <= r * r + r * 0.6 && d > (r - 1) * (r - 1) + (r - 1) * 0.6) rect(ctx, cx + x, cy + y, 1, 1, c)
    }
}

function bands(ctx: Ctx, colors: string[], from = 0, to = SCENE_H) {
  const h = (to - from) / colors.length
  colors.forEach((c, i) => rect(ctx, 0, from + Math.floor(i * h), SCENE_W, Math.ceil(h) + 1, c))
}

function hills(ctx: Ctx, base: number, amp: number, freq: number, phase: number, c: string) {
  for (let x = 0; x < SCENE_W; x++) {
    const h = base + Math.round(Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase * 1.7) * (amp / 2))
    rect(ctx, x, h, 1, SCENE_H - h, c)
  }
}

function cloud(ctx: Ctx, x: number, y: number, s: number, c: string, shadow: string) {
  circle(ctx, x, y + 1, s, shadow)
  circle(ctx, x + s + 1, y, s + 1, shadow)
  circle(ctx, x + s * 2 + 2, y + 1, s, shadow)
  circle(ctx, x, y, s, c)
  circle(ctx, x + s + 1, y - 1, s + 1, c)
  circle(ctx, x + s * 2 + 2, y, s, c)
  rect(ctx, x, y + 1, s * 2 + 3, s, c)
}

function sprite(ctx: Ctx, x: number, y: number, rows: string[], colors: Record<string, string>) {
  rows.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (colors[ch]) rect(ctx, x + i, y + j, 1, 1, colors[ch])
    }),
  )
}

function sparkle(ctx: Ctx, x: number, y: number, c: string, core: string) {
  rect(ctx, x - 1, y, 3, 1, c)
  rect(ctx, x, y - 1, 1, 3, c)
  rect(ctx, x, y, 1, 1, core)
}

const HEART_S = ['.x.x.', 'xxxxx', 'xxxxx', '.xxx.', '..x..']
const HEART_L = ['.xx.xx.', 'xhxxxxx', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...']
const FISH = ['..x...x', '.xxx.xx', 'xxxxxxx', '.xxx.xx', '..x...x']

const scenes = {
  'Clouds & sky': (ctx: Ctx, t: Tone) => {
    bands(ctx, [t(0), t(0.5), t(1), t(1.5), t(2)])
    cloud(ctx, 6, 10, 3, t(5), t(4))
    cloud(ctx, 40, 6, 4, t(5), t(4))
    cloud(ctx, 74, 15, 3, t(5), t(4))
    cloud(ctx, 20, 33, 4, t(4), t(3))
    cloud(ctx, 62, 40, 3, t(4), t(3))
    cloud(ctx, 86, 30, 2, t(4), t(3))
  },
  Space: (ctx: Ctx, t: Tone) => {
    const r = rng(7)
    rect(ctx, 0, 0, SCENE_W, SCENE_H, t(0))
    for (let i = 0; i < 60; i++) rect(ctx, r() * SCENE_W, r() * SCENE_H, 1, 1, t(r() > 0.6 ? 5 : 3))
    for (let i = 0; i < 5; i++) sparkle(ctx, 4 + r() * 88, 4 + r() * 46, t(3), t(6))
    // ringed planet
    circle(ctx, 66, 24, 9, t(2))
    circle(ctx, 64, 22, 7, t(3))
    circle(ctx, 62, 27, 1, t(2))
    circle(ctx, 69, 19, 1, t(2))
    for (let x = -16; x <= 16; x++) rect(ctx, 66 + x, 24 + Math.round(x * 0.25), 1, 1, t(5))
    // small moon & planet
    circle(ctx, 18, 38, 4, t(3))
    rect(ctx, 16, 37, 1, 1, t(2))
    circle(ctx, 30, 10, 2, t(4))
    // shooting star
    for (let i = 0; i < 8; i++) rect(ctx, 80 + i, 44 + Math.floor(i / 2), 1, 1, t(Math.max(1, 6 - i * 0.7)))
  },
  'Night sky': (ctx: Ctx, t: Tone) => {
    const r = rng(3)
    bands(ctx, [t(0), t(0.4), t(0.8), t(1.2)], 0, 44)
    for (let i = 0; i < 40; i++) rect(ctx, r() * SCENE_W, r() * 36, 1, 1, t(r() > 0.5 ? 5 : 3))
    for (let i = 0; i < 4; i++) sparkle(ctx, 6 + r() * 84, 4 + r() * 26, t(3), t(6))
    circle(ctx, 76, 11, 6, t(6))
    circle(ctx, 79, 9, 5, t(0.3))
    hills(ctx, 40, 3, 0.09, 1, t(2))
    hills(ctx, 46, 2, 0.15, 3, t(3))
  },
  Hearts: (ctx: Ctx, t: Tone) => {
    const r = rng(14)
    rect(ctx, 0, 0, SCENE_W, SCENE_H, t(0))
    for (let i = 0; i < 18; i++) {
      const big = r() > 0.6
      const lvl = 1 + Math.floor(r() * 3)
      sprite(ctx, r() * (SCENE_W - 7), r() * (SCENE_H - 7), big ? HEART_L : HEART_S, { x: t(lvl), h: t(lvl + 2) })
    }
    for (let i = 0; i < 25; i++) rect(ctx, r() * SCENE_W, r() * SCENE_H, 1, 1, t(3))
  },
  Bubbles: (ctx: Ctx, t: Tone) => {
    const r = rng(21)
    bands(ctx, [t(0), t(0.6), t(1.2), t(1.8)])
    for (let i = 0; i < 14; i++) {
      const x = r() * SCENE_W, y = r() * 44, s = 1 + Math.floor(r() * 3)
      ring(ctx, x, y, s, t(4))
      rect(ctx, x - Math.max(0, s - 1), y - Math.max(0, s - 1), 1, 1, t(6))
    }
    sprite(ctx, 14, 20, FISH, { x: t(3) })
    sprite(ctx, 70, 30, FISH, { x: t(3) })
    // seaweed & sand
    for (let x = 3; x < SCENE_W; x += 9 + Math.floor(r() * 6)) {
      const h = 6 + Math.floor(r() * 8)
      for (let y = 0; y < h; y++) rect(ctx, x + (Math.floor(y / 2) % 2), SCENE_H - 4 - y, 1, 1, t(3))
    }
    hills(ctx, 50, 1, 0.2, 0, t(2.5))
  },
  'Rolling hills': (ctx: Ctx, t: Tone) => {
    const r = rng(5)
    bands(ctx, [t(0), t(0.5), t(1)], 0, 36)
    circle(ctx, 16, 10, 5, t(5))
    cloud(ctx, 54, 8, 3, t(4), t(3))
    hills(ctx, 30, 3, 0.07, 0.5, t(1.8))
    hills(ctx, 37, 3, 0.11, 2, t(2.6))
    hills(ctx, 45, 2, 0.16, 4, t(3.4))
    for (let i = 0; i < 18; i++) {
      const x = r() * SCENE_W, y = 47 + r() * 6
      rect(ctx, x, y, 1, 1, t(6))
      rect(ctx, x, y + 1, 1, 1, t(4.5))
    }
  },
  Sakura: (ctx: Ctx, t: Tone) => {
    const r = rng(9)
    bands(ctx, [t(0), t(0.5), t(1)], 0, 46)
    rect(ctx, 0, 46, SCENE_W, 8, t(2))
    rect(ctx, 66, 22, 3, 24, t(3.5))
    rect(ctx, 59, 29, 8, 2, t(3.5))
    rect(ctx, 68, 26, 9, 2, t(3.5))
    for (let i = 0; i < 14; i++) circle(ctx, 54 + r() * 30, 12 + r() * 16, 3 + Math.round(r() * 2), t(i % 2 ? 4 : 5))
    for (let i = 0; i < 36; i++) rect(ctx, r() * SCENE_W, r() * 52, 1, 1, t(i % 2 ? 4 : 5))
  },
  Rainbow: (ctx: Ctx, t: Tone) => {
    rect(ctx, 0, 0, SCENE_W, SCENE_H, t(0))
    const lvls = [5, 4, 3, 2, 1.5]
    for (let i = 0; i < lvls.length; i++) {
      const R = 32 - i * 3
      for (let y = -R; y <= 0; y++)
        for (let x = -R; x <= R; x++) {
          const d = Math.sqrt(x * x + y * y)
          if (d <= R && d > R - 3) rect(ctx, 48 + x, 46 + y, 1, 1, t(lvls[i]))
        }
    }
    cloud(ctx, 12, 44, 3, t(6), t(4))
    cloud(ctx, 72, 44, 3, t(6), t(4))
    sparkle(ctx, 20, 12, t(3), t(6))
    sparkle(ctx, 80, 8, t(3), t(6))
    sparkle(ctx, 88, 26, t(3), t(6))
  },
} satisfies Record<string, (ctx: Ctx, t: Tone) => void>

export type SceneName = keyof typeof scenes | ImageSceneName
export const SCENE_NAMES = [...Object.keys(scenes), ...Object.keys(IMAGE_SCENES)] as SceneName[]

const cache = new Map<string, string>()
const levelCache = new Map<ImageSceneName, Uint8Array>()

const isImageScene = (name: string): name is ImageSceneName => name in IMAGE_SCENES

function imageLevels(name: ImageSceneName) {
  let levels = levelCache.get(name)
  if (!levels) {
    levels = unzlibSync(Uint8Array.from(atob(IMAGE_SCENES[name]), (ch) => ch.charCodeAt(0)))
    levelCache.set(name, levels)
  }
  return levels
}

/** A picture scene: every darkness level becomes a tone of the base color, the darkest as strong as tone(6). */
function drawImageScene(name: ImageSceneName, tone: Tone) {
  const c = document.createElement('canvas')
  c.width = IMAGE_SCENE_W
  c.height = IMAGE_SCENE_H
  const ctx = c.getContext('2d')!
  const palette = Array.from({ length: IMAGE_SCENE_LEVELS }, (_, l) => {
    const n = parseInt(tone((l * 6) / (IMAGE_SCENE_LEVELS - 1)).slice(1, 7), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  })
  const levels = imageLevels(name)
  const img = ctx.createImageData(IMAGE_SCENE_W, IMAGE_SCENE_H)
  for (let i = 0, p = 0; i < levels.length; i++, p += 4) {
    const rgb = palette[levels[i]] ?? palette[0]
    img.data[p] = rgb[0]
    img.data[p + 1] = rgb[1]
    img.data[p + 2] = rgb[2]
    img.data[p + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return c
}

/** The scene on a small canvas of its own size (drawn scenes are SCENE_W × SCENE_H, pictures are taller than wide). */
export function drawScene(name: SceneName, base: string) {
  const tone: Tone = (level) => shift(base, Math.round(level * STEP))
  if (isImageScene(name)) return drawImageScene(name, tone)
  const c = document.createElement('canvas')
  c.width = SCENE_W
  c.height = SCENE_H
  const ctx = c.getContext('2d')!
  scenes[name](ctx, tone)
  return c
}

export function sceneUrl(name: SceneName | 'none', base: string) {
  if (name === 'none' || !(name in scenes || isImageScene(name))) return undefined
  const key = `${name}|${base}`
  let url = cache.get(key)
  if (!url) {
    url = drawScene(name, base).toDataURL()
    cache.set(key, url)
  }
  return url
}

/** Draws `src` over the whole of `ctx`'s canvas, scaled up to cover it and centered, keeping pixels crisp. */
export function drawCover(ctx: Ctx, src: HTMLCanvasElement) {
  const { width, height } = ctx.canvas
  const k = Math.max(width / src.width, height / src.height)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(src, (width - src.width * k) / 2, (height - src.height * k) / 2, src.width * k, src.height * k)
}

/** Download a crisp, upscaled 1920×1080 PNG of a scene for use as a real wallpaper/background. */
export function downloadScene(name: SceneName, base: string) {
  const big = document.createElement('canvas')
  big.width = 1920
  big.height = 1080
  drawCover(big.getContext('2d')!, drawScene(name, base))
  const a = document.createElement('a')
  a.href = big.toDataURL('image/png')
  a.download = `${name.toLowerCase().replace(/[^a-z]+/g, '-')}-pixel.png`
  a.click()
}
